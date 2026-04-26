import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  history: ChatMessage[];
  onSendMessage: (msg: string) => Promise<void>;
}

const QUICK_PROMPTS = [
  'Explain the project architecture and critical modules.',
  'List top security risks and where they appear.',
  'Show likely performance bottlenecks in this repository.',
  'Which files are most important to start reading first?',
];

export function ChatPanel({ history, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSend = async (message?: string) => {
    const outgoing = (message ?? input).trim();
    if (!outgoing || isLoading) return;
    if (!message) setInput('');
    setIsLoading(true);
    await onSendMessage(outgoing);
    setIsLoading(false);
  };
  
  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-900 w-96 shrink-0">
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex items-center gap-2 sticky top-0 z-10">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h2 className="font-bold text-white tracking-tight">AI Assistant</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {!history.length && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <p className="text-sm text-zinc-300">Try one of these starter prompts:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none shadow-sm'
              }`}
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
            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-zinc-500">
              Thinking with indexed code context...
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
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask about architecture, vulnerabilities, dependencies..."
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
