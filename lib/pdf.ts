export interface TextChunk {
  text: string;
  index: number;
  pageNumber?: number;
}

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export function chunkText(text: string): TextChunk[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    const chunk = normalized.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push({ text: chunk, index });
      index++;
    }

    if (end >= normalized.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}
