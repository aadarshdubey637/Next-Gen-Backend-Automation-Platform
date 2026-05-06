import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Command, Terminal, Database, HelpCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommandBar = () => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const suggestions = [
    { label: 'Create API', icon: <Zap size={14} />, intent: 'build' },
    { label: 'Test API', icon: <Terminal size={14} />, intent: 'test' },
    { label: 'Generate Schema', icon: <Database size={14} />, intent: 'schemas' },
    { label: 'How it works', icon: <HelpCircle size={14} />, intent: 'docs' },
  ];

  const handleAction = (intent, query = '') => {
    // Mapping intents to routes/tabs
    const routes = {
      build: '/generator?tab=build',
      test: '/generator?tab=test',
      schemas: '/generator?tab=schemas',
      docs: '/generator?tab=docs',
    };

    if (routes[intent]) {
      navigate(routes[intent]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.toLowerCase();
    
    if (text.includes('test') || text.includes('debug')) {
      handleAction('test');
    } else if (text.includes('schema') || text.includes('model')) {
      handleAction('schemas');
    } else if (text.includes('how') || text.includes('help')) {
      handleAction('docs');
    } else {
      handleAction('build');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-12 relative z-50">
      <form 
        onSubmit={handleSubmit}
        className={`relative group transition-all duration-500 ${isFocused ? 'scale-[1.02]' : 'scale-100'}`}
      >
        {/* Glow Effect */}
        <div className={`absolute -inset-1 bg-gradient-to-r from-[#00ffaa]/20 to-[#00ffaa]/10 blur-xl rounded-2xl transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className={`relative flex items-center bg-[#0f0f0f] border rounded-2xl p-2 transition-all duration-300 ${isFocused ? 'border-[#00ffaa] shadow-[0_0_30px_rgba(0,255,170,0.1)]' : 'border-[#1a1a1a]'}`}>
          <div className="pl-4 text-slate-500">
            <Sparkles size={20} className={isFocused ? 'text-[#00ffaa] animate-pulse' : ''} />
          </div>
          
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What do you want to build today?"
            className="w-full bg-transparent border-none outline-none px-4 py-4 text-white placeholder:text-slate-700 text-lg font-normal"
          />

          <button 
            type="submit"
            className="bg-[#00ffaa] text-black p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </form>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + (i * 0.1) }}
            onClick={() => handleAction(s.intent)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#333] hover:border-[#00ffaa]/50 hover:bg-[#00ffaa]/5 rounded-full text-xs font-medium text-slate-400 hover:text-white transition-all group"
          >
            <span className="group-hover:text-[#00ffaa] transition-colors">{s.icon}</span>
            {s.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CommandBar;
