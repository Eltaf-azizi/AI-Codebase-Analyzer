import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, FileArchive, Loader2 } from "lucide-react";
import type { UploadResponse } from "../types";

interface FileUploaderProps {
  onUpload: (data: UploadResponse) => void;
}

export function FileUploader({ onUpload }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setError("Please upload a .zip file");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to upload file");
      }

      const data = (await response.json()) as UploadResponse;
      onUpload(data);
    } catch (err) {
      setError("Error processing ZIP file. Please try again.");
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
        className={`relative w-full max-w-2xl aspect-[16/9] rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer
          flex flex-col items-center justify-center gap-6 group overflow-hidden
          ${isDragging ? "border-indigo-500 bg-indigo-500/5 scale-[1.02]" : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50"}`}
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
    </div>
  );
}
