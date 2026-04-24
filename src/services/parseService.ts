import { FileData } from '../types';

export interface CodeChunk {
  path: string;
  content: string;
  type: 'function' | 'class' | 'module' | 'other';
  name?: string;
  startLine: number;
  endLine: number;
  language: string;
  charCount: number;
}

export class ParserService {
  private static readonly MAX_CHUNK_LINES = 120;
  private static readonly WINDOW_CHUNK_LINES = 80;
  private static readonly WINDOW_OVERLAP_LINES = 20;
  private static readonly TS_JS_REGEX = /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)\b/;
  private static readonly PY_REGEX = /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(|^\s*class\s+([A-Za-z_]\w*)\s*[:(]/;
  
  /**
   * Simple chunking strategy: split by functions/classes if possible,
   * otherwise split by line count.
   */
  static chunkFile(file: FileData): CodeChunk[] {
    const lines = file.content.split('\n');
    const chunks: CodeChunk[] = [];
    const language = this.detectLanguage(file.path);
    const symbolRegex = this.getSymbolRegex(language);

    let currentChunk: Partial<CodeChunk> | null = null;
    let hasChunk = false;

    lines.forEach((line, index) => {
      const match = symbolRegex ? line.match(symbolRegex) : null;
      if (match) {
        // If we were already in a chunk, close it
        if (currentChunk) {
          currentChunk.endLine = index;
          currentChunk.content = lines.slice((currentChunk.startLine ?? 1) - 1, index).join('\n');
          currentChunk.charCount = currentChunk.content.length;
          chunks.push(currentChunk as CodeChunk);
        }

        const name = match[1] || match[2] || match[3];
        const type = line.includes('class ') ? 'class' : 'function';

        currentChunk = {
          path: file.path,
          type,
          name,
          startLine: index + 1,
          language,
        };
        hasChunk = true;
      }

      // If chunk is getting too long, or it's the end of the file
      const chunk = currentChunk;
      if (chunk && (index + 1 - (chunk.startLine ?? 0) > this.MAX_CHUNK_LINES)) {
        chunk.endLine = index + 1;
        chunk.content = lines.slice((chunk.startLine ?? 1) - 1, index + 1).join('\n');
        chunk.charCount = chunk.content.length;
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
      const content = lines.slice(startLine - 1, lines.length).join('\n');
      const newChunk: CodeChunk = {
        path: chunkPath,
        type: chunkType,
        name: chunkName,
        startLine: startLine,
        endLine: lines.length,
        content,
        language,
        charCount: content.length,
      };
      chunks.push(newChunk);
    }

    // If no chunks were found (e.g. small file or no functions), treat whole file as module
    if (chunks.length === 0) {
      return this.chunkByWindow(file.path, lines, language);
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

  private static chunkByWindow(path: string, lines: string[], language: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const total = lines.length;
    let start = 0;

    while (start < total) {
      const endExclusive = Math.min(start + this.WINDOW_CHUNK_LINES, total);
      const content = lines.slice(start, endExclusive).join('\n');
      chunks.push({
        path,
        content,
        type: 'module',
        startLine: start + 1,
        endLine: endExclusive,
        language,
        charCount: content.length,
      });
      if (endExclusive === total) break;
      start = endExclusive - this.WINDOW_OVERLAP_LINES;
    }

    return chunks;
  }

  private static detectLanguage(filePath: string): string {
    const ext = filePath.toLowerCase().split('.').pop();
    if (!ext) return 'text';
    if (['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'].includes(ext)) return 'javascript';
    if (['py'].includes(ext)) return 'python';
    if (['java', 'kt', 'scala'].includes(ext)) return 'jvm';
    if (['go'].includes(ext)) return 'go';
    if (['rs'].includes(ext)) return 'rust';
    return ext;
  }

  private static getSymbolRegex(language: string): RegExp | null {
    if (language === 'javascript') return this.TS_JS_REGEX;
    if (language === 'python') return this.PY_REGEX;
    return null;
  }
}
