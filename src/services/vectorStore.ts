import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is required for Gemini AI API calls.");
}
const ai = new GoogleGenAI({ apiKey });

export interface VectorEntry {
  id: string;
  metadata: any;
  embedding: number[];
}

export class VectorStore {
  private entries: VectorEntry[] = [];

  async addEntries(entries: { id: string; metadata: any; text: string }[]) {
    const texts = entries.map(e => e.text);
    
    // Generate embeddings in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const result = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: batch,
      });

      const embeddings = result.embeddings;
      if (!embeddings) throw new Error("No embeddings returned");
      for (let j = 0; j < batch.length; j++) {
        const embedding = embeddings[j]?.values;
        if (!embedding) throw new Error("Missing embedding values");
        this.entries.push({
          id: entries[i + j].id,
          metadata: entries[i + j].metadata,
          embedding,
        });
      }
    }
  }
  
  async search(query: string, limit: number = 5): Promise<VectorEntry[]> {
    const result = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: [query],
    });

    const embeddings = result.embeddings;
    if (!embeddings || !embeddings[0]) throw new Error("No query embedding");
    const queryEmbedding = embeddings[0].values;
    if (!queryEmbedding) throw new Error("No query embedding values");
    
    const scoredEntries = this.entries.map(entry => ({
      entry,
      score: this.cosineSimilarity(queryEmbedding, entry.embedding),
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
  }
}

export const vectorStore = new VectorStore();
