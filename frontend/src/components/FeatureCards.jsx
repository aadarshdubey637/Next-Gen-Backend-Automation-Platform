import React from 'react';
import { Layout, Terminal, Database } from 'lucide-react';

const features = [
  {
    title: 'API Architect',
    description: 'Design and deploy production-ready endpoints with a powerful visual interface. Automate boilerplate and focus on business logic.',
    icon: <Layout className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-400',
    glow: 'shadow-blue-500/20',
  },
  {
    title: 'API Console',
    description: 'A dedicated environment to test, debug, and monitor your requests in real-time. Full visibility into performance and payload data.',
    icon: <Terminal className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/20',
  },
  {
    title: 'Schema Modeler',
    description: 'Define your data structures with precision. Automatic migrations, version control, and team-wide synchronization built-in.',
    icon: <Database className="w-6 h-6" />,
    color: 'from-indigo-500 to-blue-500',
    glow: 'shadow-indigo-500/20',
  },
];

const FeatureCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 px-4 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <div
          key={index}
          className="group premium-card-border p-8 rounded-md transition-all duration-400 ease-out hover:scale-[1.02] hover:bg-[#0f0f0f] cursor-pointer overflow-hidden border border-[#1a1a1a]"
        >
          {/* Subtle Glow Background on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00ffaa]/0 to-[#00ffaa]/0 group-hover:from-[#00ffaa]/5 group-hover:to-transparent transition-all duration-500" />

          {/* Icon Container with Floating Animation */}
          <div className={`w-12 h-12 rounded-md flex items-center justify-center mb-8 bg-[#1a1a1a] border border-[#333] text-[#00ffaa] transition-all duration-500 group-hover:-translate-y-1`}>
            {feature.icon}
          </div>

          {/* Content with color transitions */}
          <h3 className="text-xl font-medium text-white mb-4 transition-colors duration-300">
            {feature.title}
          </h3>
          <p className="text-[#888] leading-relaxed text-sm transition-colors duration-300 group-hover:text-slate-300">
            {feature.description}
          </p>

          {/* Animated Glow in Corner */}
          <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-[#00ffaa] opacity-0 group-hover:opacity-5 blur-3xl transition-opacity duration-700`} />
        </div>
      ))}
    </div>
  );
};

export default FeatureCards;
