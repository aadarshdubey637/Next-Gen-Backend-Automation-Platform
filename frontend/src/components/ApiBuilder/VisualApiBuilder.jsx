import React, { useState, useEffect } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Code2, 
  Eye, 
  Settings, 
  Database, 
  Shield, 
  Box,
  Trash2,
  Copy,
  CheckCircle2,
  Sparkles,
  Brain,
  Loader2,
  Search,
  Globe,
  Terminal,
  Activity,
  Zap
} from 'lucide-react';
import FieldCard from './FieldCard';
import FieldEditor from './FieldEditor';

const VisualApiBuilder = ({ initialSchema, onSchemaChange, onGenerate, onAiGenerate, loading }) => {
  const [schema, setSchema] = useState(initialSchema || {
    name: '',
    description: '',
    fields: [],
    db_type: 'postgresql',
    enable_auth: true,
    enable_soft_delete: false,
    overwrite: true
  });

  const [viewMode, setViewMode] = useState('visual'); // visual, json
  const [previewTab, setPreviewTab] = useState('structure'); // structure, endpoints, code
  const [editingField, setEditingField] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeployOverlay, setShowDeployOverlay] = useState(false);
  const [deployStep, setDeployStep] = useState(0);

  const deploySteps = [
    'Parsing schema structure...',
    'Generating database models...',
    'Building FastAPI routers...',
    'Injecting authentication middleware...',
    'Finalizing infrastructure...',
    'Deployment complete!'
  ];

  const handleGenerate = async (schema) => {
    setShowDeployOverlay(true);
    setDeployStep(0);

    // Advance through steps to show progress
    const stepInterval = setInterval(() => {
      setDeployStep(prev => {
        if (prev < deploySteps.length - 2) return prev + 1;
        return prev;
      });
    }, 800);

    try {
      if (Array.isArray(schema)) {
        await onGenerate(schema);
      } else {
        if (!schema.name || schema.name.trim() === '') {
          alert('Please enter a Resource Name before generating.');
          clearInterval(stepInterval);
          setShowDeployOverlay(false);
          return;
        }
        
        if (!schema.fields || schema.fields.length === 0) {
          alert('Please add at least one field to your schema.');
          clearInterval(stepInterval);
          setShowDeployOverlay(false);
          return;
        }

        // Check for empty field names which cause 422 errors
        const emptyFields = schema.fields.filter(f => !f.name || f.name.trim() === '');
        if (emptyFields.length > 0) {
          alert('One or more fields are missing a name. Please fill in all attribute names.');
          clearInterval(stepInterval);
          setShowDeployOverlay(false);
          return;
        }

        await onGenerate(schema);
      }
      
      setDeployStep(deploySteps.length - 1);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      clearInterval(stepInterval);
      setShowDeployOverlay(false);
      setDeployStep(0);
    }
  };

  useEffect(() => {
    if (onSchemaChange) {
      onSchemaChange(schema);
    }
  }, [schema]);

  const filteredFields = Array.isArray(schema.fields) 
    ? schema.fields.filter(f => 
        (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.field_type || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const addField = () => {
    const newField = {
      id: Math.random().toString(36).substr(2, 9),
      name: `field_${schema.fields.length + 1}`,
      field_type: 'string',
      required: false
    };
    setSchema(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const deleteField = (id) => {
    setSchema(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
  };

  const updateField = (updatedField) => {
    setSchema(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === updatedField.id ? updatedField : f)
    }));
  };

  const handleReorder = (newFields) => {
    setSchema(prev => ({ ...prev, fields: newFields }));
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const clearSchema = () => {
    if (window.confirm('Clear all fields and reset schema?')) {
      setSchema({
        name: '',
        description: '',
        fields: [],
        db_type: 'postgresql',
        enable_auth: true,
        enable_soft_delete: false
      });
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    try {
      const generatedSchema = await onAiGenerate(aiPrompt);
      if (generatedSchema && Array.isArray(generatedSchema.fields)) {
        // Add local IDs to the generated fields
        const fieldsWithIds = generatedSchema.fields.map(f => ({
          ...f,
          id: Math.random().toString(36).substr(2, 9)
        }));
        setSchema({
          ...generatedSchema,
          fields: fieldsWithIds
        });
        setIsAiMode(false);
        setAiPrompt('');
      } else if (generatedSchema) {
         // Handle case where fields might be missing
         setSchema({
           ...generatedSchema,
           fields: []
         });
         setIsAiMode(false);
         setAiPrompt('');
      }
    } catch (err) {
      console.error("AI Generation failed in Builder:", err);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-8 h-full">
      {/* Left Side: Builder */}
      <div className="col-span-7 flex flex-col gap-6">
        <div className="flex items-center justify-between">
           <div className="flex gap-1 bg-[#0f0f0f] p-1 rounded-md border border-[#1a1a1a]">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('visual')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 relative z-10 ${viewMode === 'visual' ? 'bg-[#00ffaa] text-black shadow-[0_0_15px_rgba(0,255,170,0.4)]' : 'text-slate-500 hover:text-white'}`}
              >
                <Box size={14} />
                Visual Designer
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setViewMode('json')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 relative z-10 ${viewMode === 'json' ? 'bg-[#00ffaa] text-black shadow-[0_0_15px_rgba(0,255,170,0.4)]' : 'text-slate-500 hover:text-white'}`}
              >
                <Code2 size={14} />
                Raw JSON
              </motion.button>
           </div>

           <div className="flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAiMode(!isAiMode)}
                className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${isAiMode ? 'bg-[#00ffaa] text-black shadow-[0_0_15px_rgba(0,255,170,0.3)]' : 'bg-[#1a1a1a] text-slate-400 hover:text-white border border-[#333]'}`}
              >
                <Brain size={14} />
                AI Generate
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: '#222' }}
                whileTap={{ scale: 0.95 }}
                onClick={addField}
                className="bg-[#1a1a1a] border border-[#333] text-white px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <Plus size={14} />
                Add Field
              </motion.button>
           </div>
        </div>

        <AnimatePresence>
          {isAiMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-sm font-black text-[#00ffaa] flex items-center gap-2 uppercase tracking-widest">
                     <Sparkles size={16} />
                     AI Builder Assistant
                   </h4>
                   <button onClick={() => setIsAiMode(false)} className="text-slate-500 hover:text-white">
                      <Trash2 size={14} />
                   </button>
                </div>
                <div className="relative">
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe your backend requirement in detail... (e.g. A marketplace with vendors and products)"
                    className="w-full bg-black border border-[#1a1a1a] rounded-md p-4 text-sm text-slate-200 placeholder:text-slate-700 outline-none focus:border-[#00ffaa]/50 transition-all h-24 resize-none"
                  />
                  <button 
                    onClick={handleAiGenerate}
                    disabled={loading || !aiPrompt}
                    className="absolute bottom-4 right-4 bg-[#00ffaa] text-black px-4 py-2 rounded-md text-xs font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Generate
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === 'visual' ? (
          <div className="space-y-6">
             {/* Resource Name Header */}
             <motion.div 
                whileHover={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                transition={{ duration: 0.3 }}
                className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-8 mb-8 transition-all"
             >
                <div className="flex items-center gap-6 mb-8">
                   <div className="w-16 h-16 rounded-md bg-[#1a1a1a] flex items-center justify-center text-[#00ffaa] border border-[#333]">
                      <Database size={32} />
                   </div>
                   <div className="flex-1 space-y-1">
                      <input 
                        value={schema.name}
                        onChange={(e) => setSchema(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-transparent border-none outline-none text-3xl font-black text-white w-full placeholder:text-slate-700"
                        placeholder="Resource Name (e.g. User)"
                      />
                      <input 
                        value={schema.description}
                        onChange={(e) => setSchema(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-transparent border-none outline-none text-sm font-medium text-slate-500 w-full placeholder:text-slate-800"
                        placeholder="Add a brief description..."
                      />
                   </div>
                </div>

                <div className="flex flex-wrap gap-8 pt-6 border-t border-[#1a1a1a]">
                   <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Storage Engine</span>
                        <select 
                          value={schema.db_type}
                          onChange={(e) => setSchema(prev => ({ ...prev, db_type: e.target.value }))}
                          className="bg-[#1a1a1a] border border-[#333] text-xs font-bold text-slate-300 px-3 py-1.5 rounded-md outline-none cursor-pointer hover:border-blue-500/50 transition-all"
                        >
                          <option value="postgresql">PostgreSQL</option>
                          <option value="mongodb">MongoDB</option>
                          <option value="mysql">MySQL</option>
                          <option value="sqlite">SQLite</option>
                        </select>
                      </div>
                   </div>

                   <div className="flex items-center gap-6 border-l border-[#1a1a1a] pl-8">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Security</span>
                        <div className="flex items-center gap-3">
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSchema(prev => ({ ...prev, enable_auth: !prev.enable_auth }))}
                            className={`w-10 h-5 rounded-full p-1 transition-all duration-300 relative ${schema.enable_auth ? 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-[#1a1a1a] border border-[#333]'}`}
                          >
                            <motion.div 
                              animate={{ x: schema.enable_auth ? 20 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className={`w-3 h-3 rounded-full shadow-sm ${schema.enable_auth ? 'bg-white' : 'bg-slate-600'}`} 
                            />
                          </motion.button>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${schema.enable_auth ? 'text-blue-400' : 'text-slate-600'}`}>JWT Auth</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Data Management</span>
                        <div className="flex items-center gap-3">
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setSchema(prev => ({ ...prev, enable_soft_delete: !prev.enable_soft_delete }))}
                            className={`w-10 h-5 rounded-full p-1 transition-all duration-300 relative ${schema.enable_soft_delete ? 'bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-[#1a1a1a] border border-[#333]'}`}
                          >
                            <motion.div 
                              animate={{ x: schema.enable_soft_delete ? 20 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className={`w-3 h-3 rounded-full shadow-sm ${schema.enable_soft_delete ? 'bg-white' : 'bg-slate-600'}`} 
                            />
                          </motion.button>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${schema.enable_soft_delete ? 'text-purple-400' : 'text-slate-600'}`}>Soft Delete</span>
                        </div>
                      </div>
                   </div>

                   <div className="flex flex-col gap-2 border-l border-[#1a1a1a] pl-8">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Danger Zone</span>
                      <div className="flex items-center gap-3">
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSchema(prev => ({ ...prev, overwrite: !prev.overwrite }))}
                          className={`w-10 h-5 rounded-full p-1 transition-all duration-300 relative ${schema.overwrite ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-[#1a1a1a] border border-[#333]'}`}
                          title="Toggle to overwrite existing database tables on generation"
                        >
                          <motion.div 
                            animate={{ x: schema.overwrite ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className={`w-3 h-3 rounded-full shadow-sm ${schema.overwrite ? 'bg-white' : 'bg-slate-600'}`} 
                          />
                        </motion.button>
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${schema.overwrite ? 'text-red-400' : 'text-slate-600'}`}>Overwrite Tables</span>
                          {schema.overwrite && <span className="text-[8px] text-red-500/60 font-black uppercase tracking-tighter leading-none">Warning: Data Loss</span>}
                        </div>
                      </div>
                   </div>
                </div>
             </motion.div>

             {/* Fields List */}
             <div className="space-y-4">
                <div className="flex items-center justify-between px-4 mb-2">
                   <div className="flex items-center gap-4">
                      <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">Data Structure</h5>
                      <span className="text-[10px] font-bold text-slate-400">{schema.fields.length} Fields</span>
                   </div>
                   <div className="relative">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text"
                        placeholder="Search attributes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-slate-300 focus:border-primary/50 outline-none w-48 transition-all"
                      />
                   </div>
                </div>
                <Reorder.Group axis="y" values={schema.fields} onReorder={handleReorder} className="space-y-4">
                   {filteredFields.map((field) => (
                      <Reorder.Item key={field.id} value={field}>
                        <FieldCard 
                          field={field}
                          onDelete={deleteField}
                          onEdit={setEditingField}
                          onUpdate={updateField}
                        />
                      </Reorder.Item>
                   ))}
                </Reorder.Group>
                
                <motion.button
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(0, 255, 170, 0.02)', borderColor: 'rgba(0, 255, 170, 0.1)' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={addField}
                  className="w-full py-8 border border-dashed border-[#1a1a1a] rounded-md flex flex-col items-center gap-3 text-slate-500 transition-all group"
                >
                  <div className="w-12 h-12 rounded-md bg-[#1a1a1a] flex items-center justify-center group-hover:bg-[#00ffaa] group-hover:text-black transition-all duration-500 shadow-xl border border-[#333]">
                     <Plus size={24} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-slate-300 group-hover:text-[#00ffaa] transition-colors">Append New Attribute</span>
                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-widest mt-1">Click or drag to add</span>
                  </div>
                </motion.button>
             </div>
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-8 h-[600px] relative">
             <textarea 
               value={JSON.stringify(schema, null, 2)}
               onChange={(e) => {
                 try {
                   const parsed = JSON.parse(e.target.value);
                   setSchema(parsed);
                 } catch (err) {
                   // Ignore invalid JSON while typing
                 }
               }}
               className="w-full h-full bg-transparent font-mono text-sm text-[#00ffaa] outline-none resize-none leading-relaxed"
             />
             <div className="absolute top-6 right-6 flex gap-2">
                <button 
                  onClick={clearSchema}
                  className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-md text-red-400 transition-all"
                  title="Clear Schema"
                >
                   <Trash2 size={18} />
                </button>
                <button 
                  onClick={copyJson}
                  className="p-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-md text-slate-400 hover:text-white transition-all"
                  title="Copy JSON"
                >
                   {isCopied ? <CheckCircle2 size={18} className="text-[#00ffaa]" /> : <Copy size={18} />}
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Right Side: Preview */}
      <div className="col-span-5">
        <div className="sticky top-8 space-y-6">
           <motion.div 
              whileHover={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
              transition={{ duration: 0.3 }}
              className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-8 space-y-6 overflow-hidden relative shadow-2xl transition-all"
           >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00ffaa]/5 blur-[80px]" />
              
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-bold flex items-center gap-3">
                   <Eye className="text-[#00ffaa]" />
                   Schema Preview
                 </h3>
                 <span className="px-2 py-1 bg-[#00ffaa]/10 text-[#00ffaa] text-[10px] font-black rounded-md uppercase tracking-widest border border-[#00ffaa]/20">Live</span>
              </div>

              {/* Preview Tabs */}
              <div className="flex gap-1 bg-black p-1 rounded-md border border-[#1a1a1a]">
                 {[
                   { id: 'structure', label: 'Structure', icon: <Box size={12} /> },
                   { id: 'endpoints', label: 'Endpoints', icon: <Globe size={12} /> },
                   { id: 'code', label: 'Code', icon: <Code2 size={12} /> },
                 ].map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => setPreviewTab(tab.id)}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${previewTab === tab.id ? 'bg-[#00ffaa] text-black' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     {tab.icon}
                     {tab.label}
                   </button>
                 ))}
              </div>

              <div className="space-y-4 min-h-[300px]">
                 {previewTab === 'structure' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                       <div className="p-4 bg-black border border-[#1a1a1a] rounded-md">
                          <div className="flex justify-between items-center mb-4">
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Structure</span>
                             <span className="text-[10px] font-bold text-slate-400">{Array.isArray(schema.fields) ? schema.fields.length : 0} Fields</span>
                          </div>
                          <div className="space-y-2">
                             {Array.isArray(schema.fields) && schema.fields.map((f, i) => (
                                <div key={i} className="flex items-center justify-between text-xs py-1">
                                   <span className="font-mono text-slate-300">{f.name || 'untitled'}</span>
                                   <span className="text-slate-600 font-bold uppercase text-[9px] bg-[#1a1a1a] px-2 py-0.5 rounded-full border border-[#333]">{f.field_type}</span>
                                </div>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-4 pt-4">
                          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Capabilities</h4>
                          <div className="grid grid-cols-2 gap-3">
                             <div className="p-3 bg-[#1a1a1a] rounded-md border border-[#333]">
                                <Shield size={14} className="text-[#00ffaa] mb-2" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JWT Auth</p>
                             </div>
                             <div className="p-3 bg-[#1a1a1a] rounded-md border border-[#333]">
                                <Settings size={14} className="text-[#00ffaa] mb-2" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CRUD API</p>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {previewTab === 'endpoints' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                       {[
                         { method: 'GET', path: `/${schema.name.toLowerCase() || 'resource'}`, desc: 'List all records' },
                         { method: 'POST', path: `/${schema.name.toLowerCase() || 'resource'}`, desc: 'Create new record' },
                         { method: 'GET', path: `/${schema.name.toLowerCase() || 'resource'}/{id}`, desc: 'Get single record' },
                         { method: 'PUT', path: `/${schema.name.toLowerCase() || 'resource'}/{id}`, desc: 'Update record' },
                         { method: 'DELETE', path: `/${schema.name.toLowerCase() || 'resource'}/{id}`, desc: 'Delete record' },
                       ].map((ep, i) => (
                          <div key={i} className="p-3 bg-black rounded-md border border-[#1a1a1a] flex items-center justify-between group hover:border-[#00ffaa]/20 transition-all">
                             <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${ep.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : ep.method === 'POST' ? 'bg-green-500/10 text-green-400' : ep.method === 'DELETE' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                   {ep.method}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">{ep.path}</span>
                             </div>
                             <span className="text-[9px] font-medium text-slate-600 group-hover:text-slate-400 transition-colors uppercase tracking-widest">{ep.desc}</span>
                          </div>
                       ))}
                    </motion.div>
                 )}

                 {previewTab === 'code' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                       <div className="bg-black rounded-md border border-[#1a1a1a] p-4 h-[350px] overflow-hidden font-mono text-[10px] relative shadow-inner">
                          <div className="absolute top-4 right-4 text-slate-600 uppercase tracking-widest text-[8px] font-black">Python / FastAPI</div>
                          <pre className="text-[#00ffaa]/80 leading-relaxed overflow-y-auto h-full scrollbar-hide">
{`from pydantic import BaseModel
from typing import Optional, List
import datetime

class ${schema.name || 'Resource'}(BaseModel):
${Array.isArray(schema.fields) ? schema.fields.map(f => `    ${f.name || 'field'}: ${f.field_type === 'integer' ? 'int' : f.field_type === 'float' ? 'float' : f.field_type === 'boolean' ? 'bool' : 'str'}${f.required ? '' : ' = None'}`).join('\n') : ''}
    created_at: datetime.datetime
    updated_at: datetime.datetime

# CRUD Endpoints generated automatically
# DB: ${schema.db_type}
# Auth: ${schema.enable_auth ? 'Enabled' : 'Disabled'}
`}
                          </pre>
                       </div>
                    </motion.div>
                 )}
              </div>

              <button 
                onClick={() => handleGenerate(schema)}
                className="w-full bg-[#00ffaa] text-black font-black py-5 rounded-md flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-98 shadow-2xl shadow-[#00ffaa]/20 transition-all mt-4 relative overflow-hidden group border border-[#00ffaa]/20"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <Sparkles size={20} className="relative z-10" />
                <span className="relative z-10 uppercase tracking-[0.2em]">Generate Infrastructure</span>
              </button>
           </motion.div>

           <div className="bg-blue-500/5 border border-blue-500/10 rounded-md p-6">
              <p className="text-[10px] text-blue-400/70 font-black uppercase tracking-widest leading-relaxed">
                Pro tip: You can drag and drop fields to reorder them in the final database schema and API documentation.
              </p>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeployOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full space-y-8 text-center">
              <div className="relative mx-auto w-24 h-24">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Zap size={32} className="text-primary animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight">Deploying Engine</h3>
                <p className="text-slate-500 text-sm font-medium">Please wait while we provision your infrastructure.</p>
              </div>

              <div className="space-y-4">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${((deployStep + 1) / deploySteps.length) * 100}%` }}
                     className="h-full bg-primary shadow-[0_0_15px_rgba(0,255,170,0.5)]"
                   />
                </div>
                <div className="flex flex-col gap-2">
                   <AnimatePresence mode="wait">
                     <motion.p 
                       key={deployStep}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                       className="text-[10px] font-black uppercase tracking-[0.2em] text-primary"
                     >
                       {deploySteps[deployStep]}
                     </motion.p>
                   </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FieldEditor 
        field={editingField}
        isOpen={!!editingField}
        onClose={() => setEditingField(null)}
        onSave={updateField}
      />
    </div>
  );
};

export default VisualApiBuilder;
