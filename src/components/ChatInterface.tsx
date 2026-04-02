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

  
}
