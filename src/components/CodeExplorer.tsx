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

}
