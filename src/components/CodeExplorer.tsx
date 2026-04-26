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
    
    return entries.map(([name, value]) => {
      const currentPath = path ? `${path}/${name}` : name;
      const isFile = typeof value === 'object' && value !== null && 'path' in (value as Record<string, unknown>);
      const isExpanded = expandedFolders.has(currentPath);

      if (isFile) {
        const file = value as FileData;
        const isContentMatch =
          !!searchTerm &&
          !name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          file.content.toLowerCase().includes(searchTerm.toLowerCase());
        return (
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onFileSelect(file)}
            className={`
              flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg text-sm transition-all group
              ${selectedFile?.path === currentPath ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : isContentMatch ? 'bg-indigo-500/10 text-indigo-300' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'}
            `}
            style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
          >
            <File className={`w-4 h-4 ${isContentMatch ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            <div className="flex flex-col min-w-0">
              <span className="truncate">{name}</span>
              {isContentMatch && (
                <span className="text-[10px] opacity-70 flex items-center gap-1">
                  <Sparkles className="w-2 h-2" />
                  Content match
                </span>
              )}
            </div>
          </motion.div>
        );
      }

      return (
        <div key={currentPath}>
          <div
            onClick={() => toggleFolder(currentPath)}
            className="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Folder className="w-4 h-4 text-zinc-600" />
            <span className="font-medium truncate">{name}</span>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {renderTree(value as Record<string, unknown>, currentPath, depth + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

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
