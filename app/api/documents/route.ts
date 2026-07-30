import { NextResponse } from 'next/server';
import { requireSessionKey } from '@/lib/session';
import { ingestPdf, listDocuments } from '@/lib/rag';

export const maxDuration = 120;

export async function GET(req: Request) {
  try {
    const sessionKey = await requireSessionKey();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId') ?? undefined;

    const documents = await listDocuments(sessionKey, conversationId);
    return NextResponse.json(documents);
  } catch (error) {
    console.error('[/api/documents] GET error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message === 'No session' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const sessionKey = await requireSessionKey();
    const formData = await req.formData();

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    const conversationId = formData.get('conversationId')?.toString() || undefined;
    const buffer = Buffer.from(await file.arrayBuffer());

    const document = await ingestPdf(buffer, file.name, sessionKey, conversationId);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('[/api/documents] POST error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status = message === 'No session' || message === 'Invalid session' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
