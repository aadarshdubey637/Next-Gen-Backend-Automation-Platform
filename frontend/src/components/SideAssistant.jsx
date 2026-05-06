import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Send, X, MessageSquare, Brain, 
  Terminal, Database, HelpCircle, ArrowRight,
  Loader2, ChevronRight, Settings, Plus, Lightbulb
} from 'lucide-react';
import axios from 'axios';

const SideAssistant = ({ onAction, currentTab, isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "I'm your AI partner. How can I help you build today?",
      suggestions: [
        'How to create an API?',
        'Add tests to validate API',
        'Generate schema from prompt',
        'Setup auth'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleActionClick = (action, label) => {
    setActionFeedback(label);
    setTimeout(() => {
      onAction(action);
      setActionFeedback(null);
      if (action.type === 'switch_tab') onClose();
    }, 1000);
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Context-Aware Local Logic (Action Priority)
      const localAction = detectAction(text.toLowerCase(), currentTab);
      if (localAction) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: localAction.message,
          action: localAction.action,
          actionLabel: localAction.actionLabel,
          suggestions: localAction.suggestions
        }]);
        setIsLoading(false);
        return;
      }

      // 2. Grok API for Intent & Step-by-Step
      const res = await axios.post('/api/v1/schemas/prompt-to-schema', {
        prompt: `CONTEXT: User is on ${currentTab} tab.
                 QUERY: ${text}
                 TASK: Provide a step-by-step guide (1, 2, 3...) on how to achieve this. 
                 Combine it with an actionable button suggestion.`, 
        db_type: 'postgresql' 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data && res.data.length > 0) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I've analyzed your requirements. I can generate a complete backend architecture for this right now. Would you like to proceed?",
          action: { type: 'generate_schema', data: text },
          actionLabel: "Generate Infrastructure",
          suggestions: ['Tell me the steps first', 'How to test?']
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "To achieve this, follow these steps:\n\n1. Go to the **API Architect**\n2. Define your resource name and fields\n3. Click **Generate** to deploy live.\n\nShould I take you to the Builder?",
          action: { type: 'switch_tab', tab: 'build' },
          actionLabel: "Open API Architect",
          suggestions: ['Show me an example', 'How to test?']
        }]);
      }
    } catch (err) {
      const fallback = getFallbackResponse(text.toLowerCase());
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: fallback.content,
        suggestions: fallback.suggestions
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const detectAction = (text, tab) => {
    if (text.includes('how') || text.includes('create') || text.includes('build')) {
      return {
        message: "To build a new API from scratch:\n\n1. Open the **API Architect**\n2. Add your attributes (e.g. name, email)\n3. Click **Generate**\n\nI can open the tool for you below.",
        action: { type: 'switch_tab', tab: 'build' },
        actionLabel: "Launch API Architect",
        suggestions: ['How to test?', 'Add security']
      };
    }
    if (text.includes('test') || text.includes('debug')) {
      return {
        message: "You can run live requests in the **API Console**. Just select your schema and click 'Run Request'.",
        action: { type: 'switch_tab', tab: 'test' },
        actionLabel: "Open API Console",
        suggestions: ['How to build?', 'View schemas']
      };
    }
    return null;
  };

  const getFallbackResponse = (text) => {
    return {
      content: "I'm currently in guidance mode. You can use the buttons below to navigate to the key features of the platform.",
      suggestions: ['Open API Builder', 'How to test API?']
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for all screens to allow closing by clicking outside */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[55]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[450px] bg-[#000] border-l border-[#1a1a1a] z-[60] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)]"
          >
            {/* Action Feedback Overlay */}
            <AnimatePresence>
              {actionFeedback && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-20 left-1/2 -translate-x-1/2 z-[70] bg-[#00ffaa] text-black px-6 py-3 rounded-full font-bold text-sm shadow-[0_0_30px_rgba(0,255,170,0.4)] flex items-center gap-3"
                >
                  <Loader2 size={16} className="animate-spin" />
                  {actionFeedback}...
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="p-6 border-b border-[#1a1a1a] bg-[#000] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00ffaa]/10 flex items-center justify-center text-[#00ffaa] border border-[#00ffaa]/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">AI Assistant</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffaa] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffaa]"></span>
                    </span>
                    <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest">Grok-2 Node</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-3 bg-[#1a1a1a] hover:bg-[#333] border border-[#333] rounded-xl text-white transition-all shadow-lg active:scale-90"
                title="Close Assistant"
              >
                <X size={24} />
              </button>
            </div>

            {/* Chat Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#000]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[90%] p-5 rounded-2xl text-sm leading-relaxed shadow-xl ${
                    msg.role === 'user' 
                      ? 'bg-[#00ffaa] text-black rounded-tr-none' 
                      : 'bg-[#0f0f0f] text-[#888] border border-[#1a1a1a] rounded-tl-none'
                  }`}>
                    <div className={`whitespace-pre-wrap ${msg.role === 'assistant' ? 'text-[#888]' : 'text-white'}`}>
                      {msg.role === 'assistant' ? (
                        <div className="text-white font-medium mb-1 opacity-100">{msg.content}</div>
                      ) : msg.content}
                    </div>
                    
                    {msg.action && (
                      <button 
                        onClick={() => handleActionClick(msg.action, msg.actionLabel || 'Executing')}
                        className="mt-6 w-full py-3 bg-[#00ffaa] hover:bg-[#00ffaa]/90 text-black rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,170,0.2)]"
                      >
                        {msg.actionLabel || 'Execute Action'}
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>

                  {msg.suggestions && (
                    <div className="mt-4 flex flex-wrap gap-2 w-full justify-start pl-2">
                      {msg.suggestions.map((s, j) => (
                        <button 
                          key={j}
                          onClick={() => handleSend(s)}
                          className="px-4 py-2 bg-[#0f0f0f] hover:bg-[#00ffaa]/10 border border-[#1a1a1a] hover:border-[#00ffaa]/30 rounded-full text-[11px] font-bold text-slate-400 hover:text-[#00ffaa] transition-all shadow-lg"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#1a1a1a] rounded-tl-none shadow-xl">
                    <div className="flex gap-1.5">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-[#00ffaa]" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#00ffaa]/70" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#00ffaa]/40" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Input */}
            <div className="p-6 bg-[#000] border-t border-[#1a1a1a]">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00ffaa]/20 to-[#00ffaa]/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
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
                    placeholder="Describe what you need..."
                    className="w-full bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl pl-5 pr-14 py-5 text-sm text-white placeholder:text-slate-600 focus:border-[#00ffaa]/50 outline-none transition-all resize-none h-28 shadow-inner"
                  />
                  <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-4 bottom-4 p-3 bg-[#00ffaa] hover:bg-[#00ffaa]/90 disabled:bg-slate-800 text-black rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-bold px-1 uppercase tracking-[0.15em]">
                <span className="flex items-center gap-2"><Lightbulb size={12} className="text-[#00ffaa]" /> Press Enter to send</span>
                <span className="text-slate-700">AutoBackend v2.0</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SideAssistant;
