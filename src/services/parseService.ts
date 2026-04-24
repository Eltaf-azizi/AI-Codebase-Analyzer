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
    let hasChunk = false;
    
    lines.forEach((line, index) => {
      const match = line.match(functionRegex);
      if (match) {
        // If we were already in a chunk, close it
        if (currentChunk) {
          currentChunk.endLine = index;
          currentChunk.content = lines.slice((currentChunk.startLine ?? 1) - 1, index).join('\n');
          chunks.push(currentChunk as CodeChunk);
        }
        
        const name = match[1] || match[2] || match[3] || match[4];
        const type = match[3] ? 'class' : 'function';
        
        currentChunk = {
          path: file.path,
          type,
          name,
          startLine: index + 1,
        };
        hasChunk = true;
      }
      
      // If chunk is getting too long, or it's the end of the file
      const chunk = currentChunk;
      if (chunk && (index + 1 - (chunk.startLine ?? 0) > 100)) {
        chunk.endLine = index + 1;
        chunk.content = lines.slice((chunk.startLine ?? 1) - 1, index + 1).join('\n');
        chunks.push(chunk as CodeChunk);
        currentChunk = null;
        hasChunk = false;
      }
    });
    
    // Handle remaining chunk at end of file
    if (hasChunk && currentChunk) {
      // Use type assertion to work around TypeScript narrowing issues
      const chunk = currentChunk as Partial<CodeChunk>;
      const chunkPath = chunk.path ?? file.path;
      const chunkType = chunk.type ?? 'module';
      const chunkName = chunk.name;
      const startLine = chunk.startLine ?? 1;
      const newChunk: CodeChunk = {
        path: chunkPath,
        type: chunkType,
        name: chunkName,
        startLine: startLine,
        endLine: lines.length,
        content: lines.slice(startLine - 1, lines.length).join('\n'),
      };
      chunks.push(newChunk);
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
