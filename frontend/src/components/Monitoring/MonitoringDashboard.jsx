import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  Shield, 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  RefreshCcw,
  ExternalLink,
  Terminal
} from 'lucide-react';

import axios from 'axios';

const MonitoringDashboard = ({ schemas = [] }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState({
    metrics: {
      latency: '...',
      throughput: '...',
      error_rate: '...',
      uptime: '...'
    },
    logs: [],
    systems: []
  });

  // Simulated real-time tick for metrics to make it feel alive
  const [displayMetrics, setDisplayMetrics] = useState(data.metrics);

  const fetchMonitoringData = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/admin/monitoring', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setDisplayMetrics(res.data.metrics);
    } catch (err) {
      console.error('Failed to fetch monitoring data', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 3000); // Faster refresh for real-time feel
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: 'Latency', value: displayMetrics.latency, icon: <Zap size={16} />, color: 'text-[#00ffaa]', trend: -12 },
    { label: 'Throughput', value: displayMetrics.throughput, icon: <Activity size={16} />, color: 'text-blue-400', trend: +8 },
    { label: 'Error Rate', value: displayMetrics.error_rate, icon: <AlertCircle size={16} />, color: 'text-red-400', trend: -2 },
    { label: 'Uptime', value: displayMetrics.uptime, icon: <Server size={16} />, color: 'text-purple-400', trend: 0 },
  ];

  const systems = data.systems.length > 0 ? data.systems : [
    { name: 'PostgreSQL', status: 'Connecting...', load: '0%' },
    { name: 'MongoDB', status: 'Connecting...', load: '0%' },
    { name: 'Redis Cache', status: 'Connecting...', load: '0%' },
    { name: 'AI Engine', status: 'Ready', load: '0%' },
  ];

  return (
    <div className="space-y-8 pb-20 relative z-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-md bg-[#1a1a1a] flex items-center justify-center text-[#00ffaa] border border-[#333] shadow-inner">
              <Activity size={32} />
           </div>
           <div>
              <h1 className="text-4xl font-medium tracking-tight text-white mb-1">System Monitoring</h1>
              <p className="text-slate-500 font-medium text-sm">Real-time health and performance metrics of your autonomous infrastructure.</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-[#00ffaa]/10 border border-[#00ffaa]/20 px-3 py-1.5 rounded-md">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ffaa] animate-pulse" />
              <span className="text-[#00ffaa] text-[10px] font-black uppercase tracking-widest">Live Engine</span>
           </div>
           <button 
             onClick={fetchMonitoringData}
             className={`p-3 bg-[#1a1a1a] border border-[#333] rounded-md hover:border-[#00ffaa]/30 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
           >
             <RefreshCcw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-slate-400`} />
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-6 relative overflow-hidden group hover:border-[#00ffaa]/20 transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ffaa]/5 blur-3xl group-hover:bg-[#00ffaa]/10 transition-all" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`w-10 h-10 rounded-md bg-[#1a1a1a] flex items-center justify-center ${stat.color} border border-[#333] shadow-inner`}>
                {stat.icon}
              </div>
              {stat.trend !== 0 && (
                <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md border ${stat.trend < 0 ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                  {stat.trend < 0 ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                  {Math.abs(stat.trend)}%
                </div>
              )}
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-2xl font-medium text-white tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* System Health */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ffaa]" />
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Service Cluster</h3>
              </div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Autonomous Instance</span>
            </div>
            <div className="p-4 bg-[#0a0a0a]">
              <div className="space-y-1">
                {systems.map((sys, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-md hover:bg-white/[0.02] transition-all group border border-transparent hover:border-white/5">
                    <div className="w-10 h-10 rounded-md bg-[#1a1a1a] flex items-center justify-center text-slate-500 group-hover:text-[#00ffaa] border border-[#333] transition-colors">
                      {sys.name.includes('DB') || sys.name.includes('Postgre') || sys.name.includes('Mongo') ? <Database size={18} /> : <Cpu size={18} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{sys.name}</p>
                      <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">System Load: {sys.load}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end mb-2">
                        <span className="text-[10px] font-black text-[#00ffaa] uppercase tracking-widest">{sys.status}</span>
                        <div className="w-1 h-1 rounded-full bg-[#00ffaa]" />
                      </div>
                      <div className="w-32 h-1 bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: sys.load }}
                          transition={{ duration: 1.5 }}
                          className="h-full bg-gradient-to-r from-[#00ffaa]/50 to-[#00ffaa]" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active APIs */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-all" />
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
              <BarChart3 className="text-blue-500" size={16} />
              Resource Allocation
            </h3>
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="p-6 bg-black/40 rounded-md border border-[#1a1a1a] space-y-4 hover:border-blue-500/20 transition-all">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Schemas</span>
                    <span className="text-3xl font-medium text-white tracking-tight">{schemas.length}</span>
                 </div>
                 <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-blue-500 w-[65%] shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                 </div>
              </div>
              <div className="p-6 bg-black/40 rounded-md border border-[#1a1a1a] space-y-4 hover:border-purple-500/20 transition-all">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">API Endpoints</span>
                    <span className="text-3xl font-medium text-white tracking-tight">{schemas.length * 5}</span>
                 </div>
                 <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-purple-500 w-[45%] shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Logs / Activity */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md flex flex-col h-full shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-all" />
            <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between bg-white/[0.01] relative z-10">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-3">
                <Terminal className="text-[#00ffaa]" size={16} />
                Engine Console
              </h3>
              <div className="px-2 py-0.5 bg-[#00ffaa]/10 border border-[#00ffaa]/20 text-[#00ffaa] text-[9px] font-black rounded-md uppercase tracking-widest">Realtime</div>
            </div>
            
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[650px] font-mono relative z-10 custom-scrollbar">
               {data.logs.length > 0 ? (
                 data.logs.map((log, i) => (
                   <div key={i} className="flex gap-4 text-[11px] group border-l border-[#1a1a1a] pl-4 hover:border-[#00ffaa]/30 transition-colors py-1">
                      <span className="text-slate-700 shrink-0 font-medium">{log.time}</span>
                      <div className="space-y-1.5 flex-1">
                         <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm border ${
                                log.message.includes('→') ? 'bg-blue-500/5 border-blue-500/20 text-blue-400' : 
                                log.message.includes('←') ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 
                                log.level === 'ERROR' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
                                'bg-[#1a1a1a] border-[#333] text-slate-400'
                            }`}>
                               {log.message.includes('→') ? 'IN' : log.message.includes('←') ? 'OUT' : log.level}
                            </span>
                            {log.message.match(/\b\d{3}\b/) && (
                               <span className="text-[10px] font-bold text-slate-500">
                                  {log.message.match(/\b\d{3}\b/)[0]}
                               </span>
                            )}
                         </div>
                         <p className="text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed break-all">
                            {log.message.split('|').pop().trim()}
                         </p>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-50 space-y-6">
                    <div className="w-16 h-16 rounded-full border border-dashed border-slate-800 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                       <Activity size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Listening for events...</p>
                 </div>
               )}
            </div>
            
            <div className="p-6 border-t border-[#1a1a1a] bg-black/20">
               <button onClick={fetchMonitoringData} className="w-full py-3 bg-[#1a1a1a] border border-[#333] rounded-md text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-[#00ffaa] hover:border-[#00ffaa]/30 transition-all">
                  Synchronize Buffer
               </button>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}} />
    </div>
  );
};

export default MonitoringDashboard;
