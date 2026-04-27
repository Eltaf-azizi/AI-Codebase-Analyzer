import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage, FileData } from "../types";

interface ChatPanelProps {
  files: FileData[];
  history: ChatMessage[];
  onSendMessage: (msg: string) => Promise<void>;
}

const QUICK_PROMPTS = [
  "Give me the architecture overview with key files.",
  "List potential security risks and where they are.",
  "Which files are most central to business logic?",
  "What should I refactor first for maintainability?",
];

export function ChatPanel({ files, history, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isLoading]);

  const handleSend = async (text?: string) => {
    const nextValue = (text ?? input).trim();
    if (!nextValue || isLoading) return;
    setInput("");
    setIsLoading(true);
    await onSendMessage(nextValue);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-900 w-96 shrink-0">
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between gap-2 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-white tracking-tight">AI Assistant</h2>
        </div>
        <span className="text-[11px] text-zinc-500">{files.length} files indexed</span>
      </div>

      {history.length <= 1 && (
        <div className="px-4 pt-4 space-y-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => void handleSend(prompt)}
              className="w-full text-left p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs hover:bg-zinc-800 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {history.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400"}`}
            >
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none shadow-sm"}`}
            >
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask about architecture, logic, or risks..."
            className="w-full pl-4 pr-12 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none max-h-32 outline-none placeholder:text-zinc-600"
            rows={1}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
