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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-950 text-zinc-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            AI Codebase Analyzer
          </h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Production-grade repository analysis. Instantly understand architecture, logic, and security.
        </p>
      </motion.div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}
        className={`
          relative w-full max-w-2xl aspect-[16/9] rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer
          flex flex-col items-center justify-center gap-6 group overflow-hidden
          ${isDragging ? 'border-indigo-500 bg-indigo-500/5 scale-[1.02]' : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'}
        `}
      >
        <input
          type="file"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="absolute inset-0 opacity-0 cursor-pointer"
          accept=".zip"
        />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 animate-pulse" />
                </div>
              </div>
              <p className="text-zinc-300 font-medium">Analyzing codebase structure...</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors border border-zinc-800">
                <FileArchive className="w-10 h-10 text-zinc-400" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-white">Drop ZIP file here</p>
                <p className="text-zinc-500 mt-1">or click to browse from your computer</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 text-red-400 font-medium bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20"
          >
            {error}
          </motion.p>
        )}
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {[
          { title: 'Architecture', desc: 'Understand how modules interact', icon: Layout },
          { title: 'Security Scan', desc: 'Identify potential vulnerabilities', icon: ShieldAlert },
          { title: 'Logic Flow', desc: 'Trace execution across files', icon: Zap },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <feature.icon className="w-6 h-6 text-indigo-400 mb-4" />
            <h3 className="font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const CodeExplorer = ({ files, onFileSelect, selectedFile }: { files: FileData[], onFileSelect: (f: FileData) => void, selectedFile: FileData | null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) newExpanded.delete(path);
    else newExpanded.add(path);
    setExpandedFolders(newExpanded);
  };

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    const searchLower = searchTerm.toLowerCase();
    return files.filter(f => f.path.toLowerCase().includes(searchLower) || f.content.toLowerCase().includes(searchLower));
  }, [files, searchTerm]);

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

  const tree: any = {};
  filteredFiles.forEach(file => {
    const parts = file.path.split('/');
    let current = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) current[part] = file;
      else {
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
        const isContentMatch = searchTerm && !name.toLowerCase().includes(searchTerm.toLowerCase()) && (value as FileData).content.toLowerCase().includes(searchTerm.toLowerCase());
        return (
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onFileSelect(value as FileData)}
            className={`
              flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg text-sm transition-all group
              ${selectedFile?.path === currentPath ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : isContentMatch ? 'bg-indigo-500/10 text-indigo-300' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'}
            `}
            style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
          >
            <File className={`w-4 h-4 ${isContentMatch ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            <div className="flex flex-col min-w-0">
              <span className="truncate">{name}</span>
              {isContentMatch && <span className="text-[10px] opacity-70 flex items-center gap-1"><Sparkles className="w-2 h-2" /> Content match</span>}
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
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                {renderTree(value, currentPath, depth + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-900 w-80 shrink-0">
      <div className="p-4 border-b border-zinc-900">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            placeholder="Search files or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none placeholder:text-zinc-600"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {renderTree(tree)}
      </div>
    </div>
  );
};

const ChatPanel = ({ files, history, onSendMessage }: { files: FileData[], history: ChatMessage[], onSendMessage: (msg: string) => void }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    setIsLoading(true);
    await onSendMessage(msg);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-900 w-96 shrink-0">
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex items-center gap-2 sticky top-0 z-10">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h2 className="font-bold text-white tracking-tight">AI Assistant</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {history.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none shadow-sm'}`}>
              <div className="markdown-body prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-950 border-t border-zinc-900">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about the code..."
            className="w-full pl-4 pr-12 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none max-h-32 outline-none placeholder:text-zinc-600"
            rows={1}
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [projectData, setProjectData] = useState<{ files: FileData[], projectName: string, stats: ProjectStats } | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'visualization'>('analysis');

  const handleUpload = async (data: { files: FileData[], projectName: string, stats: ProjectStats }) => {
    setProjectData(data);
    setIsAnalyzing(true);
    try {
      // Parallelize initialization and analysis
      const [analysisResult] = await Promise.all([
        AIService.analyzeProject(data.files),
        AIService.initialize(data.files)
      ]);
      
      setAnalysis(analysisResult);
      setChatHistory([{ 
        role: 'model', 
        content: `Hello! I've analyzed **${data.projectName}**. I've indexed ${data.files.length} files and generated a semantic map of your codebase. I can help you understand the architecture, logic, or specific files. What would you like to know?`, 
        timestamp: new Date().toISOString() 
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (msg: string) => {
    if (!projectData) return;
    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);
    
    try {
      const response = await AIService.chat(projectData.files, msg, chatHistory.concat(userMsg));
      setChatHistory(prev => [...prev, { role: 'model', content: response, timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'model', content: "I'm sorry, I encountered an error while processing your request.", timestamp: new Date().toISOString() }]);
    }
  };

  if (!projectData) {
    return <FileUploader onUpload={handleUpload} />;
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="shrink-0">
            <CodeExplorer files={projectData.files} onFileSelect={setSelectedFile} selectedFile={selectedFile} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-900 rounded-xl transition-colors text-zinc-500">
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h1 className="font-bold text-white tracking-tight truncate max-w-[200px]">{projectData.projectName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 px-4 py-1.5 bg-zinc-900 rounded-full border border-zinc-800 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5"><FileCode className="w-3.5 h-3.5" /> {projectData.stats.totalFiles} files</div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> {(projectData.stats.totalSize / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-2 rounded-xl transition-all ${isChatOpen ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}>
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </header>

        

      {/* AI Chat Sidebar */}
      <AnimatePresence mode="wait">
        {isChatOpen && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 384, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="shrink-0">
            <ChatPanel files={projectData.files} history={chatHistory} onSendMessage={handleSendMessage} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
