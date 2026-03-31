import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  FileCode, 
  MessageSquare, 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Loader2, 
  Terminal, 
  ShieldAlert, 
  Zap, 
  Search, 
  Folder, 
  File, 
  Send, 
  User, 
  Bot, 
  Activity, 
  Settings, 
  Github, 
  Upload, 
  FileArchive, 
  CheckCircle2, 
  BarChart3 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AIService } from './services/aiService';
import { FileData, AnalysisResult, ChatMessage, ProjectStats } from './types';
import { ArchitectureGraph } from './components/ArchitectureGraph';

// --- Components ---

const FileUploader = ({ onUpload }: { onUpload: (data: { files: FileData[], projectName: string, stats: ProjectStats }) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setError('Please upload a .zip file');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload file');

      const data = await response.json();
      onUpload(data);
    } catch (err) {
      setError('Error processing ZIP file. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
