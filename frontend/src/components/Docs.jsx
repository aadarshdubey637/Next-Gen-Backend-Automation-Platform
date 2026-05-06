import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Rocket, Shield, Database, Zap, ArrowRight } from 'lucide-react';

const Docs = () => {
  const sections = [
    {
      title: 'Getting Started',
      icon: <Rocket className="text-[#00ffaa]" size={24} />,
      content: 'Learn how to deploy your first automated backend in less than 60 seconds. Our platform handles everything from database provisioning to API routing.',
      links: ['Quickstart Guide', 'Architecture Overview', 'CLI Installation']
    },
    {
      title: 'Schema Design',
      icon: <Database className="text-[#00ffaa]" size={24} />,
      content: 'Design your data models using our Visual Builder or Raw JSON. Support for PostgreSQL, MySQL, and MongoDB with automatic relationship mapping.',
      links: ['Field Types', 'Validations', 'Relationships', 'Indexing']
    },
    {
      title: 'API Reference',
      icon: <Code2 className="text-[#00ffaa]" size={24} />,
      content: 'Auto-generated RESTful endpoints for every schema. Every build includes CRUD operations, advanced filtering, and pagination by default.',
      links: ['Authentication', 'Filtering & Sorting', 'Pagination', 'Error Codes']
    },
    {
      title: 'Security Layer',
      icon: <Shield className="text-[#00ffaa]" size={24} />,
      content: 'Production-ready security out of the box. Implement JWT-based auth or API Key restrictions with a single click in your schema settings.',
      links: ['Role Based Access', 'API Keys', 'CORS Settings', 'Rate Limiting']
    }
  ];

  return (
    <div className="py-10 px-4 max-w-6xl mx-auto">
      <div className="mb-16">
        <h1 className="text-5xl font-medium text-white mb-6 tracking-tight">Documentation</h1>
        <p className="text-lg text-slate-400 max-w-3xl font-normal leading-relaxed">
          Everything you need to build, deploy, and scale your backend infrastructure with AutoBackend.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] p-10 rounded-md hover:border-[#00ffaa]/30 transition-all group"
          >
            <div className="w-14 h-14 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-[#00ffaa]/20 transition-all">
              {section.icon}
            </div>
            <h3 className="text-2xl font-medium text-white mb-4">{section.title}</h3>
            <p className="text-slate-500 font-normal leading-relaxed mb-8">
              {section.content}
            </p>
            <div className="space-y-3">
              {section.links.map(link => (
                <button key={link} className="flex items-center gap-2 text-sm font-medium text-[#00ffaa] hover:text-white transition-colors group/link">
                  <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                  {link}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Featured Block */}
      <div className="bg-[#0f0f0f] border border-[#1a1a1a] p-12 rounded-md relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-medium text-white mb-4">Need help with custom logic?</h2>
          <p className="text-slate-400 max-w-2xl mb-8 font-normal">
            Our AI engine can help you write custom Python hooks and middleware for complex business requirements.
          </p>
          <button className="bg-[#00ffaa] text-black px-8 py-3 rounded-md font-medium hover:scale-105 transition-all">
            Explore AI Hooks
          </button>
        </div>
        <Zap size={200} className="absolute -right-10 -bottom-10 text-[#00ffaa]/5 rotate-12 opacity-10" />
      </div>
    </div>
  );
};

export default Docs;
