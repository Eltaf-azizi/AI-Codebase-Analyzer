import React, { useState, useEffect, useMemo } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileData {
  path: string;
  content: string;
}

interface CodeExplorerProps {
  files: FileData[];
  onFileSelect: (file: FileData) => void;
  selectedFile: FileData | null;
}

export default function CodeExplorer({ files, onFileSelect, selectedFile }: CodeExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    const searchLower = searchTerm.toLowerCase();
    return files.filter(f => 
      f.path.toLowerCase().includes(searchLower) || 
      f.content.toLowerCase().includes(searchLower)
    );
  }, [files, searchTerm]);

  // Auto-expand folders when searching
  useEffect(() => {
    if (searchTerm) {
      const foldersToExpand = new Set<string>(['/']);
      filteredFiles.forEach(file => {
        const parts = file.path.split('/');
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          foldersToExpand.add(currentPath);
        }
      });
      setExpandedFolders(prev => {
        const next = new Set(prev);
        foldersToExpand.forEach(f => next.add(f));
        return next;
      });
    }
  }, [searchTerm, filteredFiles]);

  // Simple tree structure generation
  const tree: any = {};
  filteredFiles.forEach(file => {
    const parts = file.path.split('/');
    let current = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        current[part] = file;
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    });
  });

  const renderTree = (node: any, path: string = '', depth: number = 0) => {
    const entries = Object.entries(node).sort(([a], [b]) => {
      const isAFile = (node[a] as any).path !== undefined;
      const isBFile = (node[b] as any).path !== undefined;
      if (isAFile && !isBFile) return 1;
      if (!isAFile && isBFile) return -1;
      return a.localeCompare(b);
    });

    return entries.map(([name, value]) => {
      const currentPath = path ? `${path}/${name}` : name;
      const isFile = (value as any).path !== undefined;
      const isExpanded = expandedFolders.has(currentPath);

      if (isFile) {
        const isContentMatch = searchTerm && 
          !(name.toLowerCase().includes(searchTerm.toLowerCase())) && 
          (value as FileData).content.toLowerCase().includes(searchTerm.toLowerCase());

        return (
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onFileSelect(value as FileData)}
            className={`
              flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg text-sm transition-all
              ${selectedFile?.path === currentPath 
                ? 'bg-zinc-900 text-white font-medium shadow-md' 
                : isContentMatch 
                  ? 'bg-amber-50 text-amber-900 border border-amber-100'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700'}
            `}
            style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
          >
            <File className={`w-4 h-4 ${isContentMatch ? 'text-amber-500' : ''}`} />
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
            className="flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Folder className="w-4 h-4 text-zinc-400" />
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
                {renderTree(value, currentPath, depth + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-zinc-100 w-80">
      <div className="p-4 border-bottom border-zinc-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200 transition-all"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {renderTree(tree)}
      </div>
    </div>
  );
}
