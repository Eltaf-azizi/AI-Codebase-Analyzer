import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { FileData, AnalysisResult, ChatMessage, ArchitectureNode, ArchitectureLink } from "../types";
import { ParserService } from "./parseService";
import { vectorStore } from "./vectorStore";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is required for Gemini AI API calls.");
}
const ai = new GoogleGenAI({ apiKey });

export class AIService {
  private static readonly MODEL_NAME = "gemini-3-flash-preview";

  /**
   * Initializes the vector store with codebase chunks.
   */
  static async initialize(files: FileData[]) {
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
  
  /**
   * Handles interactive chat with RAG.
   */
  static async chat(files: FileData[], message: string, history: ChatMessage[]): Promise<string> {
    // 1. Semantic search for relevant chunks
    const searchResults = await vectorStore.search(message, 10);
    
    const context = searchResults
      .map(res => `File: ${res.metadata.path}\nLines: ${res.metadata.startLine}-${res.metadata.endLine}\nContent:\n${res.metadata.content || res.id}`) // We should store content in metadata if we want it here easily
      .join('\n\n---\n\n');

    // Fallback to keyword search if semantic search is too sparse or we want more context
    const keywords = message.toLowerCase().split(/\W+/).filter(k => k.length > 2);
    const keywordFiles = files.filter(f => {
      const pathLower = f.path.toLowerCase();
      return keywords.some(k => pathLower.includes(k));
    }).slice(0, 5);

    const keywordContext = keywordFiles
      .map(f => `File: ${f.path}\nContent:\n${f.content.slice(0, 4000)}`)
      .join('\n\n---\n\n');

    const allFilePaths = files.map(f => f.path).join('\n');

    const systemInstruction = `
      You are an expert AI Codebase Analyzer. You have access to the codebase provided below.
      
      USER CAPABILITY: The user can ask you to find specific files, search for keywords, or provide their own code snippets for analysis.
      YOUR TASK:
      - If the user asks for a file or keyword, search through the provided file list and relevant content.
      - ALWAYS display the full file path for any file you mention.
      - If multiple files match a search query (by name or content), list ALL of them with their full paths.
      - If the user provides a code snippet, analyze it and explain its purpose, functionality, and suggest potential improvements.
      - Provide relevant code snippets and file paths from the project when applicable.
      
      ALL FILES IN PROJECT:
      ${allFilePaths}
      
      RELEVANT CONTEXT (Semantic Search & Keyword Match):
      ${context}
      ${keywordContext}
    `;

    const chat = ai.chats.create({
      model: this.MODEL_NAME,
      config: { systemInstruction },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
      }))
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  }
}
