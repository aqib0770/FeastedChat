import { NextResponse } from 'next/server';
import { getOrCreateSessionKey } from '@/lib/session';

export async function GET() {
  try {
    const sessionKey = await getOrCreateSessionKey();
    return NextResponse.json({ sessionKey });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
