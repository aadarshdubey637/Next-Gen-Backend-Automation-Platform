import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Send, X, MessageSquare, Brain, 
  Terminal, Database, HelpCircle, ArrowRight,
  Loader2, RefreshCcw, ChevronRight
} from 'lucide-react';
import axios from 'axios';

const AIAssistant = ({ onAction, currentTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "What do you want to build today?",
      suggestions: ['Create API', 'Test API', 'Generate Schema', 'Learn how it works']
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Quick Local Guidance/Action Detection (Mentorship Tone)
      const guidance = detectAction(text.toLowerCase());
      if (guidance) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: guidance.message,
        }]);
        
        // If it's a direct action, execute it with a slight delay
        if (guidance.action && guidance.action.type === 'switch_tab') {
          setTimeout(() => {
            onAction(guidance.action);
            setIsOpen(false);
          }, 2000);
        }
        setIsLoading(false);
        return;
      }

      // 2. Grok API for Smart Answering
      console.log(`[AI Assistant] Requesting Grok for: "${text}"`);
      
      const res = await axios.post('/api/v1/schemas/prompt-to-schema', { 
        prompt: `SYSTEM_ROLE: You are a helpful mentor for the AutoBackend platform. 
                 USER_QUERY: ${text}
                 CURRENT_TAB: ${currentTab}
                 TASK: Answer the user's question directly and helpfully. If they want to build something, suggest the API Builder.
                 TONE: Professional, encouraging, and concise.`, 
        db_type: 'postgresql' 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      console.log("[AI Assistant] Grok Response Received:", res.data);

      if (res.data && res.data.length > 0) {
        // If the AI generated a schema, offer to apply it
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I've architected a solution based on your request. Would you like to view the schema in the API Builder?`,
          action: { type: 'generate_schema', data: text }
        }]);
      } else {
        // If it's just a conversation, provide a helpful answer
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I understand what you're looking for. To get started, I recommend opening the API Builder where we can define your resources together. Should I take you there?",
          suggestions: ['Yes, open Builder', 'How does it work?']
        }]);
      }
    } catch (err) {
      console.error("[AI Assistant] Grok Connection Failed:", err);
      
      // Smart Fallback (Mentorship mode)
      const fallbackMsg = getSmartFallback(text.toLowerCase());
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: fallbackMsg.content,
        suggestions: fallbackMsg.suggestions
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSmartFallback = (text) => {
    if (text.includes('how') || text.includes('help')) {
        return {
            content: "I'm here to help! To build your first API:\n\n1. Go to the **API Builder** tab\n2. Give your resource a **Name** (like 'Order')\n3. Add **Fields** (attributes like 'price' or 'status')\n4. Click **Generate** to deploy your infrastructure.\n\nWould you like to try it now?",
            suggestions: ['Open API Builder', 'Tell me more']
        };
    }
    return {
        content: "I'm currently in offline guidance mode, but I can still help you navigate. Are you looking to build a new API, test an existing one, or manage your schemas?",
        suggestions: ['Build API', 'Test API', 'My Schemas']
    };
  };

  const detectAction = (text) => {
    if (text.includes('how to use') || text.includes('what is this') || text.includes('how does this work')) {
      return {
        message: "AutoBackend is a platform that automates your entire backend infrastructure. Here is the workflow:\n\n1. **Model**: Use the API Builder to define your data.\n2. **Generate**: We build the DB, Auth, and Routes.\n3. **Test**: Use the API Console to verify.\n\nShould we start by building a sample resource?",
        action: { type: 'switch_tab', tab: 'build' }
      };
    }
    if (text.includes('create api') || text.includes('build api') || text.includes('new api')) {
      return {
        message: "Excellent choice. I'm opening the **API Architect** for you now. You can describe your requirements there or add fields manually.",
        action: { type: 'switch_tab', tab: 'build' }
      };
    }
    if (text.includes('test api') || text.includes('debug') || text.includes('console')) {
      return {
        message: "Taking you to the **API Console**. This is where you can run live requests against your deployed infrastructure.",
        action: { type: 'switch_tab', tab: 'test' }
      };
    }
    if (text.includes('schema') || text.includes('model') || text.includes('manage')) {
      return {
        message: "Navigating to your **Schema Modeler**. You can view and manage all your deployed resources here.",
        action: { type: 'switch_tab', tab: 'schemas' }
      };
    }
    return null;
  };

  const handleAction = (message) => {
    if (message.action) {
      onAction(message.action);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-96 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="p-4 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00ffaa]/10 flex items-center justify-center text-[#00ffaa]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">AI Assistant</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ffaa] animate-pulse" />
                    <span className="text-[10px] font-medium text-[#888] uppercase tracking-widest">Grok-2 Powered</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-[#1a1a1a] text-slate-200 border border-[#333] rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    
                    {msg.suggestions && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {msg.suggestions.map((s, j) => (
                          <button 
                            key={j}
                            onClick={() => handleSend(s)}
                            className="px-3 py-1 bg-black/40 hover:bg-[#00ffaa] hover:text-black border border-[#333] rounded-full text-[10px] font-bold transition-all uppercase tracking-wider"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.action && (
                      <button 
                        onClick={() => handleAction(msg)}
                        className="mt-3 w-full py-2 bg-[#00ffaa]/10 hover:bg-[#00ffaa]/20 border border-[#00ffaa]/30 rounded-md text-[#00ffaa] text-[10px] font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
                      >
                        Execute Action <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333] rounded-tl-none">
                    <Loader2 size={16} className="animate-spin text-[#00ffaa]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#1a1a1a] bg-black/40">
              <div className="relative">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe your API, schema, or request..."
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg pl-4 pr-12 py-3 text-sm text-white placeholder:text-slate-600 focus:border-[#00ffaa]/50 outline-none transition-all"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#00ffaa] disabled:text-slate-700 hover:scale-110 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-red-500 text-white' : 'bg-[#00ffaa] text-black shadow-[0_0_30px_rgba(0,255,170,0.4)]'
        }`}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
      </motion.button>
    </div>
  );
};

export default AIAssistant;
