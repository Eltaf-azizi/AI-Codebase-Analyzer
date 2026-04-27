import { GoogleGenAI, Type } from "@google/genai";
import { FileData, AnalysisResult, ChatMessage, ArchitectureNode, ArchitectureLink } from "../types";
import { ParserService } from "./parseService";
import { vectorStore } from "./vectorStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export class AIService {
  private static readonly MODEL_NAME = "gemini-3-flash-preview";
  private static readonly MAX_CONTEXT_BLOCKS = 12;
  
    private static buildChunkText(chunk: ReturnType<typeof ParserService.chunkFile>[number]): string {
    return [
      `File: ${chunk.path}`,
      `Type: ${chunk.type}`,
      `Language: ${chunk.language}`,
      `Name: ${chunk.name || "N/A"}`,
      `Lines: ${chunk.startLine}-${chunk.endLine}`,
      `Characters: ${chunk.charCount}`,
      `Content:\n${chunk.content}`,
    ].join("\n");
  }

  private static rankByKeywords(files: FileData[], message: string): FileData[] {
    const keywords = message.toLowerCase().split(/\W+/).filter((k) => k.length > 2);
    const scored = files.map((file) => {
      const path = file.path.toLowerCase();
      const content = file.content.toLowerCase();
      const score = keywords.reduce((acc, key) => {
        if (path.includes(key)) return acc + 4;
        if (content.includes(key)) return acc + 1;
        return acc;
      }, 0);
      return { file, score };
    });

    return scored
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((entry) => entry.file);
  }

  
  /**
   * Initializes the vector store with codebase chunks.
   */
  static async initialize(files: FileData[]) {
    vectorStore.clear();
    const chunks = files.flatMap(file => ParserService.chunkFile(file));

    return vectorStore.addEntries(chunks.map((chunk, i) => ({
      id: `${chunk.path}-${i}`,
      text: this.buildChunkText(chunk),
      metadata: { 
        path: chunk.path, 
        startLine: chunk.startLine, 
        endLine: chunk.endLine,
        content: chunk.content,
        language: chunk.language,
        name: chunk.name ?? null,
        charCount: chunk.charCount,
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
      const text = response.text;
      if (!text) {
        throw new Error("Empty response from AI");
      }
      const result = JSON.parse(text);
      
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
    let searchResults: Awaited<ReturnType<typeof vectorStore.search>> = [];
    try {
      searchResults = await vectorStore.search(message, 12);
    } catch (error) {
      console.warn("Semantic search failed, continuing with keyword fallback:", error);
    }

    const rankedFiles = this.rankByKeywords(files, message);
    const semanticBlocks = searchResults.map((res) => {
      const path = String(res.metadata.path ?? "unknown");
      const startLine = String(res.metadata.startLine ?? "?");
      const endLine = String(res.metadata.endLine ?? "?");
      const content = String(res.metadata.content ?? "");
      const score = typeof res.score === "number" ? res.score.toFixed(3) : "n/a";
      return {
        id: `${path}:${startLine}-${endLine}`,
        block: `File: ${path}\nLines: ${startLine}-${endLine}\nSemanticScore: ${score}\nContent:\n${content.slice(0, 2500)}`,
      };
    });
    const keywordBlocks = rankedFiles.map((file) => ({
      id: `${file.path}:keyword`,
      block: `File: ${file.path}\nKeywordMatch: true\nContent:\n${file.content.slice(0, 2500)}`,
    }));

    const mergedContext = [...semanticBlocks, ...keywordBlocks];
    const seen = new Set<string>();
    const contextBlocks: string[] = [];
    for (const item of mergedContext) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      contextBlocks.push(item.block);
      if (contextBlocks.length >= this.MAX_CONTEXT_BLOCKS) break;
    }

    const allFilePaths = files.map(f => f.path).join('\n');
    const context = contextBlocks.join("\n\n---\n\n");

    const systemInstruction = `
      You are an expert AI codebase analysis assistant.
      Requirements:
      - Use only the provided files/context. If unsure, explicitly say what is missing.
      - Whenever referencing code, include the exact full file path from the project list.
      - Never invent file paths or symbols.
      - Prefer concise answers with bullets and practical guidance.
      - If user asks to find files/keywords, list every confidently matching file path.

      ALL FILE PATHS:
      ${allFilePaths}

      RETRIEVED CONTEXT:
      ${context || "No context retrieved. Use file list + user query carefully."}
    `;

    const chat = ai.chats.create({
      model: this.MODEL_NAME,
      config: { systemInstruction },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
      }))
    });

    try {
      const response = await chat.sendMessage({ message });
      const text = response.text;
      return text || "No response generated.";
    } catch (error) {
      console.error("Chat generation failed:", error);
      return "I couldn't generate a full answer right now. Try again with a narrower question (for example: exact file, feature, or function name).";
    }
  }
}
