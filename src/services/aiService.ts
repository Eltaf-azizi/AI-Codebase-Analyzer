import { GoogleGenAI, Type } from "@google/genai";
import { FileData, AnalysisResult, ChatMessage, ArchitectureNode, ArchitectureLink } from "../types";
import { ParserService } from "./parseService";
import { vectorStore } from "./vectorStore";
import { dedupeCandidates, pickKeywordFiles, tokenizeQuery } from "../lib/ranking";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export class AIService {
  private static readonly MODEL_NAME = "gemini-3-flash-preview";

  /**
   * Initializes the vector store with codebase chunks.
   */
  static async initialize(files: FileData[]) {
    vectorStore.clear();
    const chunks = files.flatMap(file => ParserService.chunkFile(file));
    
    const stats = await vectorStore.addEntries(chunks.map((chunk, i) => ({
      id: `${chunk.path}-${i}`,
      text: `File: ${chunk.path}\nType: ${chunk.type}\nLanguage: ${chunk.language}\nName: ${chunk.name || 'N/A'}\nContent:\n${chunk.content}`,
      metadata: { 
        path: chunk.path, 
        startLine: chunk.startLine, 
        endLine: chunk.endLine,
        content: chunk.content,
        type: chunk.type,
        language: chunk.language,
        charCount: chunk.charCount,
      }
    })));
    return stats;
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

    const indexing = await this.initialize(files);

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
        indexing,
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
    // 1) Ensure an index exists for retrieval
    if (vectorStore.getEntryCount() === 0) {
      await this.initialize(files);
    }

    // 2) Hybrid retrieval (semantic + keyword/path hint)
    const searchResults = await vectorStore.search(message, 14);
    const keywords = tokenizeQuery(message);
    const keywordFiles = pickKeywordFiles(files, keywords, 8);

    const semanticCandidates = searchResults.map((res, index) => {
      const path = String(res.metadata.path ?? "unknown");
      const content = String(res.metadata.content ?? "");
      const startLine = String(res.metadata.startLine ?? "?");
      const endLine = String(res.metadata.endLine ?? "?");
      return {
        path,
        score: 100 - index,
        content: `File: ${path}\nLines: ${startLine}-${endLine}\nContent:\n${content}`,
      };
    });

    const keywordCandidates = keywordFiles.map((file, index) => ({
      path: file.path,
      score: 60 - index,
      content: `File: ${file.path}\nContent:\n${file.content.slice(0, 3500)}`,
    }));

    const combinedContext = dedupeCandidates([...semanticCandidates, ...keywordCandidates], 12)
      .map(entry => entry.content)
      .join('\n\n---\n\n');

    const allFilePaths = files.map(f => f.path).join('\n');

    const systemInstruction = `
      You are an expert AI Codebase Analyzer. You have access to the codebase provided below.
      
      USER CAPABILITY: The user can ask you to find specific files, search for keywords, or provide their own code snippets for analysis.
      YOUR TASK:
      - If the user asks for a file or keyword, search through the provided file list and relevant content.
      - ALWAYS display the full file path for any file you mention.
      - Do not invent files or paths. If uncertain, say what is uncertain.
      - If multiple files match a search query (by name or content), list ALL of them with their full paths.
      - If the user provides a code snippet, analyze it and explain its purpose, functionality, and suggest potential improvements.
      - Provide relevant code snippets and file paths from the project when applicable.
      - Keep answers concise but concrete. Prefer grounded statements over speculation.
      
      ALL FILES IN PROJECT:
      ${allFilePaths}
      
      RELEVANT CONTEXT (Semantic Search & Keyword Match):
      ${combinedContext}
    `;

    try {
      const chat = ai.chats.create({
        model: this.MODEL_NAME,
        config: { systemInstruction },
        history: history.map(h => ({
          role: h.role,
          parts: [{ text: h.content }]
        }))
      });

      const response = await chat.sendMessage({ message });
      const text = response.text;
      return text || "No response generated.";
    } catch (error) {
      console.error("Chat generation failed:", error);
      if (!combinedContext) {
        return "I could not build context for that question yet. Please try rephrasing your query or ask about a specific file path.";
      }
      return `I hit a temporary model error, but I found relevant context in this codebase. Try again with a targeted request like: "Explain ${keywordFiles[0]?.path ?? files[0]?.path ?? "a specific file"}".`;
    }
  }
}
