import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { chatWithCodebase, FileData } from '../lib/gemini';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatInterfaceProps {
  files: FileData[];
}

export default function ChatInterface({ files }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I've analyzed your codebase. Ask me anything about the architecture, logic, or specific files." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatWithCodebase(files, userMessage, messages);
      setMessages(prev => [...prev, { role: 'model', content: response || "I'm sorry, I couldn't generate a response." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Error: Failed to get response from AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 border-l border-zinc-100 w-96">
      <div className="p-4 border-bottom border-zinc-100 bg-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-zinc-900" />
        <h2 className="font-bold text-zinc-900">AI Assistant</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0
              ${msg.role === 'user' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-600'}
            `}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`
              max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user' ? 'bg-zinc-900 text-white rounded-tr-none' : 'bg-white border border-zinc-100 text-zinc-700 rounded-tl-none shadow-sm'}
            `}>
              <div className="markdown-body prose prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
            </div>
            <div className="bg-white border border-zinc-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-top border-zinc-100">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Search files or ask about the code..."
            className="w-full pl-4 pr-12 py-3 bg-zinc-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-zinc-200 transition-all resize-none max-h-32"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
