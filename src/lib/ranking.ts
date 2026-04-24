import { FileData } from '../types';

export interface ContextCandidate {
  path: string;
  content: string;
  score: number;
}

export function keywordScore(text: string, keywords: string[]): number {
  if (!keywords.length) return 0;
  const lower = text.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (lower.includes(keyword)) score += 1;
  }
  return score;
}

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\W+/)
    .filter(token => token.length > 2);
}

export function pickKeywordFiles(files: FileData[], keywords: string[], limit = 8): FileData[] {
  return files
    .map(file => {
      const score = keywordScore(`${file.path}\n${file.content.slice(0, 2000)}`, keywords);
      return { file, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.file);
}

export function dedupeCandidates(candidates: ContextCandidate[], limit = 12): ContextCandidate[] {
  const seen = new Set<string>();
  const deduped: ContextCandidate[] = [];
  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    const key = `${candidate.path}::${candidate.content.slice(0, 120)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(candidate);
    if (deduped.length >= limit) break;
  }
  return deduped;
}
