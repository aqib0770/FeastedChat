import { NextResponse } from 'next/server';
import { requireSessionKey } from '@/lib/session';
import { getDb, COLLECTIONS } from '@/lib/db';
import { ObjectId } from 'mongodb';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createSnippet(text: string, query: string, window = 40): string {
  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) {
    const trimmed = text.trim().replace(/\s+/g, ' ');
    if (trimmed.length <= 80) return trimmed;
    return trimmed.slice(0, 80).trimEnd() + '…';
  }
  const start = Math.max(0, idx - window);
  const end = Math.min(text.length, idx + query.length + window);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  const raw = text.slice(start, end).replace(/\s+/g, ' ');
  return prefix + raw + suffix;
}

export async function GET(req: Request) {
  try {
    const sessionKey = await requireSessionKey();
    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get('q')?.trim() ?? '';
    const limitParam = parseInt(searchParams.get('limit') ?? '20', 10);
    const limit = Number.isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 50);

    if (!rawQ || rawQ.length < 2) {
      return NextResponse.json([]);
    }
    if (rawQ.length > 200) {
      return NextResponse.json({ error: 'Query too long' }, { status: 400 });
    }

    const db = await getDb();

    // 1) Scope to user's conversations (uses { sessionKey: 1, updatedAt: -1 } index)
    const convDocs = await db
      .collection(COLLECTIONS.conversations)
      .find({ sessionKey }, { projection: { _id: 1 } })
      .toArray();

    if (convDocs.length === 0) {
      return NextResponse.json([]);
    }

    const conversationObjectIds = convDocs.map((d) => d._id as ObjectId);
    const rx = new RegExp(escapeRegExp(rawQ), 'i');

    // 2) Parallel regex searches — substring matching via $regex (lib/db.ts:28 concepts)
    const [turnHits, responseHits, titleHits] = await Promise.all([
      db
        .collection(COLLECTIONS.turns)
        .find({ conversationId: { $in: conversationObjectIds }, 'userMessage.content': rx })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
      db
        .collection(COLLECTIONS.responses)
        .find({ conversationId: { $in: conversationObjectIds }, content: rx })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
      db.collection(COLLECTIONS.conversations).find({ sessionKey, title: rx }).limit(100).toArray(),
    ]);

    // 3) Build turnId -> turnIndex map for response hits
    const responseTurnIds = [...new Set(responseHits.map((r) => r.turnId.toString()))];
    const turnIdToIndex = new Map<string, number>();

    // From turnHits we already know some indices
    for (const t of turnHits) {
      turnIdToIndex.set(t._id.toString(), t.turnIndex as number);
    }

    // Fetch remaining turn docs for response-only hits
    const missingTurnIds = responseTurnIds.filter((id) => !turnIdToIndex.has(id));
    if (missingTurnIds.length > 0) {
      const missingObjectIds = missingTurnIds
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      if (missingObjectIds.length > 0) {
        const missingTurns = await db
          .collection(COLLECTIONS.turns)
          .find({ _id: { $in: missingObjectIds } })
          .toArray();
        for (const t of missingTurns) {
          turnIdToIndex.set(t._id.toString(), t.turnIndex as number);
        }
      }
    }

    // 4) Fetch conversation metadata for all hit conversation ids
    const hitConvIdStrings = new Set<string>();
    for (const t of turnHits) hitConvIdStrings.add(t.conversationId.toString());
    for (const r of responseHits) hitConvIdStrings.add(r.conversationId.toString());
    for (const c of titleHits) hitConvIdStrings.add(c._id.toString());

    const hitConvObjectIds = [...hitConvIdStrings]
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    if (hitConvObjectIds.length === 0) {
      return NextResponse.json([]);
    }

    const hitConvs = await db
      .collection(COLLECTIONS.conversations)
      .find({ _id: { $in: hitConvObjectIds } })
      .toArray();

    const convMeta = new Map<string, { title: string; updatedAt: Date; createdAt: Date }>();
    for (const c of hitConvs) {
      convMeta.set(c._id.toString(), {
        title: c.title as string,
        updatedAt: c.updatedAt as Date,
        createdAt: c.createdAt as Date,
      });
    }

    // 5) Aggregate per conversation
    type Grouped = {
      id: string;
      title: string;
      updatedAt: string;
      createdAt: string;
      rawUpdatedAt: Date;
      matches: Array<{
        kind: 'user' | 'assistant' | 'title';
        turnIndex: number | null;
        modelId?: string;
        snippet: string;
      }>;
    };

    const grouped = new Map<string, Grouped>();

    function ensureGroup(convId: string): Grouped {
      let g = grouped.get(convId);
      if (!g) {
        const meta = convMeta.get(convId);
        g = {
          id: convId,
          title: meta?.title ?? 'Untitled Conversation',
          updatedAt: meta?.updatedAt ? meta.updatedAt.toISOString() : new Date().toISOString(),
          createdAt: meta?.createdAt ? meta.createdAt.toISOString() : new Date().toISOString(),
          rawUpdatedAt: meta?.updatedAt ?? new Date(0),
          matches: [],
        };
        grouped.set(convId, g);
      }
      return g;
    }

    // De-duplicate matches per conversation+turn+kind to avoid duplicate items
    const seen = new Set<string>();

    for (const t of turnHits) {
      const convId = t.conversationId.toString();
      const turnIndex = t.turnIndex as number;
      const key = `${convId}:user:${turnIndex}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const g = ensureGroup(convId);
      const content = (t.userMessage?.content as string) ?? '';
      g.matches.push({
        kind: 'user',
        turnIndex,
        snippet: createSnippet(content, rawQ),
      });
    }

    for (const r of responseHits) {
      const convId = r.conversationId.toString();
      const turnIdStr = r.turnId.toString();
      const turnIndex = turnIdToIndex.get(turnIdStr) ?? null;
      // Skip responses where we can't resolve turnIndex (should be rare)
      if (turnIndex === null) continue;
      const modelId = r.modelId as string;
      const key = `${convId}:assistant:${turnIndex}:${modelId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const g = ensureGroup(convId);
      const content = (r.content as string) ?? '';
      if (!content) continue;
      g.matches.push({
        kind: 'assistant',
        turnIndex,
        modelId,
        snippet: createSnippet(content, rawQ),
      });
    }

    for (const c of titleHits) {
      const convId = c._id.toString();
      const key = `${convId}:title`;
      if (seen.has(key)) continue;
      seen.add(key);
      const g = ensureGroup(convId);
      // Avoid adding a redundant title match if conversation already has user/assistant hits
      // Still add it if it's the only match — ensures title-only results appear.
      const hasContentMatch = g.matches.some((m) => m.kind !== 'title');
      if (hasContentMatch && g.matches.length > 0) continue;
      g.matches.push({
        kind: 'title',
        turnIndex: null,
        snippet: createSnippet((c.title as string) ?? '', rawQ),
      });
    }

    // Prioritize user matches first within each conversation, then assistant, then title
    const kindRank: Record<string, number> = { user: 0, assistant: 1, title: 2 };
    for (const g of grouped.values()) {
      g.matches.sort((a, b) => {
        const ra = kindRank[a.kind] ?? 9;
        const rb = kindRank[b.kind] ?? 9;
        if (ra !== rb) return ra - rb;
        return (a.turnIndex ?? 9999) - (b.turnIndex ?? 9999);
      });
      // Keep at most 3 matches per conversation (most relevant)
      if (g.matches.length > 3) g.matches = g.matches.slice(0, 3);
    }

    // Sort conversations by relevance (more matches first) then recency
    const results = [...grouped.values()]
      .filter((g) => g.matches.length > 0)
      .sort((a, b) => {
        if (b.matches.length !== a.matches.length) return b.matches.length - a.matches.length;
        return b.rawUpdatedAt.getTime() - a.rawUpdatedAt.getTime();
      })
      .slice(0, limit)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ rawUpdatedAt: _rawUpdatedAt, ...rest }) => rest);

    return NextResponse.json(results);
  } catch (error) {
    console.error('API /search GET error:', error);
    if (
      error instanceof Error &&
      (error.message === 'No session' || error.message === 'Invalid session')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
