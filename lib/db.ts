import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/feastedchat';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoIndexesCreated: boolean | undefined;
}

function createClient(): Promise<MongoClient> {
  const client = new MongoClient(uri);
  return client.connect();
}

const clientPromise = global._mongoClientPromise ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  global._mongoClientPromise = clientPromise;
}

async function ensureIndexes(db: Db): Promise<void> {
  if (global._mongoIndexesCreated) return;
  global._mongoIndexesCreated = true;

  try {
    await Promise.all([
      db.collection(COLLECTIONS.sessions).createIndex({ sessionKey: 1 }, { unique: true }),
      db.collection(COLLECTIONS.conversations).createIndex({ sessionKey: 1, updatedAt: -1 }),
      db
        .collection(COLLECTIONS.turns)
        .createIndex({ conversationId: 1, turnIndex: 1 }, { unique: true }),
      db.collection(COLLECTIONS.responses).createIndex({ turnId: 1, modelId: 1 }, { unique: true }),
      db.collection(COLLECTIONS.responses).createIndex({ conversationId: 1 }),
      db.collection(COLLECTIONS.documents).createIndex({ sessionKey: 1, createdAt: -1 }),
      db.collection(COLLECTIONS.documents).createIndex({ conversationId: 1 }),
    ]);
  } catch (err) {
    console.warn('[db] Index creation warning:', err);
  }
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  const db = client.db();
  await ensureIndexes(db);
  return db;
}

export const COLLECTIONS = {
  sessions: 'sessions',
  conversations: 'conversations',
  turns: 'turns',
  responses: 'responses',
  documents: 'documents',
} as const;
