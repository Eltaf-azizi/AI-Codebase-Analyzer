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
  

  const response = await chat.sendMessage({ message });
  return response.text;
}
