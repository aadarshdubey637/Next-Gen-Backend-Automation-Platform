import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Brain, Code2, Send, CheckCircle2, AlertCircle, Loader2, 
  ChevronRight, Database, Terminal, Copy, Plus, Trash2, 
  Box, Settings, Shield, Activity, Search, ChevronDown, 
  Globe, Lock, Clock, ExternalLink, Sparkles, Play,
  Layout
} from 'lucide-react'
import VisualApiBuilder from '../components/ApiBuilder/VisualApiBuilder'
import MonitoringDashboard from '../components/Monitoring/MonitoringDashboard'
import SettingsDashboard from '../components/Settings/SettingsDashboard'
import ConfirmationModal from '../components/ConfirmationModal'
import Pricing from '../components/Pricing'
import Docs from '../components/Docs'
import ApiTester from '../components/ApiTester'
import SideAssistant from '../components/SideAssistant'
import { useLocation } from 'react-router-dom'

const Generator = () => {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('build')
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [schemas, setSchemas] = useState([])
  const [toasts, setToasts] = useState([])
  const [testTarget, setTestTarget] = useState(null)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, schemaId: null, schemaName: '', loading: false })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab && ['build', 'test', 'monitor', 'schemas', 'pricing', 'docs'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [location])

  useEffect(() => {
    if (isAuthenticated) fetchSchemas()
  }, [isAuthenticated])

  useEffect(() => {
    const handleStorageChange = () => setIsAuthenticated(!!localStorage.getItem('token'))
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const getAuthHeader = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const fetchSchemas = async () => {
    try {
      const res = await axios.get('/api/v1/schemas/', { headers: getAuthHeader() })
      if (Array.isArray(res.data)) {
        setSchemas(res.data)
      } else {
        setSchemas([])
      }
      setIsAuthenticated(true)
    } catch (err) {
      if (err.response?.status === 401) setIsAuthenticated(false)
    }
  }

  const addToast = (message, type = 'info') => {
    try {
      const id = Math.random().toString(36).substr(2, 9)
      let displayMessage = ""

      if (message === null || message === undefined) {
        displayMessage = "An unknown error occurred"
      } else if (typeof message === 'object') {
        // Handle FastAPI validation errors (detail array)
        if (Array.isArray(message)) {
          displayMessage = message.map(m => {
            const loc = m && m.loc ? (Array.isArray(m.loc) ? m.loc.join(' → ') : String(m.loc)) : 'unknown';
            const msg = m && m.msg ? String(m.msg) : 'validation error';
            return `${loc}: ${msg}`;
          }).join(' | ')
        } else if (message.detail && Array.isArray(message.detail)) {
          displayMessage = message.detail.map(m => {
            const loc = m && m.loc ? (Array.isArray(m.loc) ? m.loc.join(' → ') : String(m.loc)) : 'unknown';
            const msg = m && m.msg ? String(m.msg) : 'validation error';
            return `${loc}: ${msg}`;
          }).join(' | ')
        } else if (message.message) {
          displayMessage = String(message.message)
        } else {
          displayMessage = JSON.stringify(message)
        }
      } else {
        displayMessage = String(message)
      }

      setToasts(prev => [...prev, { id, message: displayMessage, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8000) 
    } catch (toastErr) {
      console.error("Toast failed:", toastErr)
    }
  }

  const generateFromPrompt = async (prompt) => {
    if (!prompt) return addToast('Please enter a prompt', 'error')
    setLoading(true)
    try {
      const res = await axios.post('/api/v1/schemas/prompt-to-schema', { prompt, db_type: 'postgresql' }, { headers: getAuthHeader() })
      if (res.data && res.data.length > 0) {
        addToast('AI generated a schema for you!', 'success')
        return res.data[0]
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'AI Generation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateFromSchema = async (schema) => {
    // Check if the input is an array (Bulk Generation)
    if (Array.isArray(schema)) {
      setLoading(true);
      addToast(`Starting bulk generation for ${schema.length} resources...`, 'info');
      
      try {
        const cleanSchemas = schema.map(s => ({
          name: s.name,
          description: s.description || `Auto-generated ${s.name}`,
          fields: Array.isArray(s.fields) 
            ? s.fields.map(({ id, ...rest }) => ({
                name: rest.name,
                field_type: rest.field_type || rest.type,
                required: !!rest.required,
                unique: !!rest.unique,
                indexed: !!rest.indexed,
                default: rest.default,
                description: rest.description,
                max_length: rest.max_length,
                min_value: rest.min_value,
                max_value: rest.max_value
              }))
            : [],
          db_type: s.db_type || 'postgresql',
          enable_auth: !!s.enable_auth || !!s.enableAuth,
          enable_soft_delete: !!s.enable_soft_delete || !!s.softDelete
        }));

        const res = await axios.post('/api/v1/schemas/bulk', cleanSchemas, { 
          headers: getAuthHeader(),
          timeout: 120000 // 2 minutes for bulk
        });

        const report = res.data;
        if (report.created?.length > 0 || report.updated?.length > 0 || report.skipped?.length > 0) {
          const total = (report.created?.length || 0) + (report.updated?.length || 0) + (report.skipped?.length || 0) + (report.failed?.length || 0);
          
          let summaryMsg = `Bulk complete! `;
          if (report.created?.length) summaryMsg += `${report.created.length} created, `;
          if (report.updated?.length) summaryMsg += `${report.updated.length} updated, `;
          if (report.skipped?.length) summaryMsg += `${report.skipped.length} skipped.`;
          
          addToast(summaryMsg, 'success');
          
          if (report.failed && report.failed.length > 0) {
            report.failed.forEach(name => {
              addToast(`Failed: ${name} - ${report.errors[name] || 'Unknown error'}`, 'error');
            });
          }
          
          // Show details in console for debugging
          console.table(report.details);
          
          await fetchSchemas();
          setTimeout(() => setActiveTab('test'), 800);
        } else if (report.status === "COMPLETE" && report.failed?.length > 0) {
           addToast('Bulk generation failed for all entities.', 'error');
           report.failed.forEach(name => {
              addToast(`${name}: ${report.errors[name]}`, 'error');
           });
        } else {
          addToast(report.errors?.global || 'Bulk generation failed.', 'error');
        }
      } catch (err) {
        console.error('Bulk Generation Error:', err);
        addToast(err.response?.data?.detail?.error || 'Bulk generation failed', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal Single Schema Flow
    setLoading(true)
    try {
      await _processSingleSchema(schema);
      addToast('Infrastructure generated successfully!', 'success');
      await fetchSchemas();
      setTimeout(() => setActiveTab('test'), 800);
    } catch (err) {
      console.error('Generation Error:', err);
      // Error handling already in _processSingleSchema or addToast
      throw err;
    } finally {
      setLoading(false)
    }
  }

  // Helper to handle the actual API call for one schema
  const _processSingleSchema = async (schema) => {
    const cleanFields = Array.isArray(schema.fields) 
      ? schema.fields.map(({ id, ...rest }) => ({
          name: rest.name,
          field_type: rest.field_type || rest.type, // Handle both 'field_type' and 'type'
          required: !!rest.required,
          unique: !!rest.unique,
          indexed: !!rest.indexed,
          default: rest.default,
          description: rest.description,
          max_length: rest.max_length,
          min_value: rest.min_value,
          max_value: rest.max_value
        }))
      : []

    const payload = {
      name: schema.name,
      description: schema.description || `Auto-generated ${schema.name}`,
      fields: cleanFields,
      db_type: schema.db_type || 'postgresql',
      enable_auth: !!schema.enable_auth || !!schema.enableAuth,
      enable_soft_delete: !!schema.enable_soft_delete || !!schema.softDelete
    }

    const res = await axios.post(`/api/v1/schemas/from-schema${schema.overwrite ? '?overwrite=true' : ''}`, payload, { 
      headers: getAuthHeader(),
      timeout: 60000 
    })
    
    if (!res.data) throw new Error('No data received from server');
    return res.data;
  }

  const handleAiAction = async (action) => {
    if (action.type === 'switch_tab') {
      setActiveTab(action.tab);
      setIsAssistantOpen(false);
    } else if (action.type === 'generate_schema') {
      setActiveTab('build');
      addToast('Opening API Builder with your prompt...', 'info');
      setIsAssistantOpen(false);
    }
  };

  const executeDeleteSchema = async () => {
    if (!deleteModal.schemaId) return;
    setDeleteModal(prev => ({ ...prev, loading: true }))
    try {
      await axios.delete(`/api/v1/schemas/${deleteModal.schemaId}?hard_delete=true`, { 
        headers: getAuthHeader(),
        timeout: 30000 
      })
      addToast(`Schema "${deleteModal.schemaName}" deleted successfully`, 'success')
      setDeleteModal({ isOpen: false, schemaId: null, schemaName: '', loading: false })
      await fetchSchemas()
    } catch (err) {
      console.error('Deletion Error:', err);
      const errorMsg = err.response?.data?.detail;
      const displayError = typeof errorMsg === 'string' ? errorMsg : (errorMsg?.message || 'Failed to delete schema. The table might be locked or have dependencies.');
      addToast(displayError, 'error')
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-10 font-sans">
        <div className="fixed inset-0 z-0 opacity-20" 
             style={{ 
               backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', 
               backgroundSize: '24px 24px' 
             }}>
        </div>
        <div className="text-center space-y-8 relative z-10">
          <div className="w-24 h-24 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#00ffaa] mx-auto mb-4 shadow-2xl">
            <Lock size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-medium text-white uppercase tracking-tighter">System Access Locked</h2>
            <p className="text-slate-500 max-w-md mx-auto uppercase tracking-widest text-[10px] font-black">Authentication protocol required to access core engine.</p>
          </div>
          <button onClick={() => window.location.href = '/'} className="bg-[#00ffaa] text-black font-black py-4 px-10 rounded-md hover:scale-105 transition-all uppercase tracking-[0.3em] text-xs border border-[#00ffaa]/20">Initialize Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex pt-20 font-sans selection:bg-primary/30 relative overflow-hidden">
      {/* ── Global Dot Pattern Background ── */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none select-none" 
           style={{ 
             backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', 
             backgroundSize: '24px 24px' 
           }}>
      </div>

      {/* ── Sidebar ── */}
      {activeTab !== 'pricing' && (
        <aside className="w-72 border-r border-white/5 bg-transparent flex flex-col fixed left-0 top-20 bottom-0 z-20">
          <div className="p-8 space-y-10 flex-1">
            <div className="space-y-2">
              <p className="px-4 text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6">Core Engine</p>
              {[
                { id: 'build', icon: <Box size={20}/>, label: 'API Builder', desc: 'Design your schema' },
                { id: 'test', icon: <Terminal size={20}/>, label: 'API Tester', desc: 'Debug endpoints' },
                { id: 'schemas', icon: <Database size={20}/>, label: 'My Schemas', desc: 'Manage resources' },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full group flex flex-col items-start gap-1 p-4 rounded-md transition-all duration-300 ${activeTab === item.id ? 'bg-[#1a1a1a] text-primary border border-primary/50 shadow-[0_0_20px_rgba(0,255,170,0.1)]' : 'text-slate-400 hover:bg-[#1a1a1a] hover:text-white border border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                     <div className={`${activeTab === item.id ? 'text-primary' : 'text-slate-500 group-hover:text-white'}`}>
                        {item.icon}
                     </div>
                     <span className="text-sm font-medium tracking-tight">{item.label}</span>
                  </div>
                  <span className={`text-[10px] ml-8 font-normal ${activeTab === item.id ? 'text-primary/60' : 'text-slate-600'}`}>{item.desc}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="px-4 text-[11px] font-medium uppercase tracking-[0.25em] text-slate-500 mb-6">Operations</p>
              {[
                { id: 'monitor', icon: <Activity size={20}/>, label: 'Monitoring' },
                { id: 'settings', icon: <Settings size={20}/>, label: 'Settings' },
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-md text-sm font-medium transition-all duration-300 ${activeTab === item.id ? 'bg-[#1a1a1a] text-white border border-white/10' : 'text-slate-400 hover:bg-[#1a1a1a] hover:text-white border border-transparent'}`}
                >
                  <div className={`${activeTab === item.id ? 'text-primary' : 'text-slate-600'}`}>
                     {item.icon}
                  </div>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        <div className="p-8 border-t border-white/5 bg-black/20">
             <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-3 text-xs font-black text-slate-300 mb-3">
                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                   Engine Online
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2 }}
                      className="h-full bg-gradient-to-r from-primary/50 to-primary w-full" 
                   />
                </div>
             </div>
          </div>
        </aside>
      )}

      {/* ── Main Dashboard ── */}
      <main className={`flex-1 p-10 overflow-y-auto overflow-x-hidden relative z-10 transition-all duration-500 ${activeTab === 'pricing' ? 'ml-0' : 'ml-72'}`} style={{ touchAction: 'pan-y' }}>
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'build' && (
              <motion.div key="build" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#00ffaa] shadow-inner">
                         <Zap size={32} />
                      </div>
                      <div>
                        <h1 className="text-4xl font-medium tracking-tight text-white mb-1">API Builder</h1>
                        <p className="text-slate-500 font-medium text-sm">Design your data models and generate production-ready APIs instantly.</p>
                      </div>
                    </div>
                    {!isAssistantOpen && (
                      <motion.button 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setIsAssistantOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-bold transition-all uppercase tracking-widest"
                      >
                        <Sparkles size={16} />
                        AI Assistant
                      </motion.button>
                    )}
                </div>
                <VisualApiBuilder onGenerate={generateFromSchema} onAiGenerate={generateFromPrompt} loading={loading} onSchemaChange={() => {}} />
              </motion.div>
            )}

            {activeTab === 'test' && (
              <motion.div key="test" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#00ffaa] shadow-inner">
                     <Terminal size={32} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-medium tracking-tight text-white mb-1">API Tester</h1>
                    <p className="text-slate-500 font-medium text-sm">Validate your endpoints and test payload responses in real-time.</p>
                  </div>
                </div>
                {!isAssistantOpen && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setIsAssistantOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-bold transition-all uppercase tracking-widest"
                  >
                    <Sparkles size={16} />
                    AI Assistant
                  </motion.button>
                )}
              </div>
                <ApiTester schemas={schemas} initialTarget={testTarget} />
              </motion.div>
            )}

            {activeTab === 'monitor' && (
              <motion.div key="monitoring" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#00ffaa] shadow-inner">
                     <Activity size={32} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-medium tracking-tight text-white mb-1">System Monitoring</h1>
                    <p className="text-slate-500 font-medium text-sm">Real-time health metrics and infrastructure logs.</p>
                  </div>
                </div>
                <MonitoringDashboard />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#00ffaa] shadow-inner">
                     <Settings size={32} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-medium tracking-tight text-white mb-1">Control Panel</h1>
                    <p className="text-slate-500 font-medium text-sm">Configure your infrastructure and security protocols.</p>
                  </div>
                </div>
                <SettingsDashboard />
              </motion.div>
            )}

            {activeTab === 'schemas' && (
              <motion.div key="schemas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-[#00ffaa] shadow-inner">
                         <Database size={32} />
                      </div>
                      <div>
                        <h1 className="text-4xl font-medium tracking-tight text-white mb-1">My Schemas</h1>
                        <p className="text-slate-500 font-medium text-sm">Manage your deployed infrastructure and resources.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!isAssistantOpen && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => setIsAssistantOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-bold transition-all uppercase tracking-widest"
                        >
                          <Sparkles size={16} />
                          AI Assistant
                        </motion.button>
                      )}
                      <button onClick={() => setActiveTab('build')} className="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all text-slate-400 hover:text-[#00ffaa]">
                        <Plus size={18} /> New Schema
                      </button>
                    </div>
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.isArray(schemas) && schemas.map((s, i) => (
                    <div key={s.id} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-8 group hover:border-[#00ffaa]/30 transition-all relative overflow-hidden flex flex-col h-full shadow-xl">
                       <div className="flex justify-between items-start mb-8 relative z-10">
                          <div className="w-14 h-14 rounded-md bg-[#1a1a1a] flex items-center justify-center text-[#00ffaa] border border-[#333] shadow-inner"><Database size={28} /></div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">{s.db_type} Instance</span>
                       </div>
                       <h4 className="text-2xl font-medium text-white mb-3 tracking-tight relative z-10">{s.name}</h4>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest line-clamp-3 mb-8 flex-1 leading-relaxed relative z-10">{s.description || 'No system description.'}</p>
                       <div className="flex justify-end gap-3 pt-8 border-t border-[#1a1a1a] relative z-10 mt-auto">
                          <button onClick={() => setDeleteModal({ isOpen: true, schemaId: s.id, schemaName: s.name, loading: false })} className="p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                          <button onClick={() => {
                             axios.get(`/api/v1/schemas/${s.id}`, { headers: getAuthHeader() }).then(res => {
                               const endpoints = res.data?.generated_code?.endpoints || res.data?.endpoints;
                               if (endpoints?.length > 0) {
                                 const firstGet = endpoints.find(e => e.method === 'GET' && !e.path.includes('{')) || endpoints[0];
                                 setTestTarget({ schema: s, endpoint: firstGet });
                                 setActiveTab('test');
                               } else {
                                 addToast('No endpoints found for this schema.', 'info');
                               }
                             }).catch(err => {
                               console.error("Failed to load schema details:", err);
                               addToast('Failed to load schema details.', 'error');
                             })
                          }} className="p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-[#00ffaa] hover:bg-[#00ffaa] hover:text-black transition-all"><Play size={16} /></button>
                       </div>
                    </div>
                  ))}
                  {(!Array.isArray(schemas) || schemas.length === 0) && <div className="col-span-full h-80 border border-dashed border-[#1a1a1a] rounded-md flex flex-col items-center justify-center text-slate-700 bg-[#0a0a0a]"><Box size={48} className="mb-4 opacity-10" /><p className="font-black uppercase tracking-[0.4em] text-[10px]">No schemas initialized</p></div>}
                </div>
              </motion.div>
            )}

            {activeTab === 'pricing' && (
              <motion.div key="pricing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Pricing />
              </motion.div>
            )}

            {activeTab === 'docs' && (
              <motion.div key="docs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Docs />
              </motion.div>
            )}

            {/* Fallback for unknown tabs or crashes */}
            {!['build', 'test', 'monitor', 'settings', 'schemas', 'pricing', 'docs'].includes(activeTab) && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-[0.4em] text-[10px]">System State Unknown</p>
                <button onClick={() => setActiveTab('build')} className="mt-4 text-[#00ffaa] text-xs font-bold uppercase tracking-widest hover:underline">Return to Builder</button>
              </div>
            )}
          </AnimatePresence>
        </div>
        <SideAssistant 
          isOpen={isAssistantOpen} 
          onClose={() => setIsAssistantOpen(false)} 
          onAction={handleAiAction} 
          currentTab={activeTab} 
        />
      </main>

      <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))} onConfirm={executeDeleteSchema} title="Delete Schema?" message={`Are you sure you want to delete "${deleteModal.schemaName}"?`} confirmText="Yes, Delete" loading={deleteModal.loading} />

      <div className="fixed bottom-8 right-8 z-[100] space-y-4">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={`px-6 py-4 rounded-3xl shadow-2xl border flex items-center gap-3 min-w-[300px] backdrop-blur-xl ${t.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-400' : t.type === 'error' ? 'bg-red-950/80 border-red-500/20 text-red-400' : 'bg-slate-900/80 border-white/10 text-slate-300'}`}>
              {t.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : t.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              <span className="text-sm font-bold">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Generator
