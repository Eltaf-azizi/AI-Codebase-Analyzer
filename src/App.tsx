import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layout,
  FileCode,
  MessageSquare,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Terminal,
  ShieldAlert,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AnalysisResult, ChatMessage, UploadResponse, FileData, ChatResponse } from './types';
import { ArchitectureGraph } from './components/architectureGraph.tsx';
import { FileUploader } from './components/FileUploader';
import { CodeExplorer } from './components/CodeExplorer';
import { ChatPanel } from './components/ChatPanel';
import { API_ENDPOINTS } from './lib/constants';

export default function App() {
  const [projectData, setProjectData] = useState<UploadResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAnalyzing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'visualization'>('analysis');

  const handleUpload = async (data: UploadResponse & { analysis?: AnalysisResult }) => {
    setProjectData(data);
    if (data.analysis) {
      setAnalysis(data.analysis);
    }
    setChatHistory([{ 
      role: 'model', 
      content: `Hello! I've analyzed **${data.projectName}**. I've indexed ${data.files.length} files and generated a semantic map of your codebase. I can help you understand the architecture, logic, or specific files. What would you like to know?`, 
      timestamp: new Date().toISOString() 
    }]);
  };

  const handleSendMessage = async (msg: string): Promise<void> => {
    if (!projectData) return;
    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: projectData.files, message: msg, history: chatHistory.concat(userMsg) })
      });

      if (!response.ok) throw new Error('Failed to get chat response');
      const data = await response.json() as ChatResponse;

      setChatHistory(prev => [...prev, { role: 'model', content: data.reply || "I'm sorry, I couldn't generate a response.", timestamp: new Date().toISOString() }]);
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

        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-5xl mx-auto space-y-12">
            {projectData.diagnostics && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-300">
                Processed {projectData.diagnostics.processedFiles} files. Skipped {projectData.diagnostics.skippedFiles} files during upload filtering.
              </div>
            )}
            {/* Analysis Dashboard */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Project Intelligence</h2>
                </div>
                <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                  <button 
                    onClick={() => setActiveTab('analysis')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Analysis
                  </button>
                  <button 
                    onClick={() => setActiveTab('visualization')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'visualization' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Visualization
                  </button>
                </div>
              </div>

              {isAnalyzing ? (
                <div className="p-12 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex flex-col items-center gap-6">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-indigo-500/20 animate-pulse" /></div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">Deep Analysis in Progress</p>
                    <p className="text-zinc-500 mt-1">Gemini is mapping project architecture and security vectors...</p>
                  </div>
                </div>
              ) : analysis ? (
                activeTab === 'analysis' ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Summary Card */}
                    <div className="col-span-1 md:col-span-2 p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 shadow-xl">
                      <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4">Executive Summary</h3>
                      <p className="text-zinc-300 leading-relaxed text-lg">{analysis.summary}</p>
                    </div>

                    {/* Architecture Card */}
                    <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800">
                      <div className="flex items-center gap-2 mb-6"><Layout className="w-5 h-5 text-indigo-400" /><h3 className="font-bold text-white">Architecture</h3></div>
                      <p className="text-zinc-400 text-sm leading-relaxed">{analysis.architecture}</p>
                    </div>

                    {/* Features & Security */}
                    <div className="space-y-6">
                      <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800">
                        <div className="flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><h3 className="font-bold text-white">Key Features</h3></div>
                        <ul className="space-y-2">{analysis.features.map((f, i) => <li key={i} className="text-zinc-400 text-sm flex gap-2"><span>•</span> {f}</li>)}</ul>
                      </div>
                      <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10">
                        <div className="flex items-center gap-2 mb-4"><ShieldAlert className="w-5 h-5 text-red-400" /><h3 className="font-bold text-white">Security Vectors</h3></div>
                        <ul className="space-y-2">{analysis.security.map((s, i) => <li key={i} className="text-red-400/70 text-sm flex gap-2"><span>•</span> {s}</li>)}</ul>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-[600px]">
                    {analysis.architectureData && <ArchitectureGraph data={analysis.architectureData} />}
                  </motion.div>
                )
              ) : null}
            </section>

            {/* Code Viewer */}
            <AnimatePresence mode="wait">
              {selectedFile && (
                <motion.section key={selectedFile.path} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800"><FileCode className="w-4 h-4 text-indigo-400" /></div>
                      <h2 className="text-lg font-bold text-white truncate">{selectedFile.path}</h2>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="p-2 hover:bg-zinc-900 rounded-xl transition-colors text-zinc-500"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                    <SyntaxHighlighter language="typescript" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1.5rem', background: '#09090b', fontSize: '0.875rem' }} showLineNumbers>
                      {selectedFile.content}
                    </SyntaxHighlighter>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* AI Chat Sidebar */}
      <AnimatePresence mode="wait">
        {isChatOpen && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 384, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="shrink-0">
            <ChatPanel history={chatHistory} onSendMessage={handleSendMessage} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
