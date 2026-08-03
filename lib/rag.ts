import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';
import { getDb, COLLECTIONS } from '@/lib/db';
import { getQdrantClient, ensureCollection, QDRANT_COLLECTION } from '@/lib/qdrant';
import { embedText, embedTexts } from '@/lib/embeddings';
import { extractTextFromPdf, chunkText } from '@/lib/pdf';
import type { StoredDocument, RetrievedChunk } from '@/types';

const TOP_K = 5;
const SCORE_THRESHOLD = 0.3;

export async function ingestPdf(
  buffer: Buffer,
  filename: string,
  sessionKey: string,
  conversationId?: string
): Promise<StoredDocument> {
  const db = await getDb();
  const now = new Date();
  const documentId = new ObjectId();

  await db.collection(COLLECTIONS.documents).insertOne({
    _id: documentId,
    sessionKey,
    conversationId,
    filename,
    status: 'processing',
    chunkCount: 0,
    createdAt: now,
  });

  try {
    const text = await extractTextFromPdf(buffer);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }

    await ensureCollection();
    const qdrant = getQdrantClient();

    const texts = chunks.map((c) => c.text);
    const embeddings = await embedTexts(texts);

    const points = chunks.map((chunk, i) => ({
      id: randomUUID(),
      vector: embeddings[i],
      payload: {
        documentId: documentId.toString(),
        chunkIndex: chunk.index,
        text: chunk.text,
        sessionKey,
        ...(conversationId ? { conversationId } : {}),
        filename,
      },
    }));

    // Upsert in batches of 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < points.length; i += BATCH_SIZE) {
      await qdrant.upsert(QDRANT_COLLECTION, {
        wait: true,
        points: points.slice(i, i + BATCH_SIZE),
      });
    }

    await db
      .collection(COLLECTIONS.documents)
      .updateOne({ _id: documentId }, { $set: { status: 'ready', chunkCount: chunks.length } });

    return {
      id: documentId.toString(),
      sessionKey,
      conversationId,
      filename,
      status: 'ready',
      chunkCount: chunks.length,
      createdAt: now.toISOString(),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Ingestion failed';
    await db
      .collection(COLLECTIONS.documents)
      .updateOne({ _id: documentId }, { $set: { status: 'error', error: errorMessage } });
    throw err;
  }
}

export async function retrieveContext(
  query: string,
  sessionKey: string,
  conversationId?: string,
  documentIds?: string[]
): Promise<RetrievedChunk[]> {
  await ensureCollection();
  const qdrant = getQdrantClient();

  const queryVector = await embedText(query);

  const must: Array<Record<string, unknown>> = [
    { key: 'sessionKey', match: { value: sessionKey } },
  ];

  if (conversationId) {
    must.push({ key: 'conversationId', match: { value: conversationId } });
  }

  if (documentIds && documentIds.length > 0) {
    must.push({ key: 'documentId', match: { any: documentIds } });
  }

  const results = await qdrant.search(QDRANT_COLLECTION, {
    vector: queryVector,
    limit: TOP_K,
    score_threshold: SCORE_THRESHOLD,
    filter: { must },
    with_payload: true,
  });

  console.log('Results', results);

  return results.map((r) => ({
    text: r.payload?.text as string,
    score: r.score,
    filename: r.payload?.filename as string,
    chunkIndex: r.payload?.chunkIndex as number,
    documentId: r.payload?.documentId as string,
  }));
}

export function buildRagSystemPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return '';

  const context = chunks.map((c, i) => `[${i + 1}] (from "${c.filename}")\n${c.text}`).join('\n\n');

  return `You are a helpful assistant. Use the following context from uploaded documents to answer the user's question. If the context doesn't contain relevant information, say so and answer based on your general knowledge.

---
${context}
---`;
}

export async function attachUnassignedDocuments(
  sessionKey: string,
  conversationId: string
): Promise<void> {
  const db = await getDb();

  const docs = await db
    .collection(COLLECTIONS.documents)
    .find({ sessionKey, conversationId: null as never })
    .toArray();

  if (docs.length === 0) return;

  const documentIds = docs.map((d) => d._id.toString());

  await db
    .collection(COLLECTIONS.documents)
    .updateMany({ sessionKey, conversationId: null as never }, { $set: { conversationId } });

  try {
    await ensureCollection();
    const qdrant = getQdrantClient();
    await qdrant.setPayload(QDRANT_COLLECTION, {
      payload: { conversationId },
      filter: {
        must: [{ key: 'documentId', match: { any: documentIds } }],
      },
    });
  } catch (err) {
    console.warn('[rag] Failed to update Qdrant payload for unassigned documents:', err);
  }
}

export async function deleteDocument(documentId: string, sessionKey: string): Promise<void> {
  const db = await getDb();
  const objectId = new ObjectId(documentId);

  const doc = await db.collection(COLLECTIONS.documents).findOne({
    _id: objectId,
    sessionKey,
  });

  if (!doc) {
    throw new Error('Document not found');
  }

  await ensureCollection();
  const qdrant = getQdrantClient();

  await qdrant.delete(QDRANT_COLLECTION, {
    wait: true,
    filter: {
      must: [{ key: 'documentId', match: { value: documentId } }],
    },
  });

  await db.collection(COLLECTIONS.documents).deleteOne({ _id: objectId });
}

export async function listDocuments(
  sessionKey: string,
  conversationId?: string
): Promise<StoredDocument[]> {
  const db = await getDb();

  const filter: Record<string, unknown> = { sessionKey };
  if (conversationId) {
    filter.conversationId = conversationId;
  }

  const docs = await db
    .collection(COLLECTIONS.documents)
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return docs.map((d) => ({
    id: d._id.toString(),
    sessionKey: d.sessionKey,
    conversationId: d.conversationId,
    filename: d.filename,
    status: d.status,
    chunkCount: d.chunkCount ?? 0,
    error: d.error,
    createdAt: d.createdAt.toISOString(),
  }));
}
