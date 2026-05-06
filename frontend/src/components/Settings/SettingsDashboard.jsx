import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Settings, 
  Key, 
  BarChart3, 
  CreditCard, 
  Database,
  Mail,
  Lock,
  Smartphone,
  Moon,
  Sun,
  Cpu,
  Globe,
  Plus,
  Copy,
  Trash2,
  HardDrive,
  Download,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Save,
  Eye,
  EyeOff,
  Terminal
} from 'lucide-react';

const ApiKeyCard = ({ item }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.key);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="p-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md flex items-center justify-between group hover:border-[#00ffaa]/20 transition-all">
      <div className="space-y-3 flex-1 mr-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.name}</p>
          {item.id === 'prod' && <span className="px-1.5 py-0.5 bg-[#00ffaa]/10 border border-[#00ffaa]/20 text-[8px] font-black text-[#00ffaa] rounded-md uppercase tracking-tighter">Live</span>}
        </div>
        <div className="bg-black border border-[#1a1a1a] rounded-md px-4 py-3 flex items-center justify-between group/key shadow-inner">
          <code className="text-xs text-slate-500 font-mono tracking-wider">
            {isVisible ? item.key : '••••••••••••••••••••••••••••••••'}
          </code>
          <button 
            onClick={() => setIsVisible(!isVisible)}
            className="ml-4 text-slate-600 hover:text-[#00ffaa] transition-colors"
          >
            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleCopy}
          className={`p-3 rounded-md border transition-all ${isCopied ? 'bg-[#00ffaa]/5 border-[#00ffaa]/20 text-[#00ffaa]' : 'bg-[#1a1a1a] border-[#333] text-slate-500 hover:text-white hover:border-white/20'}`}
        >
          {isCopied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
        </button>
        <button className="p-3 bg-[#1a1a1a] border border-[#333] text-slate-600 hover:text-red-400 hover:border-red-400/20 rounded-md transition-all"><Trash2 size={18} /></button>
      </div>
    </div>
  );
};

