import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
      for (let j = 0; j < batch.length; j++) {
        this.entries.push({
          id: entries[i + j].id,
          metadata: entries[i + j].metadata,
          embedding: embeddings[j].values,
        });
      }
    }
  }
  
}

export const vectorStore = new VectorStore();
