import { FileData } from '../types';

export interface CodeChunk {
  path: string;
  content: string;
  type: 'function' | 'class' | 'module' | 'other';
  name?: string;
  startLine: number;
  endLine: number;
}

export class ParserService {
  
  /**
   * Simple chunking strategy: split by functions/classes if possible,
   * otherwise split by line count.
   */
  static chunkFile(file: FileData): CodeChunk[] {
    const lines = file.content.split('\n');
    const chunks: CodeChunk[] = [];
    
    // Basic regex for common languages
    const functionRegex = /^(?:async\s+)?function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s*)?\([^)]*\)\s*=>|class\s+(\w+)|def\s+(\w+)\s*\(/;
    
    let currentChunk: Partial<CodeChunk> | null = null;
    
    lines.forEach((line, index) => {
      const match = line.match(functionRegex);
      if (match && currentChunk === null) {
        // Start a new chunk
        const name = match[1] || match[2] || match[3] || match[4];
        const type = match[3] ? 'class' : 'function';
        
        currentChunk = {
          path: file.path,
          type,
          name,
          startLine: index + 1,
          endLine: index + 1,
          content: ''
        };
      }
      
      // If chunk is getting too long, close it
      if (currentChunk && (index + 1 - currentChunk.startLine! > 100)) {
        currentChunk.endLine = index;
        currentChunk.content = lines.slice(currentChunk.startLine! - 1, index).join('\n');
        chunks.push(currentChunk as CodeChunk);
        currentChunk = null;
      }
      
      // If we encounter a function/class while in a chunk, close previous chunk
      if (match && currentChunk !== null && currentChunk.startLine !== index + 1) {
        currentChunk.endLine = index;
        currentChunk.content = lines.slice(currentChunk.startLine! - 1, index).join('\n');
        chunks.push(currentChunk as CodeChunk);
        
        // Start new chunk
        const name = match[1] || match[2] || match[3] || match[4];
        const type = match[3] ? 'class' : 'function';
        currentChunk = {
          path: file.path,
          type,
          name,
          startLine: index + 1,
          endLine: index + 1,
          content: ''
        };
      }
    });
    
    if (currentChunk) {
      currentChunk.endLine = lines.length;
      currentChunk.content = lines.slice(currentChunk.startLine - 1, lines.length).join('\n');
      chunks.push(currentChunk as CodeChunk);
    }
    
    // If no chunks were found (e.g. small file or no functions), treat whole file as module
    if (chunks.length === 0) {
      chunks.push({
        path: file.path,
        content: file.content,
        type: 'module',
        startLine: 1,
        endLine: lines.length
      });
    }
    
    return chunks;
  }

  static getDependencies(file: FileData): string[] {
    const lines = file.content.split('\n');
    const dependencies: string[] = [];
    
    // Simple regex for imports
    const importRegex = /import\s+.*\s+from\s+['"](.*)['"]|import\s+['"](.*)['"]|require\(['"](.*)['"]\)|from\s+(.*)\s+import/;
    
    lines.forEach(line => {
      const match = line.match(importRegex);
      if (match) {
        const dep = match[1] || match[2] || match[3] || match[4];
        if (dep && !dep.startsWith('.') && !dep.startsWith('/')) {
          dependencies.push(dep);
        }
      }
    });
    
    return Array.from(new Set(dependencies));
  }
}
