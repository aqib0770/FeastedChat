import { NextResponse } from 'next/server';
import { requireSessionKey } from '@/lib/session';
import { getAllMemories, deleteAllMemoriesForUser } from '@/lib/memory';

export async function GET() {
  try {
    const sessionKey = await requireSessionKey();
    const memories = await getAllMemories(sessionKey);
    return NextResponse.json({ memories });
  } catch (err) {
    console.error('[/api/memories] GET error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const sessionKey = await requireSessionKey();
    await deleteAllMemoriesForUser(sessionKey);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/memories] DELETE error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
