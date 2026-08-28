import { NextResponse } from 'next/server';
import { requireSessionKey } from '@/lib/session';
import { deleteMemoryById } from '@/lib/memory';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSessionKey();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing memory ID' }, { status: 400 });
    }

    await deleteMemoryById(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/memories/[id]] DELETE error:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
