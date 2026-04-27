import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface VectorEntry {
  id: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  score?: number;
}

export interface IndexingStats {
  attempted: number;
  indexed: number;
  failed: number;
}

export class VectorStore {
  private entries: VectorEntry[] = [];
  private readonly EMBEDDING_MODEL = "gemini-embedding-2-preview";
  private readonly BATCH_SIZE = 50;

  private async embedWithRetry(contents: string[], retries = 2) {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await ai.models.embedContent({
          model: this.EMBEDDING_MODEL,
          contents,
        });
      } catch (error) {
        lastError = error;
        if (attempt === retries) break;
        const delay = 200 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  async addEntries(entries: { id: string; metadata: Record<string, unknown>; text: string }[]): Promise<IndexingStats> {
    const texts = entries.map(e => e.text);
    const stats: IndexingStats = { attempted: entries.length, indexed: 0, failed: 0 };

    for (let i = 0; i < texts.length; i += this.BATCH_SIZE) {
      const batch = texts.slice(i, i + this.BATCH_SIZE);
      try {
        const result = await this.embedWithRetry(batch);
        const embeddings = result.embeddings;
        if (!embeddings) {
          stats.failed += batch.length;
          continue;
        }

        for (let j = 0; j < batch.length; j++) {
          const values = embeddings[j]?.values;
          if (!values) {
            stats.failed += 1;
            continue;
          }
          this.entries.push({
            id: entries[i + j].id,
            metadata: entries[i + j].metadata,
            embedding: values,
          });
          stats.indexed += 1;
        }
      } catch (error) {
        console.warn("Embedding batch failed after retries:", error);
        stats.failed += batch.length;
      }
    }

    return stats;
  }
  
  async search(query: string, limit: number = 5): Promise<VectorEntry[]> {
    const result = await this.embedWithRetry([
      query,
    ]);
    const embeddings = result.embeddings;
    if (!embeddings || !embeddings[0]?.values) {
      return [];
    }
    const queryEmbedding = embeddings[0].values;

    const scoredEntries = this.entries.map(entry => ({
      ...entry,
      score: entry.embedding ? this.cosineSimilarity(queryEmbedding, entry.embedding) : 0,
    }));

    return scoredEntries
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit);
  }

  async semanticScore(query: string, candidateText: string): Promise<number> {
    const result = await ai.models.embedContent({
      model: this.EMBEDDING_MODEL,
      contents: [query],
    });
    const queryEmbedding = result.embeddings?.[0]?.values;
    if (!queryEmbedding) return 0;
    const candidateEmbedding = (await this.embedWithRetry([candidateText])).embeddings?.[0]?.values;
    if (!candidateEmbedding) return 0;
    return this.cosineSimilarity(queryEmbedding, candidateEmbedding);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  clear() {
    this.entries = [];
  }
}

export const vectorStore = new VectorStore();
