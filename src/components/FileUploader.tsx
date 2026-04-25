import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, FileArchive, Loader2, Layout, ShieldAlert, Zap } from 'lucide-react';
import { UploadResponse } from '../types';
import { API_ENDPOINTS } from '../lib/constants';

interface FileUploaderProps {
  onUpload: (data: UploadResponse) => void;
}

export function FileUploader({ onUpload }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Ready to analyze your repository.');

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Please upload a .zip file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusText('Uploading archive and validating files...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error((data?.error as string) || 'Failed to upload file');
      }

      setStatusText('Repository accepted. Building project view...');
      onUpload(data as UploadResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing ZIP file. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-950 text-zinc-100">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">AI Codebase Analyzer</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Production-grade repository analysis. Instantly understand architecture, logic, and security.
        </p>
      </motion.div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
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
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
              <p className="text-zinc-300 font-medium text-center px-4">{statusText}</p>
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
            className="absolute bottom-8 text-red-300 font-medium bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20"
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
}
