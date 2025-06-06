export interface TextChunk {
  content: string;
  startIndex: number;
  endIndex: number;
  chunkNumber: number;
}

export class TextChunkingService {
  private static readonly CHUNK_SIZE = 3000; // Characters per chunk
  private static readonly OVERLAP_SIZE = 200; // Overlap between chunks

  static chunkText(text: string): TextChunk[] {
    if (!text || text.length <= this.CHUNK_SIZE) {
      return [
        {
          content: text,
          startIndex: 0,
          endIndex: text.length,
          chunkNumber: 1,
        },
      ];
    }

    const chunks: TextChunk[] = [];
    let startIndex = 0;
    let chunkNumber = 1;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + this.CHUNK_SIZE, text.length);

      // Try to break at sentence boundaries to avoid cutting mid-sentence
      if (endIndex < text.length) {
        const lastSentenceEnd = this.findLastSentenceEnd(
          text,
          startIndex,
          endIndex
        );
        if (lastSentenceEnd > startIndex + this.CHUNK_SIZE * 0.7) {
          endIndex = lastSentenceEnd;
        }
      }

      const content = text.substring(startIndex, endIndex).trim();

      if (content.length > 0) {
        chunks.push({
          content,
          startIndex,
          endIndex,
          chunkNumber,
        });
      }

      // Move start index with overlap
      startIndex = endIndex - this.OVERLAP_SIZE;
      if (startIndex >= text.length) break;

      chunkNumber++;
    }

    return chunks;
  }

  private static findLastSentenceEnd(
    text: string,
    start: number,
    end: number
  ): number {
    const chunk = text.substring(start, end);
    const sentenceEnders = [".", "!", "?", "\n\n"];

    let lastSentenceEnd = -1;

    for (const ender of sentenceEnders) {
      const lastIndex = chunk.lastIndexOf(ender);
      if (lastIndex > lastSentenceEnd) {
        lastSentenceEnd = lastIndex;
      }
    }

    return lastSentenceEnd > -1 ? start + lastSentenceEnd + 1 : end;
  }

  static summarizeChunks(chunks: TextChunk[]): string {
    return `Document contains ${
      chunks.length
    } chunks, total length: ${chunks.reduce(
      (sum, chunk) => sum + chunk.content.length,
      0
    )} characters`;
  }
}
