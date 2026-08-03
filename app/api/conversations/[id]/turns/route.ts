import { NextResponse } from 'next/server';
import { requireSessionKey, assertConversationAccess } from '@/lib/session';
import { getDb, COLLECTIONS } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { truncateTitle } from '@/lib/conversation-utils';
import { getModelById } from '@/lib/models';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionKey = await requireSessionKey();
    await assertConversationAccess(id, sessionKey);

    const body = await req.json();
    if (!body.userMessage || typeof body.userMessage !== 'string') {
      return NextResponse.json(
        { error: 'userMessage is required and must be a string' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const objectId = new ObjectId(id);

    const turnIndex = await db
      .collection(COLLECTIONS.turns)
      .countDocuments({ conversationId: objectId });

    const conversation = await db.collection(COLLECTIONS.conversations).findOne({ _id: objectId });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const now = new Date();
    const turnDoc = {
      conversationId: objectId,
      turnIndex,
      userMessage: { content: body.userMessage, createdAt: now },
      createdAt: now,
    };

    const turnResult = await db.collection(COLLECTIONS.turns).insertOne(turnDoc);
    const turnId = turnResult.insertedId;

    const responseIds: Record<string, string> = {};
    const activeModelIds: string[] = conversation.activeModelIds || [];

    if (activeModelIds.length > 0) {
      const responseDocs = activeModelIds.map((modelId) => {
        const modelConfig = getModelById(modelId);
        return {
          turnId,
          conversationId: objectId,
          modelId,
          gatewayId: modelConfig?.gatewayId || 'unknown',
          content: '',
          status: 'pending',
          createdAt: now,
        };
      });

      const responsesResult = await db.collection(COLLECTIONS.responses).insertMany(responseDocs);

      Object.keys(responsesResult.insertedIds).forEach((key, index) => {
        responseIds[activeModelIds[index]] = responsesResult.insertedIds[Number(key)].toString();
      });
    }

    const updateFields: { updatedAt: Date; title?: string } = { updatedAt: now };
    if (turnIndex === 0) {
      updateFields.title = truncateTitle(body.userMessage);
    }

    await db
      .collection(COLLECTIONS.conversations)
      .updateOne({ _id: objectId }, { $set: updateFields });

    return NextResponse.json(
      {
        turnId: turnId.toString(),
        turnIndex,
        responses: responseIds,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API /conversations/:id/turns POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
