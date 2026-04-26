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
  
}
