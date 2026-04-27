import { FileData } from '../types';

export interface CodeChunk {
  path: string;
  content: string;
  type: 'function' | 'class' | 'module' | 'other';
  name?: string;
  language: string;
  charCount: number;
  startLine: number;
  endLine: number;
}

export class ParserService {
  private static readonly MAX_WINDOW_LINES = 120;
  private static readonly WINDOW_OVERLAP = 20;

  private static detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      cpp: 'cpp',
      c: 'c',
      md: 'markdown',
      json: 'json',
      yml: 'yaml',
      yaml: 'yaml',
      toml: 'toml',
    };
    return map[ext] ?? 'text';
  }

  private static buildWindowChunks(file: FileData, lines: string[], language: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const step = Math.max(1, this.MAX_WINDOW_LINES - this.WINDOW_OVERLAP);

    for (let start = 0; start < lines.length; start += step) {
      const end = Math.min(lines.length, start + this.MAX_WINDOW_LINES);
      const content = lines.slice(start, end).join('\n').trim();
      if (!content) continue;

      chunks.push({
        path: file.path,
        content,
        type: 'module',
        language,
        charCount: content.length,
        startLine: start + 1,
        endLine: end,
      });
    }

    return chunks;
  }

  static chunkFile(file: FileData): CodeChunk[] {
    const lines = file.content.split('\n');
    const chunks: CodeChunk[] = [];
    const language = this.detectLanguage(file.path);
    const symbolRegex =
      /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_]\w*)|\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_]\w*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|\s*class\s+([A-Za-z_]\w*)|\s*def\s+([A-Za-z_]\w*)\s*\(/;

    let currentChunk: Partial<CodeChunk> | null = null;

    lines.forEach((line, index) => {
      const match = line.match(symbolRegex);
      if (match) {
        if (currentChunk) {
          currentChunk.endLine = index;
          currentChunk.content = lines
            .slice((currentChunk.startLine ?? 1) - 1, index)
            .join('\n')
            .trim();
          currentChunk.charCount = currentChunk.content.length;
          chunks.push(currentChunk as CodeChunk);
        }

        const name = match[1] || match[2] || match[3] || match[4];
        const type = match[3] ? 'class' : 'function';
        currentChunk = {
          path: file.path,
          type,
          name,
          language,
          charCount: 0,
          startLine: index + 1,
        };
      }

      const chunk = currentChunk;
      if (chunk && index + 1 - (chunk.startLine ?? 0) > this.MAX_WINDOW_LINES) {
        chunk.endLine = index + 1;
        chunk.content = lines
          .slice((chunk.startLine ?? 1) - 1, index + 1)
          .join('\n')
          .trim();
        chunk.charCount = chunk.content.length;
        chunks.push(chunk as CodeChunk);
        currentChunk = null;
      }
    });

    if (currentChunk) {
      const startLine = currentChunk.startLine ?? 1;
      const content = lines.slice(startLine - 1).join('\n').trim();
      if (content) {
        chunks.push({
          path: currentChunk.path ?? file.path,
          type: currentChunk.type ?? 'module',
          name: currentChunk.name,
          language,
          charCount: content.length,
          startLine,
          endLine: lines.length,
          content,
        });
      }
    }

    if (chunks.length === 0) {
      return this.buildWindowChunks(file, lines, language);
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
