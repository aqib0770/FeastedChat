import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL ?? 'http://127.0.0.1:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

export const QDRANT_COLLECTION = 'document_chunks';
export const VECTOR_SIZE = 1024;

declare global {
  var _qdrantClient: QdrantClient | undefined;
  var _qdrantCollectionReady: boolean | undefined;
}

function createClient(): QdrantClient {
  return new QdrantClient({
    url: QDRANT_URL,
    ...(QDRANT_API_KEY ? { apiKey: QDRANT_API_KEY } : {}),
  });
}

export function getQdrantClient(): QdrantClient {
  if (!global._qdrantClient) {
    global._qdrantClient = createClient();
  }
  return global._qdrantClient;
}

export async function ensureCollection(): Promise<void> {
  if (global._qdrantCollectionReady) return;

  const client = getQdrantClient();
  const collections = await client.getCollections();
  const exists = collections.collections.some((c) => c.name === QDRANT_COLLECTION);

  if (!exists) {
    await client.createCollection(QDRANT_COLLECTION, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    });

    await client.createPayloadIndex(QDRANT_COLLECTION, {
      field_name: 'sessionKey',
      field_schema: 'keyword',
    });
    await client.createPayloadIndex(QDRANT_COLLECTION, {
      field_name: 'documentId',
      field_schema: 'keyword',
    });
    await client.createPayloadIndex(QDRANT_COLLECTION, {
      field_name: 'conversationId',
      field_schema: 'keyword',
    });
  }

  global._qdrantCollectionReady = true;
}
