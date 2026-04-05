import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { FileData, AnalysisResult, ChatMessage, ArchitectureNode, ArchitectureLink } from "../types";
import { ParserService } from "./parserService";
import { vectorStore } from "./vectorStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export class AIService {
  private static readonly MODEL_NAME = "gemini-3-flash-preview";
  private static isInitialized = false;

  /**
   * Initializes the vector store with codebase chunks.
   */
  static async initialize(files: FileData[]) {
    if (this.isInitialized) return;
    
    vectorStore.clear();
    const chunks = files.flatMap(file => ParserService.chunkFile(file));
    
    await vectorStore.addEntries(chunks.map((chunk, i) => ({
      id: `${chunk.path}-${i}`,
      text: `File: ${chunk.path}\nType: ${chunk.type}\nName: ${chunk.name || 'N/A'}\nContent:\n${chunk.content}`,
      metadata: { 
        path: chunk.path, 
        startLine: chunk.startLine, 
        endLine: chunk.endLine,
        content: chunk.content // Store content for context retrieval
      }
    })));

    this.isInitialized = true;
  }
  
}
