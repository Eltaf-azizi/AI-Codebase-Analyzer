import React, { useState, useRef } from 'react';
import { Upload, FileArchive, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploaderProps {
  onUpload: (files: { path: string; content: string }[]) => void;
}

export default function FileUploader({ onUpload }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onUpload(data.files);
    } catch (err) {
      setError('Error processing ZIP file. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 mb-4">
          AI Codebase Analyzer
        </h1>
        <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
          Upload your project as a ZIP file and let AI explain the architecture, logic, and dependencies.
        </p>
      </motion.div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative w-full max-w-2xl aspect-[16/9] rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer
          flex flex-col items-center justify-center gap-6 group
          ${isDragging ? 'border-zinc-900 bg-zinc-50 scale-[1.02]' : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
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
              <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
              <p className="text-zinc-600 font-medium">Analyzing codebase...</p>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                <FileArchive className="w-10 h-10 text-zinc-600" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-zinc-900">Drop ZIP file here</p>
                <p className="text-zinc-500">or click to browse from your computer</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-10 text-red-500 font-medium"
          >
            {error}
          </motion.p>
        )}
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {[
          { title: 'Architecture', desc: 'Understand how modules interact' },
          { title: 'Logic Flow', desc: 'Trace execution across files' },
          { title: 'Bug Detection', desc: 'Identify potential issues early' },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="p-6 rounded-2xl bg-white border border-zinc-100 shadow-sm"
          >
            <CheckCircle2 className="w-6 h-6 text-zinc-900 mb-3" />
            <h3 className="font-bold text-zinc-900 mb-1">{feature.title}</h3>
            <p className="text-zinc-500 text-sm">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
