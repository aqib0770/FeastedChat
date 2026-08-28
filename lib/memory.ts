import { Memory } from 'mem0ai/oss';

const QDRANT_HOST = process.env.QDRANT_HOST ?? 'localhost';
const QDRANT_PORT = Number(process.env.QDRANT_PORT ?? '6333');

const MEM0_EMBEDDER_MODEL = process.env.MEM0_EMBEDDER_MODEL ?? 'text-embedding-3-small';
const MEM0_EMBEDDER_DIMS = Number(process.env.MEM0_EMBEDDER_DIMS ?? '1536');

function getLlmConfig() {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_GATEWAY_API_KEY ?? '';
  const baseURL = process.env.OPENAI_BASE_URL
    ? process.env.OPENAI_BASE_URL
    : process.env.AI_GATEWAY_API_KEY && !process.env.OPENAI_API_KEY
      ? 'https://ai-gateway.vercel.sh/v4/ai'
      : undefined;

  return {
    provider: 'openai' as const,
    config: {
      model: process.env.MEM0_LLM_MODEL ?? 'gpt-4o-mini',
      apiKey,
      ...(baseURL ? { baseURL } : {}),
      temperature: 0.2,
      maxTokens: 2000,
    },
  };
}

function getEmbedderConfig() {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_GATEWAY_API_KEY ?? '';
  const baseURL = process.env.OPENAI_BASE_URL
    ? process.env.OPENAI_BASE_URL
    : process.env.AI_GATEWAY_API_KEY && !process.env.OPENAI_API_KEY
      ? 'https://ai-gateway.vercel.sh/v4/ai'
      : undefined;

  return {
    provider: 'openai' as const,
    config: {
      model: MEM0_EMBEDDER_MODEL,
      apiKey,
      ...(baseURL ? { baseURL } : {}),
      embeddingDims: MEM0_EMBEDDER_DIMS,
    },
  };
}

const config = {
  llm: getLlmConfig(),
  embedder: getEmbedderConfig(),
  vectorStore: {
    provider: 'qdrant' as const,
    config: {
      host: QDRANT_HOST,
      port: QDRANT_PORT,
      collectionName: 'memories',
      embeddingModelDims: MEM0_EMBEDDER_DIMS,
    },
  },
};

declare global {
  var _mem0Instance: Memory | undefined;
}

export function getMemory(): Memory {
  if (!global._mem0Instance) {
    global._mem0Instance = new Memory(config);
  }
  return global._mem0Instance;
}

export interface MemoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MemoryResult {
  id: string;
  memory: string;
  score?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export async function addMemories(
  messages: MemoryMessage[],
  userId: string,
  conversationId?: string
): Promise<void> {
  const memory = getMemory();
  try {
    await memory.add(messages, {
      userId,
      ...(conversationId ? { runId: conversationId } : {}),
    });
  } catch (err) {
    console.error('[memory] Failed to add memories:', err);
    throw err;
  }
}

export async function searchMemories(
  query: string,
  userId: string,
  conversationId?: string,
  topK = 5
): Promise<{ ltm: MemoryResult[]; stm: MemoryResult[] }> {
  const memory = getMemory();
  try {
    const ltmRes = await memory.search(query, {
      topK,
      filters: { user_id: userId },
    });
    const ltmItems = (ltmRes?.results ?? []).map((r) => ({
      id: r.id ?? '',
      memory: r.memory ?? '',
      score: r.score,
      metadata: r.metadata,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    let stmItems: MemoryResult[] = [];
    if (conversationId) {
      const stmRes = await memory.search(query, {
        topK,
        filters: { user_id: userId, run_id: conversationId },
      });
      stmItems = (stmRes?.results ?? []).map((r) => ({
        id: r.id ?? '',
        memory: r.memory ?? '',
        score: r.score,
        metadata: r.metadata,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    }

    const stmIds = new Set(stmItems.map((m) => m.id));
    const uniqueLtmItems = ltmItems.filter((m) => !stmIds.has(m.id));

    return { ltm: uniqueLtmItems, stm: stmItems };
  } catch (err) {
    console.error('[memory] Search failed:', err);
    return { ltm: [], stm: [] };
  }
}

export async function getAllMemories(userId: string): Promise<MemoryResult[]> {
  const memory = getMemory();
  try {
    const results = await memory.getAll({
      filters: { user_id: userId },
    });

    const items = results?.results ?? [];

    return items.map((r) => ({
      id: r.id ?? '',
      memory: r.memory ?? '',
      metadata: r.metadata,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  } catch (err) {
    console.error('[memory] getAll failed:', err);
    return [];
  }
}

export async function deleteMemoryById(memoryId: string): Promise<void> {
  const memory = getMemory();
  await memory.delete(memoryId);
}

export async function deleteAllMemoriesForUser(userId: string): Promise<void> {
  const memory = getMemory();
  await memory.deleteAll({ userId });
}
export function buildMemorySystemPrompt(memories: {
  ltm: MemoryResult[];
  stm: MemoryResult[];
}): string {
  const sections: string[] = [];

  if (memories.ltm.length > 0) {
    const ltmFacts = memories.ltm.map((m) => `- ${m.memory}`).join('\n');
    sections.push(
      `Known user facts & preferences from past conversations (Long-Term Memory):\n${ltmFacts}`
    );
  }

  if (memories.stm.length > 0) {
    const stmFacts = memories.stm.map((m) => `- ${m.memory}`).join('\n');
    sections.push(
      `Facts extracted from this active conversation (Short-Term Memory):\n${stmFacts}`
    );
  }

  if (sections.length === 0) return '';

  return `${sections.join('\n\n')}

Use this context naturally in your responses. Do not explicitly mention "your memory" or "I remember" unless the user asks what you know about them.`;
}
