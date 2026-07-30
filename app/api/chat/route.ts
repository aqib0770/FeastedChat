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

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      messages,
      model,
      conversationId,
      turnId,
      responseId,
    }: {
      messages: UIMessage[];
      model: string;
      conversationId?: string;
      turnId?: string;
      responseId?: string;
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

    const result = streamText({
      model: getModel(model),
      messages: await convertToModelMessages(messages),
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
