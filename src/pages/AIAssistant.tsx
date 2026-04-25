import { useState, useRef, useEffect } from 'react';
import { CardContent, CardTitle, Input, Button } from '../components/ui';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { processAIQuery } from '../lib/ai-assistant';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function AIAssistant() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: "Hello! I am your TaskFlow Smart Assistant. I have direct secure access to your database to give you insights instead of generic replies.\n\nTry asking me:\n- *\"Show pending tasks for today\"*\n- *\"Who has overdue work?\"*\n- *\"Summarize this week's task progress\"*\n- *\"Which tasks are blocked?\"*"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  if (profile?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" />;
  }

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // "AI thinking" delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const response = await processAIQuery(userMsg.content);
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: "I encountered a connection error. Please verify your API configuration." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 -m-4 md:-m-10 p-4 md:p-10 bg-[#0f0a19] min-h-[calc(100vh-64px)] md:min-h-screen text-white font-sans overflow-hidden">
      
      {/* Main Chat Interface - Fixed Full Screen */}
      <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-2xl border-t border-white/10 rounded-t-[2.5rem] shadow-2xl overflow-hidden relative">
        
        {/* Top bar of chat */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-transparent flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#db2777] p-0.5">
                 <div className="w-full h-full rounded-full bg-[#0f0a19] flex items-center justify-center overflow-hidden">
                    <img src="https://i.pinimg.com/1200x/6d/60/39/6d6039952777dcfd564c9ae06464320f.jpg" className="w-full h-full object-cover" alt="AI" />
                 </div>
              </div>
              <div>
                 <h3 className="font-bold text-white leading-none mb-1">Zyricon AI</h3>
                 <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Workspace Insights</span>
              </div>
           </div>
           <div className="flex gap-2">
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/40">CONFIG: GPT-4o</div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/40 uppercase">Safe Mode</div>
           </div>
        </div>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-8 px-6 py-8 scrollbar-none">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white' 
                      : 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white'
                  }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className={`p-5 rounded-3xl ${
                    msg.role === 'user' 
                      ? 'bg-white/10 border border-white/10 rounded-tr-sm text-white' 
                      : 'bg-[#1a1425] border border-white/5 shadow-2xl rounded-tl-sm text-purple-50'
                  }`}>
                    <div className="space-y-3">
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className="text-[15px] leading-relaxed font-medium">
                          {line.split(/(\*\*.*?\*\*|\*.*?\*)/).map((fragment, j) => {
                            if (fragment.startsWith('**')) return <strong key={j} className="text-white font-bold">{fragment.slice(2, -2)}</strong>;
                            if (fragment.startsWith('*')) return <em key={j} className="text-purple-300 italic">{fragment.slice(1, -1)}</em>;
                            return fragment;
                          })}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                 <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center">
                    <Bot size={20} />
                  </div>
                  <div className="p-5 rounded-3xl bg-[#1a1425] border border-white/5 shadow-2xl rounded-tl-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                  </div>
                 </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Area - Sleek Zyricon Bar */}
          <div className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2rem] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <div className="relative">
                 <input 
                   className="w-full pl-6 pr-16 py-5 rounded-[1.8rem] bg-[#1a1425] border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner" 
                   placeholder="Ask about pending tasks, overdue work, or week summary..." 
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   disabled={isLoading}
                 />
                 <button 
                   type="submit" 
                   disabled={isLoading || !input.trim()} 
                   className="absolute right-2 top-2 bottom-2 aspect-square rounded-[1.4rem] bg-gradient-to-tr from-[#8b5cf6] to-[#d946ef] text-white flex items-center justify-center shadow-lg shadow-purple-500/40 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
                 >
                   <Send size={20} className="ml-1" />
                 </button>
              </div>
            </form>
            <div className="flex items-center justify-center gap-6 mt-4 text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">
               <span>End-to-end encrypted</span>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}
