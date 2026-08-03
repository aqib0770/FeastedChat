import { Memory } from 'mem0ai/oss';

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/*  - LLM: Configurable via MEM0_LLM_PROVIDER ('ollama' | 'gateway')    */
/*  - Embeddings: local Ollama (qwen3-embedding:0.6b)                  */
/*  - Vector store: local Qdrant                                       */
/* ------------------------------------------------------------------ */

const MEM0_LLM_PROVIDER = (process.env.MEM0_LLM_PROVIDER ?? 'ollama').toLowerCase();
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY ?? '';
const QDRANT_HOST = process.env.QDRANT_HOST ?? 'localhost';
const QDRANT_PORT = Number(process.env.QDRANT_PORT ?? '6333');

function getLlmConfig() {
  if (MEM0_LLM_PROVIDER === 'gateway' || MEM0_LLM_PROVIDER === 'openai') {
    return {
      provider: 'openai' as const,
      config: {
        model: process.env.MEM0_LLM_MODEL ?? 'openai/gpt-5.4-mini',
        apiKey: AI_GATEWAY_API_KEY,
        baseURL: 'https://gateway.ai.vercel.com/v1',
        timeout: 60,
      },
    };
  }

  // Default: local Ollama
  return {
    provider: 'ollama' as const,
    config: {
      model: process.env.MEM0_LLM_MODEL ?? 'qwen3:4b',
      url: OLLAMA_BASE_URL,
      baseURL: OLLAMA_BASE_URL,
      timeout: 120,
    },
  };
}

const config = {
  llm: getLlmConfig(),
  embedder: {
    provider: 'ollama' as const,
    config: {
      model: 'qwen3-embedding:0.6b',
      url: OLLAMA_BASE_URL,
      baseURL: OLLAMA_BASE_URL,
    },
  },
  vectorStore: {
    provider: 'qdrant' as const,
    config: {
      host: QDRANT_HOST,
      port: QDRANT_PORT,
      collectionName: 'memories',
      embeddingModelDims: 1024,
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Singleton instance                                                 */
/* ------------------------------------------------------------------ */

declare global {
  var _mem0Instance: Memory | undefined;
}

export function getMemory(): Memory {
  if (!global._mem0Instance) {
    global._mem0Instance = new Memory(config);
  }
  return global._mem0Instance;
}

/* ------------------------------------------------------------------ */
/*  Helper types                                                       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Core operations                                                    */
/* ------------------------------------------------------------------ */

/**
 * Extract facts from a conversation exchange and store them.
 *
 * Uses `userId` (= sessionKey) for long-term memory (LTM) and
 * `runId` (= conversationId) for short-term / conversation-scoped memory (STM).
 */
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

/**
 * Search for relevant memories using a semantic query.
 * Searches by `userId` to retrieve long-term memories across all conversations.
 */
/**
 * Search for relevant memories:
 * - LTM: Long-term facts across all past conversations (matching user_id)
 * - STM: Facts extracted during the current active conversation (matching user_id + run_id)
 */
export async function searchMemories(
  query: string,
  userId: string,
  conversationId?: string,
  topK = 5
): Promise<{ ltm: MemoryResult[]; stm: MemoryResult[] }> {
  const memory = getMemory();
  try {
    // 1. Fetch LTM (All past user facts)
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

    // 2. Fetch STM (Facts from current conversation thread only)
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

    // Deduplicate LTM items that are already in STM
    const stmIds = new Set(stmItems.map((m) => m.id));
    const uniqueLtmItems = ltmItems.filter((m) => !stmIds.has(m.id));

    return { ltm: uniqueLtmItems, stm: stmItems };
  } catch (err) {
    console.error('[memory] Search failed:', err);
    return { ltm: [], stm: [] };
  }
}

/**
 * Retrieve all stored memories for a user.
 */
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

/**
 * Delete a single memory by ID.
 */
export async function deleteMemoryById(memoryId: string): Promise<void> {
  const memory = getMemory();
  await memory.delete(memoryId);
}

/**
 * Delete all memories for a user.
 */
export async function deleteAllMemoriesForUser(userId: string): Promise<void> {
  const memory = getMemory();
  await memory.deleteAll({ userId });
}

/**
 * Format retrieved memories into a system prompt section,
 * clearly categorizing Long-Term (past chats) and Short-Term (active chat) context.
 */
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
