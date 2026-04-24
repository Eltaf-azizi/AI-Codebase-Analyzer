import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface VectorEntry {
  id: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export interface IndexingStats {
  attempted: number;
  indexed: number;
  failed: number;
}

export class VectorStore {
  private entries: VectorEntry[] = [];
  private lastIndexingStats: IndexingStats = { attempted: 0, indexed: 0, failed: 0 };

  async addEntries(entries: { id: string; metadata: Record<string, unknown>; text: string }[]): Promise<IndexingStats> {
    const texts = entries.map(e => e.text);
    const stats: IndexingStats = { attempted: entries.length, indexed: 0, failed: 0 };
    
    // Generate embeddings in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      let embeddings: { values?: number[] }[] | undefined;
      let attempts = 0;
      while (attempts < 3 && !embeddings) {
        attempts += 1;
        try {
          const result = await ai.models.embedContent({
            model: "gemini-embedding-2-preview",
            contents: batch,
          });
          embeddings = result.embeddings;
        } catch (error) {
          if (attempts === 3) {
            console.warn("Embedding batch failed after retries:", error);
          } else {
            await this.sleep(200 * attempts);
          }
        }
      }

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
    }

    this.lastIndexingStats = stats;
    return stats;
  }
  
  async search(query: string, limit: number = 5): Promise<VectorEntry[]> {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: [query],
    });

    const embeddings = result.embeddings;
    if (!embeddings || !embeddings[0]?.values) {
      return [];
    }
    const queryEmbedding = embeddings[0].values;
    
    const scoredEntries = this.entries.map(entry => ({
      entry,
      score: entry.embedding ? this.cosineSimilarity(queryEmbedding, entry.embedding) : 0,
    }));

    return scoredEntries
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.entry);
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
    this.lastIndexingStats = { attempted: 0, indexed: 0, failed: 0 };
  }

  getEntryCount(): number {
    return this.entries.length;
  }

  getLastIndexingStats(): IndexingStats {
    return this.lastIndexingStats;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const vectorStore = new VectorStore();
