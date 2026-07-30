import { NextResponse } from 'next/server';
import { requireSessionKey } from '@/lib/session';
import { deleteDocument } from '@/lib/rag';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionKey = await requireSessionKey();
    const { id } = await params;

    await deleteDocument(id, sessionKey);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[/api/documents/[id]] DELETE error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status =
      message === 'No session' || message === 'Invalid session'
        ? 401
        : message === 'Document not found'
          ? 404
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
