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
