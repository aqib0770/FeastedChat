import { embed, embedMany } from 'ai';
import { getEmbeddingModel, getOllamaEmbeddingModel } from '@/lib/gateway';

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'ollama/nomic-embed-text';

function resolveEmbeddingModel() {
  if (EMBEDDING_MODEL.startsWith('ollama/')) {
    return getOllamaEmbeddingModel(EMBEDDING_MODEL.slice('ollama/'.length));
  }
  return getEmbeddingModel(EMBEDDING_MODEL);
}

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: resolveEmbeddingModel(),
    value: text,
  });
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const { embeddings } = await embedMany({
    model: resolveEmbeddingModel(),
    values: texts,
  });
  return embeddings;
}
