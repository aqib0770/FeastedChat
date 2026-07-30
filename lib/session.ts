import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { getDb, COLLECTIONS } from '@/lib/db';

export const SESSION_COOKIE = 'fc_session';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getOrCreateSessionKey(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;

  if (existing) {
    const db = await getDb();
    const session = await db.collection(COLLECTIONS.sessions).findOne({ sessionKey: existing });
    if (session) {
      await db
        .collection(COLLECTIONS.sessions)
        .updateOne({ sessionKey: existing }, { $set: { lastSeenAt: new Date() } });
      return existing;
    }
  }

  const sessionKey = randomUUID();
  const now = new Date();

  const db = await getDb();
  await db.collection(COLLECTIONS.sessions).insertOne({
    sessionKey,
    createdAt: now,
    lastSeenAt: now,
  });

  cookieStore.set(SESSION_COOKIE, sessionKey, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
  });

  return sessionKey;
}

export async function requireSessionKey(): Promise<string> {
  const cookieStore = await cookies();
  const sessionKey = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionKey) {
    throw new Error('No session');
  }

  const db = await getDb();
  const session = await db.collection(COLLECTIONS.sessions).findOne({ sessionKey });
  if (!session) {
    throw new Error('Invalid session');
  }

  return sessionKey;
}

export async function assertConversationAccess(
  conversationId: string,
  sessionKey: string
): Promise<void> {
  const { ObjectId } = await import('mongodb');
  if (!ObjectId.isValid(conversationId)) {
    throw new Error('Invalid conversation id');
  }

  const db = await getDb();
  const conversation = await db.collection(COLLECTIONS.conversations).findOne({
    _id: new ObjectId(conversationId),
    sessionKey,
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }
}