const SettingsDashboard = () => {
  const [activeSection, setActiveTab] = useState('profile');
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({
    username: '...',
    email: '...',
    role: '...',
    is_active: true
  });
  const [stats, setStats] = useState({
    schemas: 0,
    endpoints: 0
  });

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [userRes, schemaRes] = await Promise.all([
        axios.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v1/schemas/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUser(userRes.data);
      setStats({
        schemas: schemaRes.data.length,
        endpoints: schemaRes.data.length * 5
      });
    } catch (err) {
      console.error('Failed to fetch settings data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'api-keys', label: 'API Keys', icon: <Key size={16} /> },
    { id: 'data', label: 'Data', icon: <Database size={16} /> },
    { id: 'usage', label: 'Usage', icon: <BarChart3 size={16} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={16} /> },
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportData = () => {
    const token = localStorage.getItem('token');
    axios.get('/api/v1/schemas/', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `autobackend_schemas_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      })
      .catch(err => console.error('Export failed', err));
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-12">
            {/* Profile Header Card */}
            <div className="relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ffaa]/5 blur-3xl group-hover:bg-[#00ffaa]/10 transition-all duration-700 pointer-events-none" />
              <div className="relative p-8 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md flex flex-col md:flex-row items-center gap-8 shadow-xl">
                <div className="relative">
                  <div className="w-28 h-28 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center overflow-hidden group/avatar shadow-inner">
                    <User size={48} className="text-slate-700 group-hover/avatar:text-[#00ffaa] group-hover/avatar:scale-110 transition-all duration-500" />
                    <div className="absolute inset-0 bg-[#00ffaa]/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <div className="p-2 bg-black/80 rounded-md border border-[#333]">
                        <Plus size={18} className="text-[#00ffaa]" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00ffaa] border-2 border-[#0a0a0a] rounded-full shadow-[0_0_10px_rgba(0,255,170,0.5)]" />
                </div>
                
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <h3 className="text-2xl font-medium text-white tracking-tight">{user.username}</h3>
                    <span className="px-2 py-0.5 bg-[#00ffaa]/10 text-[#00ffaa] text-[9px] font-black uppercase tracking-widest rounded-md border border-[#00ffaa]/20 w-fit mx-auto md:mx-0">
                      {user.role} Verified
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] font-medium uppercase tracking-[0.2em]">{user.email} • ID: {user.id?.slice(0, 8)}...</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-md border border-[#1a1a1a]">
                      <Database size={12} className="text-blue-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stats.schemas} Schemas</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-md border border-[#1a1a1a]">
                      <Globe size={12} className="text-purple-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stats.endpoints} Endpoints</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 px-1">Infrastructure Access</h4>
                <div className="space-y-4">
                  <div className="space-y-2 group">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-[#00ffaa] transition-colors">Username Handle</label>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input type="text" value={user.username} readOnly className="w-full bg-black border border-[#1a1a1a] rounded-md py-3.5 pl-12 pr-6 text-xs text-slate-400 font-mono outline-none shadow-inner opacity-60" />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-[#00ffaa] transition-colors">Auth Channel</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input type="email" value={user.email} readOnly className="w-full bg-black border border-[#1a1a1a] rounded-md py-3.5 pl-12 pr-6 text-xs text-slate-400 font-mono outline-none shadow-inner opacity-60" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 px-1">Engine Bio</h4>
                <div className="space-y-2 group h-full">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-[#00ffaa] transition-colors">System Overview</label>
                  <textarea 
                    placeholder="Autonomous developer building high-performance APIs."
                    className="w-full bg-black border border-[#1a1a1a] rounded-md py-4 px-5 text-xs text-slate-300 outline-none focus:border-[#00ffaa]/20 transition-all h-[116px] resize-none leading-relaxed font-medium" 
                  />
                </div>
              </div>
            </div>

            {/* Account Metadata */}
            <div className="p-6 bg-black border border-[#1a1a1a] rounded-md grid grid-cols-2 md:grid-cols-4 gap-4 shadow-inner">
               {[
                 { label: 'Core Role', value: user.role },
                 { label: 'Engine Tier', value: 'Enterprise' },
                 { label: 'Cloud Zone', value: 'Global-US-East' },
                 { label: 'Status', value: user.is_active ? 'Nominal' : 'Offline' },
               ].map((item, i) => (
                 <div key={i} className="space-y-1.5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">{item.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.value}</p>
                 </div>
               ))}
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-8">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-8">Security Protocol</h3>
            <div className="space-y-3">
               {[
                 { title: 'System Password', desc: 'Refresh authentication credentials.', icon: <Lock size={18} />, action: 'Cycle' },
                 { title: 'Multi-Factor Auth', desc: 'Biometric & TOTP verification layers.', icon: <Smartphone size={18} />, action: 'Enable' },
                 { title: 'Active Buffers', desc: 'Active engine sessions across zones.', icon: <Globe size={18} />, action: 'Purge' },
               ].map((item, i) => (
                 <div key={i} className="p-5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md flex items-center justify-between hover:border-[#00ffaa]/20 transition-all group">
                    <div className="flex items-center gap-5">
                       <div className="w-10 h-10 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-slate-500 group-hover:text-[#00ffaa] transition-colors">
                          {item.icon}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-white tracking-tight">{item.title}</p>
                          <p className="text-[10px] text-slate-600 font-medium uppercase tracking-tight mt-1">{item.desc}</p>
                       </div>
                    </div>
                    <button className="px-4 py-2 bg-[#1a1a1a] border border-[#333] hover:border-[#00ffaa]/30 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-[#00ffaa] transition-all">{item.action}</button>
                 </div>
               ))}
            </div>
          </div>
        );
      case 'api-keys':
        return (
          <div className="space-y-10">
            <div className="flex justify-between items-end">
               <div>
                  <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Access Tokens</h3>
                  <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest mt-2">Manage secret keys for external automation.</p>
               </div>
               <button className="bg-[#00ffaa]/10 text-[#00ffaa] border border-[#00ffaa]/20 px-4 py-2 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#00ffaa] hover:text-black transition-all">
                  <Plus size={14} /> Initialize Token
               </button>
            </div>
            <div className="space-y-4">
               {[
                 { id: 'dev', name: 'Internal Sandbox', key: 'ak_dev_51PqW2S2E9r8xV4L0zN1m7b9v6c5x4z3a2s1', created: '2 days ago' },
                 { id: 'prod', name: 'Production Grid', key: 'ak_live_88zX92K0L1M2N3P4Q5R6S7T8U9V0W1X2', created: '1 month ago' },
               ].map((item, i) => (
                 <ApiKeyCard key={i} item={item} />
               ))}
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-8">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-8">Data Synchronization</h3>
            <div className="p-10 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md flex flex-col items-center text-center space-y-6 shadow-xl">
               <div className="w-20 h-20 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-blue-400 shadow-inner">
                  <Database size={40} />
               </div>
               <div className="space-y-2 max-w-sm mx-auto">
                  <h4 className="text-xl font-medium text-white tracking-tight">Export Infrastructure</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">Download a complete JSON backup of all your schemas, field definitions, and storage configurations.</p>
               </div>
               <button 
                 onClick={handleExportData}
                 className="px-10 py-4 bg-[#1a1a1a] border border-[#333] hover:border-blue-500/30 rounded-md text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-blue-400 transition-all flex items-center gap-3"
               >
                 <Download size={16} />
                 Start JSON Export
               </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="h-80 flex flex-col items-center justify-center text-center space-y-6 text-slate-700">
             <div className="w-16 h-16 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
                <Settings size={28} className="opacity-20" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">{activeSection.replace('-', ' ')} protocol locked</p>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-12 gap-8 pb-20 relative z-10">
      {/* Sidebar Nav */}
      <div className="col-span-12 lg:col-span-3 space-y-2">
         <div className="mb-10 px-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-[#1a1a1a] flex items-center justify-center text-[#00ffaa] border border-[#333] shadow-inner">
               <Settings size={24} />
            </div>
            <div>
               <h1 className="text-xl font-medium text-white tracking-tight">Settings</h1>
               <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">Core Environment</p>
            </div>
         </div>
         <div className="space-y-1">
            {menuItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === item.id ? 'bg-[#1a1a1a] text-[#00ffaa] border border-[#00ffaa]/30 shadow-lg' : 'text-slate-500 hover:bg-white/[0.02] hover:text-white border border-transparent'}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="col-span-12 lg:col-span-9">
         <motion.div 
           key={activeSection}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md flex flex-col overflow-hidden shadow-2xl min-h-[700px]"
         >
            {/* Toolbar */}
            <div className="p-6 border-b border-[#1a1a1a] bg-white/[0.01] flex items-center justify-between relative z-10">
               <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-600">
                  <span>Engine</span>
                  <ChevronRight size={10} />
                  <span className="text-[#00ffaa]">{activeSection.replace('-', ' ')}</span>
               </div>
               <button 
                 onClick={handleSave}
                 className="bg-[#00ffaa] text-black font-black py-2.5 px-8 rounded-md flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,170,0.1)]"
               >
                 {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                 {isSaved ? 'Sync Complete' : 'Commit Changes'}
               </button>
            </div>

            {/* Form Content */}
            <div className="p-10 relative z-10">
               {isLoading ? (
                 <div className="h-96 flex flex-col items-center justify-center space-y-4 opacity-30">
                    <div className="w-12 h-12 rounded-md border-2 border-dashed border-[#00ffaa] animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Accessing Buffer...</p>
                 </div>
               ) : renderContent()}
            </div>
         </motion.div>

         {/* Bottom Tip */}
         <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-md flex items-center gap-6 group">
            <div className="w-12 h-12 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-blue-400 shrink-0 shadow-inner group-hover:border-blue-500/30 transition-all">
               <Terminal size={20} />
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest">
               Need a full autonomous backup? Synchronize your entire workspace logic in the <button onClick={() => setActiveTab('data')} className="text-blue-400 hover:underline">Data Sync</button> module for cold storage or migration.
            </p>
         </div>
      </div>
    </div>
  );
};

export default SettingsDashboard;
