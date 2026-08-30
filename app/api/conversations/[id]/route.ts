import { NextResponse } from 'next/server';
import { requireSessionKey, assertConversationAccess } from '@/lib/session';
import { getDb, COLLECTIONS } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { validateActiveModelIds } from '@/lib/models';

interface FormattedTurnResponse {
  id: string;
  turnId: string;
  modelId: string;
  gatewayId: string;
  content: string;
  status: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface PatchConversationBody {
  title?: string;
  activeModelIds?: string[];
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionKey = await requireSessionKey();
    await assertConversationAccess(id, sessionKey);

    const db = await getDb();
    const objectId = new ObjectId(id);

    const conversation = await db.collection(COLLECTIONS.conversations).findOne({ _id: objectId });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const turns = await db
      .collection(COLLECTIONS.turns)
      .find({ conversationId: objectId })
      .sort({ turnIndex: 1 })
      .toArray();

    const responses = await db
      .collection(COLLECTIONS.responses)
      .find({ conversationId: objectId })
      .toArray();

    const responsesByTurnId = responses.reduce(
      (acc, resp) => {
        const tid = resp.turnId.toString();
        if (!acc[tid]) acc[tid] = [];
        acc[tid].push({
          id: resp._id.toString(),
          turnId: resp.turnId.toString(),
          modelId: resp.modelId,
          gatewayId: resp.gatewayId,
          content: resp.content,
          status: resp.status,
          error: resp.error,
          createdAt: resp.createdAt.toISOString(),
          completedAt: resp.completedAt?.toISOString(),
        });
        return acc;
      },
      {} as Record<string, FormattedTurnResponse[]>
    );

    const formattedTurns = turns.map((turn) => ({
      id: turn._id.toString(),
      turnIndex: turn.turnIndex,
      userMessage: {
        id: `msg_${turn._id.toString()}`,
        content: turn.userMessage.content,
        createdAt: turn.userMessage.createdAt.toISOString(),
      },
      createdAt: turn.createdAt.toISOString(),
      responses: responsesByTurnId[turn._id.toString()] || [],
    }));

    return NextResponse.json({
      conversation: {
        id: conversation._id.toString(),
        title: conversation.title,
        activeModelIds: conversation.activeModelIds,
        updatedAt: conversation.updatedAt.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
      },
      turns: formattedTurns,
    });
  } catch (error) {
    console.error('API /conversations/:id GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionKey = await requireSessionKey();
    await assertConversationAccess(id, sessionKey);

    const body = (await req.json()) as Partial<PatchConversationBody>;
    const updateFields: Partial<PatchConversationBody & { updatedAt: Date }> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateFields.title = body.title;
    if (body.activeModelIds !== undefined) {
      const validation = validateActiveModelIds(body.activeModelIds);
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      updateFields.activeModelIds = validation.value;
    }

    const db = await getDb();
    await db
      .collection(COLLECTIONS.conversations)
      .updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /conversations/:id PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionKey = await requireSessionKey();
    await assertConversationAccess(id, sessionKey);

    const db = await getDb();
    const objectId = new ObjectId(id);

    await Promise.all([
      db.collection(COLLECTIONS.conversations).deleteOne({ _id: objectId }),
      db.collection(COLLECTIONS.turns).deleteMany({ conversationId: objectId }),
      db.collection(COLLECTIONS.responses).deleteMany({ conversationId: objectId }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /conversations/:id DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
