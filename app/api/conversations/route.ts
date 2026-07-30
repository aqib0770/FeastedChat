import { NextResponse } from 'next/server';
import { requireSessionKey } from '@/lib/session';
import { getDb, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const sessionKey = await requireSessionKey();
    const db = await getDb();

    const conversations = await db
      .collection(COLLECTIONS.conversations)
      .find({ sessionKey })
      .sort({ updatedAt: -1 })
      .toArray();

    const formatted = conversations.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      activeModelIds: c.activeModelIds,
      updatedAt: c.updatedAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('API /conversations GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionKey = await requireSessionKey();
    const body = await req.json();

    if (!body.activeModelIds || !Array.isArray(body.activeModelIds)) {
      return NextResponse.json({ error: 'Invalid activeModelIds' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date();

    const doc = {
      title: 'New conversation',
      sessionKey,
      activeModelIds: body.activeModelIds,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(COLLECTIONS.conversations).insertOne(doc);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        title: doc.title,
        activeModelIds: doc.activeModelIds,
        updatedAt: doc.updatedAt.toISOString(),
        createdAt: doc.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API /conversations POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
