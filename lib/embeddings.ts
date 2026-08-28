import { embed, embedMany } from 'ai';
import { getEmbeddingModel } from '@/lib/gateway';

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'openai/text-embedding-3-small';

function resolveEmbeddingModel() {
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
