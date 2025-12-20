'use client';

import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Send, Bot, User, FileText } from 'lucide-react';

interface Doc {
  content?: string; 
  page?: number;    
}

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: Doc[];
}

// 1. Define Props to accept the current file name from the parent
interface ChatProps {
  fileName?: string | null;
}

const ChatComponent: React.FC<ChatProps> = ({ fileName }) => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendChatMessage = async () => {
    if (!message.trim()) return;

    const userQuery = message;
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      // 2. Attach the fileName to the URL to tell the backend which PDF to search
      let url = `http://localhost:8000/chat?message=${encodeURIComponent(userQuery)}`;
      if (fileName) {
        url += `&fileName=${encodeURIComponent(fileName)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.answer || "I couldn't find relevant information for this specific document.",
          documents: data?.sources || [],
        },
      ]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: "Error: Could not connect to the server." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Active File Indicator */}
      {fileName && (
        <div className="px-6 py-2 bg-purple-500/10 border-b border-white/5 flex items-center gap-2">
           <FileText size={14} className="text-purple-400" />
           <span className="text-[10px] text-purple-300 uppercase tracking-widest font-bold">
             Chatting with: {fileName}
           </span>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>

              <div className="space-y-2">
                <div className={`p-4 rounded-2xl shadow-sm border ${
                  msg.role === 'user' 
                  ? 'bg-blue-700 text-white border-blue-500 rounded-tr-none' 
                  : 'bg-slate-900 text-slate-100 border-white/10 rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>

                {msg.documents && msg.documents.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {msg.documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-800/50 border border-white/5 p-2 rounded text-[10px] text-slate-400 whitespace-nowrap">
                        <FileText size={12} />
                        <span>Page {doc.page || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse text-slate-500 text-xs italic">
            Gemini is analyzing {fileName || "the document"}...
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-slate-950/50">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input
            value={message}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={fileName ? `Ask about ${fileName}...` : "Upload a PDF to start chatting"}
            disabled={!fileName} // Prevent typing if no file is selected
            className="bg-slate-900 border-white/10 text-white focus-visible:ring-purple-500 disabled:opacity-50"
          />
          <Button 
            onClick={handleSendChatMessage} 
            disabled={!message.trim() || isLoading || !fileName}
            className="bg-purple-600 hover:bg-purple-500 text-white"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;