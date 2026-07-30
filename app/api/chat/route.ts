import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { ObjectId } from 'mongodb';
import { getModel } from '@/lib/gateway';
import { getDb, COLLECTIONS } from '@/lib/db';
import { retrieveContext, buildRagSystemPrompt } from '@/lib/rag';
import { requireSessionKey } from '@/lib/session';

export const maxDuration = 60;

/** Extract the latest user message text from UIMessages */
function getLatestUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'user') {
      if (msg.parts) {
        return msg.parts
          .filter((p) => p.type === 'text' && 'text' in p)
          .map((p) => ('text' in p ? p.text : ''))
          .join('');
      }
    }
  }
  return '';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      model,
      conversationId,
      turnId,
      responseId,
      useRag,
      documentIds,
    }: {
      messages: UIMessage[];
      model: string;
      conversationId?: string;
      turnId?: string;
      responseId?: string;
      useRag?: boolean;
      documentIds?: string[];
    } = body;

    if (!model || !messages) {
      return new Response(JSON.stringify({ error: 'Missing required fields: model, messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isPersisted = conversationId && turnId && responseId;

    // Update response status to streaming
    if (isPersisted) {
      try {
        const db = await getDb();
        await db
          .collection(COLLECTIONS.responses)
          .updateOne({ _id: new ObjectId(responseId) }, { $set: { status: 'streaming' } });
      } catch (err) {
        console.warn('[/api/chat] Failed to update status to streaming:', err);
      }
    }

    // RAG: retrieve relevant context when enabled
    let systemPrompt: string | undefined;
    if (useRag) {
      try {
        const sessionKey = await requireSessionKey();
        const query = getLatestUserText(messages);
        if (query) {
          const chunks = await retrieveContext(query, sessionKey, conversationId, documentIds);
          systemPrompt = buildRagSystemPrompt(chunks) || undefined;
        }
      } catch (err) {
        console.warn('[/api/chat] RAG retrieval failed, continuing without context:', err);
      }
    }

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: getModel(model),
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: modelMessages,
      onFinish: async ({ text }) => {
        if (isPersisted) {
          try {
            const db = await getDb();
            await db.collection(COLLECTIONS.responses).updateOne(
              { _id: new ObjectId(responseId) },
              {
                $set: {
                  content: text,
                  status: 'complete',
                  completedAt: new Date(),
                },
              }
            );
          } catch (err) {
            console.error('[/api/chat] Failed to save response:', err);
          }
        }
      },
      onError: async ({ error }) => {
        if (isPersisted) {
          try {
            const db = await getDb();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await db.collection(COLLECTIONS.responses).updateOne(
              { _id: new ObjectId(responseId) },
              {
                $set: {
                  status: 'error',
                  error: errorMessage,
                  completedAt: new Date(),
                },
              }
            );
          } catch (err) {
            console.error('[/api/chat] Failed to save error status:', err);
          }
        }
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error) {
    console.error('[/api/chat] Error:', error);

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
