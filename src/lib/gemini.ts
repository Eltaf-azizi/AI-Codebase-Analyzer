import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface FileData {
  path: string;
  content: string;
}

export async function summarizeCodebase(files: FileData[]) {
  const model = "gemini-3-flash-preview";
  
  // Create a condensed version of the codebase for the prompt
  const codebaseContext = files
    .filter(f => !f.path.includes('package-lock.json')) // Skip large lock files
    .map(f => `File: ${f.path}\nContent:\n${f.content.slice(0, 2000)}...`) // Truncate long files
    .join('\n\n');

  const prompt = `
    You are a senior software engineer. Analyze the following codebase and provide:
    1. A high-level project summary (what it does, tech stack).
    2. Architecture overview.
    3. Key features.
    4. Potential improvements or bugs.

    Codebase:
    ${codebaseContext}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
}

export async function chatWithCodebase(files: FileData[], message: string, history: any[]) {
  const model = "gemini-3-flash-preview";
  
  // 1. Identify relevant files based on keywords in the message
  const keywords = message.toLowerCase().split(/\W+/).filter(k => k.length > 2);
  const relevantFiles = files.filter(f => {
    const pathLower = f.path.toLowerCase();
    const contentLower = f.content.toLowerCase();
    return keywords.some(k => pathLower.includes(k) || contentLower.includes(k));
  }).slice(0, 10); // Limit to top 10 relevant files

  // 2. Create a context with relevant files (full content where possible) and a list of all files
  const relevantContext = relevantFiles
    .map(f => `File: ${f.path}\nContent:\n${f.content.slice(0, 5000)}`)
    .join('\n\n---\n\n');

  const allFilePaths = files.map(f => f.path).join('\n');

  const systemInstruction = `
    You are an expert AI Codebase Analyzer. You have access to the codebase provided below.
    
    USER CAPABILITY: The user can ask you to find specific files, search for keywords, or provide their own code snippets for analysis.
    YOUR TASK:
    - If the user asks for a file or keyword, search through the provided file list and relevant content.
    - ALWAYS display the full file path for any file you mention.
    - If multiple files match a search query (by name or content), list ALL of them with their full paths.
    - If the user provides a code snippet, analyze it and explain its purpose, functionality, and suggest potential improvements (e.g., performance, readability, security).
    - Provide relevant code snippets and file paths from the project when applicable.
    - Explain how the files relate to the user's query.
    
    ALL FILES IN PROJECT:
    ${allFilePaths}
    
    RELEVANT FILE CONTENT (Top matches for current query):
    ${relevantContext || "No direct keyword matches found in file content, but you can still reference the file list above."}
    
    Answer the user's questions accurately based on the code.
    If you don't know the answer, say so.
  `;

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction,
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }))
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
