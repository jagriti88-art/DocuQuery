'use client';

import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Send, Bot, User, FileText, Sparkles } from 'lucide-react';

// 1. Environmental API Base URL
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Doc {
  content?: string; 
  page?: number;    
}

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: Doc[];
}

interface ChatProps {
  fileName?: string | null;
}

const ChatComponent: React.FC<ChatProps> = ({ fileName }) => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 2. Greeting when a new file is detected
  React.useEffect(() => {
    if (fileName) {
      setMessages([
        { 
          role: 'assistant', 
          content: `Successfully indexed **${fileName}**. I'm ready! What would you like to know about this document?` 
        }
      ]);
    } else {
      setMessages([]);
    }
  }, [fileName]);

  const handleSendChatMessage = async () => {
    if (!message.trim() || !fileName) return;

    const userQuery = message;
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      // 3. Use dynamic API_BASE instead of localhost
      const queryParams = new URLSearchParams({
        message: userQuery,
        fileName: fileName
      });

      const res = await fetch(`${API_BASE}/chat?${queryParams.toString()}`);
      
      if (!res.ok) throw new Error("Server responded with an error");
      
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.answer || "I processed the document but couldn't formulate a specific answer.",
          documents: data?.sources || [],
        },
      ]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: "⚠️ Connection Error: Ensure the backend is running and CORS is configured." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Active File Header */}
      {fileName && (
        <div className="px-6 py-3 bg-purple-500/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <FileText size={14} className="text-purple-400" />
            </div>
            <span className="text-xs text-slate-300 font-medium truncate max-w-[200px]">
              {fileName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">Ready</span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 && !fileName && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <div className="p-4 bg-white/5 rounded-full">
               <Bot size={40} />
            </div>
            <p className="text-sm max-w-[200px]">Please upload a document in the sidebar to begin chatting.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in-fade`}>
            <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                msg.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-fuchsia-600'
              }`}>
                {msg.role === 'user' ? <User size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
              </div>

              <div className="space-y-3">
                <div className={`p-4 rounded-2xl border shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-blue-600/10 text-slate-100 border-blue-500/30 rounded-tr-none' 
                  : 'bg-slate-900/80 text-slate-200 border-white/10 rounded-tl-none backdrop-blur-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>

                {msg.documents && msg.documents.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {msg.documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-[10px] text-slate-400 hover:bg-white/10 transition-colors">
                        <Sparkles size={10} className="text-purple-400" />
                        <span>Source: Page {doc.page || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-purple-400 text-xs font-medium animate-pulse ml-12">
            <Sparkles size={14} />
            <span>AI is reasoning...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex gap-3 relative">
          <Input
            value={message}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={fileName ? `Ask about "${fileName}"...` : "Upload a PDF to unlock chat"}
            disabled={!fileName || isLoading}
            className="bg-slate-900/50 border-white/10 text-white h-12 px-5 rounded-xl focus-visible:ring-purple-500/50 disabled:opacity-40 transition-all"
          />
          <Button 
            onClick={handleSendChatMessage} 
            disabled={!message.trim() || isLoading || !fileName}
            className="h-12 w-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 shrink-0"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;