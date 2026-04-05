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
  
  /**
   * Generates a comprehensive project analysis.
   */
  static async analyzeProject(files: FileData[]): Promise<AnalysisResult> {
    // 1. Create a condensed context
    const context = files
      .filter(f => f.size && f.size < 50000) // Skip very large files for initial summary
      .slice(0, 50) // Limit to top 50 files for initial scan
      .map(f => `File: ${f.path}\nContent:\n${f.content.slice(0, 3000)}...`)
      .join('\n\n---\n\n');

    const systemInstruction = `
      You are a Senior Software Architect. Analyze the provided codebase and generate a structured JSON response.
      Focus on:
      - High-level project summary (what it does, tech stack).
      - Architecture overview (patterns, structure).
      - Key features.
      - Potential improvements (performance, readability).
      - Security analysis (vulnerabilities, hardcoded secrets).
    `;

    const response = await ai.models.generateContent({
      model: this.MODEL_NAME,
      contents: `Codebase Context:\n${context}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            architecture: { type: Type.STRING },
            features: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            security: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "architecture", "features", "improvements", "security"]
        }
      }
    });

    try {
      const result = JSON.parse(response.text);
      
      // 2. Extract architecture data for visualization
      const nodes: ArchitectureNode[] = [];
      const links: ArchitectureLink[] = [];
      const depMap = new Map<string, string[]>();

      files.forEach(file => {
        const deps = ParserService.getDependencies(file);
        depMap.set(file.path, deps);
        nodes.push({ id: file.path, type: 'file', group: 1 });
      });

      // Add dependency nodes and links
      depMap.forEach((deps, source) => {
        deps.forEach(dep => {
          if (!nodes.find(n => n.id === dep)) {
            nodes.push({ id: dep, type: 'dependency', group: 2 });
          }
          links.push({ source, target: dep, value: 1 });
        });
      });

      return {
        ...result,
        architectureData: { nodes, links }
      };
    } catch (e) {
      console.error("Failed to parse analysis JSON:", e);
      throw new Error("Analysis failed to produce structured output.");
    }
  }
  
}
