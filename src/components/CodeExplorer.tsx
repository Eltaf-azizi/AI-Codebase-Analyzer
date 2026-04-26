import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronRight, File, Folder, Search, Sparkles, X } from 'lucide-react';
import { FileData } from '../types';

interface CodeExplorerProps {
  files: FileData[];
  selectedFile: FileData | null;
  onFileSelect: (file: FileData) => void;
}

export function CodeExplorer({ files, selectedFile, onFileSelect }: CodeExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpandedFolders(next);
  };

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    const q = searchTerm.toLowerCase();
    return files.filter(file => file.path.toLowerCase().includes(q) || file.content.toLowerCase().includes(q));
  }, [files, searchTerm]);

  useEffect(() => {
    if (!searchTerm) return;
    const folders = new Set<string>(['/']);
    for (const file of filteredFiles) {
      const parts = file.path.split('/');
      let currentPath = '';
      for (let i = 0; i < parts.length - 1; i += 1) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        folders.add(currentPath);
      }
    }
    setExpandedFolders(prev => {
      const next = new Set(prev);
      folders.forEach(folder => next.add(folder));
      return next;
    });
  }, [searchTerm, filteredFiles]);

  const tree: Record<string, unknown> = {};
  filteredFiles.forEach(file => {
    const parts = file.path.split('/');
    let current = tree as Record<string, unknown>;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        current[part] = file;
      } else {
        if (!current[part] || typeof current[part] !== 'object') current[part] = {};
        current = current[part] as Record<string, unknown>;
      }
    });
  });

  const renderTree = (node: Record<string, unknown>, path = '', depth = 0): ReactNode[] => {
    const entries = Object.entries(node).sort(([a], [b]) => {
      const nodeA = node[a] as Record<string, unknown>;
      const nodeB = node[b] as Record<string, unknown>;
      const isAFile = typeof nodeA === 'object' && nodeA !== null && 'path' in nodeA;
      const isBFile = typeof nodeB === 'object' && nodeB !== null && 'path' in nodeB;
      if (isAFile && !isBFile) return 1;
      if (!isAFile && isBFile) return -1;
      return a.localeCompare(b);
    });
    

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-900 w-80 shrink-0">
      <div className="p-4 border-b border-zinc-900 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            placeholder="Search files or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none placeholder:text-zinc-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-zinc-800 text-zinc-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-600">
          Showing {filteredFiles.length.toLocaleString()} of {files.length.toLocaleString()} files
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {filteredFiles.length ? (
          renderTree(tree)
        ) : (
          <div className="p-4 text-sm text-zinc-500">No files matched your search.</div>
        )}
      </div>
    </div>
  );
}
