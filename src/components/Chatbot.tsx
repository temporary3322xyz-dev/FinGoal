import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Bot, User, Sparkles, Cpu } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { auth } from '../lib/firebase';
import GlassCard from './shared/GlassCard';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I'm your FinGoal AI assistant. How can I help you optimize your finances today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;

  const suggestedQuestions = [
    "Where should I invest ₹10k?",
    "How to save on taxes?",
    "Analyze my spending",
    "Emergency fund tips"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (customMessage?: string) => {
    const userMessage = customMessage || input.trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const systemPrompt = `
        You are FinGoal AI, a premium financial assistant specializing in the Indian market. 
        Your tone is professional, sophisticated, and helpful.
        User Name: ${user?.displayName || 'User'}
        Currency: Indian Rupee (₹)
        
        When asked about investment allocations for monthly savings, suggest:
        - Nifty 50 Index SIP: 45% (Core Growth)
        - ELSS (Tax Saving): 25% (Equity + Tax Benefit)
        - Sovereign Gold Bonds: 15% (Stability/Hedge)
        - Liquid/Emergency Fund: 15% (Liquidity)
        
        Provide concise, actionable financial advice. Use technical but accessible language. 
        Focus on long-term wealth creation and tax efficiency (80C, etc.).
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n\nConversation History:\n" + messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + `\nUser: ${userMessage}` }]
          }
        ]
      });

      const text = result.text;
      if (!text) throw new Error("Empty response from AI");

      setMessages(prev => [...prev, { role: 'model', content: text }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "I encountered a synchronization error. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute bottom-20 right-0 w-[400px] md:w-[500px] h-[700px] flex flex-col"
          >
            <GlassCard className="flex-1 flex flex-col overflow-hidden border-white/[0.08] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] bg-[#0A0A0A]/95" hover={false}>
              {/* Header */}
              <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/30 rounded-xl flex items-center justify-center text-brand-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">FinGoal Intelligence</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Neural Link Active</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
              >
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-4 max-w-[90%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border ${
                        m.role === 'user' 
                          ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' 
                          : 'bg-white/5 border-white/10 text-gray-400'
                      }`}>
                        {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/10'
                          : 'bg-white/[0.03] border border-white/[0.05] text-gray-300'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-4 max-w-[90%]">
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border bg-white/5 border-white/10 text-gray-400">
                        <Bot size={14} />
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-3">
                        <div className="flex gap-1">
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Questions */}
              {messages.length === 1 && !isLoading && (
                <div className="px-6 pb-4 flex flex-wrap gap-2">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[10px] font-medium text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-6 border-t border-white/[0.05] bg-white/[0.01]">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500/20 to-emerald-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                  <div className="relative flex items-center">
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Message FinGoal AI..."
                      className="w-full bg-[#0A0A0A] border border-white/[0.1] rounded-xl pl-5 pr-14 py-4 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-all placeholder:text-gray-600 shadow-inner"
                    />
                    <button 
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2.5 p-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-center text-gray-600 mt-3 uppercase tracking-widest font-mono">
                  FinGoal AI can make mistakes. Verify important financial decisions.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-600 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </div>
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0A0A0A] rounded-full animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
