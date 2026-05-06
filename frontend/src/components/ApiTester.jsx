import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Terminal, Clock, Shield, Database, 
  ChevronRight, Search, History, Copy, 
  CheckCircle2, AlertCircle, Loader2, Trash2,
  Code2, Globe, Lock, Box, Info
} from 'lucide-react';
import axios from 'axios';

const ApiTester = ({ schemas, initialTarget }) => {
  const [activeSchema, setActiveSchema] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [requestState, setRequestState] = useState({
    method: 'GET',
    url: '',
    headers: '{\n  "Content-Type": "application/json"\n}',
    body: '{\n  \n}',
    loading: false,
    response: null
  });
  const [history, setHistory] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('curl');

  // Generate Code Snippets
  const getCodeSnippet = (lang) => {
    if (!selectedEndpoint) return '';
    const token = localStorage.getItem('token') || 'YOUR_TOKEN';
    
    // Use the backend URL from environment or fallback to current origin
    // In production, this would be your API domain (e.g. api.yourplatform.com)
    // For local dev, we ensure it points to the backend port (8001)
    const baseUrl = window.location.origin.replace(':5173', ':8001'); 
    const fullUrl = `${baseUrl}${selectedEndpoint.path}`;
    const method = selectedEndpoint.method;
    
    // Determine sample body
    let bodyData = {};
    try {
      bodyData = JSON.parse(requestState.body);
    } catch(e) {}

    switch(lang) {
      case 'curl':
        let curl = `curl -X ${method} "${fullUrl}" \\\n  -H "Authorization: Bearer ${token}" \\\n  -H "Content-Type: application/json"`;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          curl += ` \\\n  -d '${JSON.stringify(bodyData, null, 2)}'`;
        }
        return curl;
      
      case 'javascript':
        return `const response = await fetch("${fullUrl}", {
  method: "${method}",
  headers: {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
  }${['POST', 'PUT', 'PATCH'].includes(method) ? `,\n  body: JSON.stringify(${JSON.stringify(bodyData, null, 4)})` : ''}
});
const data = await response.json();
console.log(data);`;

      case 'python':
        return `import requests

url = "${fullUrl}"
headers = {
    "Authorization": "Bearer ${token}",
    "Content-Type": "application/json"
}

response = requests.${method.toLowerCase()}(
    url, 
    headers=headers${['POST', 'PUT', 'PATCH'].includes(method) ? `,\n    json=${JSON.stringify(bodyData, null, 4)}` : ''}
)

print(response.json())`;
      default: return '';
    }
  };

  const copySnippet = (code) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  useEffect(() => {
    if (initialTarget) {
      setActiveSchema(initialTarget.schema);
      handleEndpointSelect(initialTarget.endpoint);
    } else if (Array.isArray(schemas) && schemas.length > 0 && !activeSchema) {
      // Auto-select first schema if available and no initial target
      handleSchemaSelect(schemas[0]);
    }
  }, [initialTarget, schemas]);

  const handleSchemaSelect = (schema) => {
    if (!schema) return;
    setActiveSchema(schema);
    // Support both direct endpoints (newly generated) and nested endpoints (from registry)
    const endpoints = schema.generated_code?.endpoints || schema.endpoints || [];
    if (endpoints.length > 0) {
      handleEndpointSelect(endpoints[0]);
    }
  };

  const handleEndpointSelect = (endpoint) => {
    if (!endpoint) return;
    setSelectedEndpoint(endpoint);
    
    // Generate smart sample body based on schema fields
    let sampleBody = {};
    if (activeSchema && activeSchema.schema_definition && activeSchema.schema_definition.fields) {
      activeSchema.schema_definition.fields.forEach(field => {
        if (field.name === 'id' || field.name === 'created_at' || field.name === 'updated_at') return;
        
        switch(field.field_type) {
          case 'integer':
          case 'float': sampleBody[field.name] = 0; break;
          case 'boolean': sampleBody[field.name] = false; break;
          case 'array': sampleBody[field.name] = []; break;
          case 'json': sampleBody[field.name] = {}; break;
          case 'datetime': sampleBody[field.name] = new Date().toISOString(); break;
          case 'email': sampleBody[field.name] = "user@example.com"; break;
          default: sampleBody[field.name] = `Sample ${field.name}`;
        }
      });
    }

    setRequestState(prev => ({
      ...prev,
      method: endpoint.method || 'GET',
      url: endpoint.path || '',
      response: null,
      body: ['POST', 'PUT', 'PATCH'].includes(endpoint.method) 
        ? JSON.stringify(sampleBody, null, 2) 
        : '{\n  \n}'
    }));
  };

  const sendRequest = async () => {
    setRequestState(prev => ({ ...prev, loading: true, response: null }));
    const startTime = Date.now();
    
    try {
      const token = localStorage.getItem('token');
      const parsedHeaders = JSON.parse(requestState.headers);
      if (token) parsedHeaders['Authorization'] = `Bearer ${token}`;

      const config = {
        method: requestState.method,
        url: requestState.url,
        headers: parsedHeaders,
        data: ['POST', 'PUT', 'PATCH'].includes(requestState.method) ? JSON.parse(requestState.body) : undefined
      };

      const res = await axios(config);
      const duration = Date.now() - startTime;
      
      const responseData = {
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        time: `${duration}ms`,
        size: `${(JSON.stringify(res.data).length / 1024).toFixed(2)} KB`
      };

      setRequestState(prev => ({ ...prev, loading: false, response: responseData }));
      
      // Add to history
      setHistory(prev => [{
        id: Date.now(),
        method: requestState.method,
        url: requestState.url,
        status: res.status,
        time: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));

    } catch (err) {
      const duration = Date.now() - startTime;
      setRequestState(prev => ({ 
        ...prev, 
        loading: false, 
        response: {
          status: err.response?.status || 500,
          statusText: err.response?.statusText || 'Error',
          data: err.response?.data || { detail: err.message },
          time: `${duration}ms`
        }
      }));
    }
  };

  const copyResponse = () => {
    if (requestState.response) {
      navigator.clipboard.writeText(JSON.stringify(requestState.response.data, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex gap-8 h-[calc(100vh-12rem)] relative z-10">
      
      {/* ── Left Panel: Endpoints ── */}
      <div className="w-80 flex flex-col gap-6 h-full">
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md flex flex-col h-full overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-[#1a1a1a] bg-white/[0.02]">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Database size={16} className="text-[#00ffaa]" />
              Your APIs
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input 
                placeholder="Search endpoints..." 
                className="w-full bg-black border border-[#1a1a1a] rounded-md pl-10 pr-4 py-2 text-xs text-slate-300 outline-none focus:border-[#00ffaa]/30 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {!Array.isArray(schemas) || schemas.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle size={32} className="text-slate-800 mb-4" />
                <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">No APIs Found</p>
                <p className="text-xs text-slate-500 mt-2 font-normal">Build a schema first to see endpoints here.</p>
              </div>
            ) : (
              schemas.map(schema => {
                if (!schema) return null;
                const endpoints = schema.generated_code?.endpoints || schema.endpoints || [];
                return (
                  <div key={schema.id || schema.schema_id || Math.random()} className="mb-4">
                    <div className="px-4 py-2 text-[10px] font-medium text-slate-500 uppercase tracking-[0.2em] flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#00ffaa]" />
                        {schema.name || 'Unnamed API'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {endpoints.map((ep, idx) => (
                        <button
                          key={`${schema.id || idx}-${idx}`}
                          onClick={() => {
                            setActiveSchema(schema);
                            handleEndpointSelect(ep);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-all group ${
                            selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method
                              ? 'bg-[#1a1a1a] border border-[#1a1a1a]' 
                              : 'hover:bg-white/[0.02] border border-transparent'
                          }`}
                        >
                          <span className={`text-[9px] font-medium w-10 uppercase text-center py-0.5 rounded ${
                            ep.method === 'GET' ? 'text-blue-400 bg-blue-400/10' :
                            ep.method === 'POST' ? 'text-emerald-400 bg-emerald-400/10' :
                            ep.method === 'DELETE' ? 'text-red-400 bg-red-400/10' : 'text-yellow-400 bg-yellow-400/10'
                          }`}>
                            {ep.method}
                          </span>
                          <span className={`text-[13px] font-normal truncate ${
                            selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                          }`}>
                            {ep.path ? ep.path.split('/').pop() : '/'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Integration Code Mini-Card */}
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-6 h-64 flex flex-col shadow-2xl overflow-hidden">
           <h4 className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Code2 size={12} className="text-[#00ffaa]" />
             Integrate Anywhere
           </h4>
           <div className="flex bg-black rounded p-1 mb-3">
             {['curl', 'javascript', 'python'].map(lang => (
               <button 
                key={lang}
                onClick={() => setActiveCodeTab(lang)}
                className={`flex-1 text-[9px] font-black uppercase tracking-tighter py-1 rounded transition-all ${activeCodeTab === lang ? 'bg-[#1a1a1a] text-[#00ffaa]' : 'text-slate-600 hover:text-slate-400'}`}
               >
                 {lang}
               </button>
             ))}
           </div>
           <div className="flex-1 bg-black/40 border border-white/5 rounded p-3 relative group overflow-hidden">
              <pre className="text-[10px] font-mono text-slate-400 whitespace-pre overflow-x-auto custom-scrollbar h-full">
                {selectedEndpoint ? getCodeSnippet(activeCodeTab) : '// Select an endpoint to see code'}
              </pre>
              {selectedEndpoint && (
                <button 
                  onClick={() => copySnippet(getCodeSnippet(activeCodeTab))}
                  className="absolute top-2 right-2 p-1.5 bg-[#1a1a1a] border border-[#333] rounded text-slate-500 hover:text-[#00ffaa] opacity-0 group-hover:opacity-100 transition-all"
                >
                  {isCopied ? <CheckCircle2 size={12} className="text-[#00ffaa]" /> : <Copy size={12} />}
                </button>
              )}
           </div>
        </div>
      </div>

      {/* ── Middle/Right: Console ── */}
      <div className="flex-1 flex flex-col gap-6 h-full">
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-md flex-1 overflow-hidden flex flex-col shadow-2xl">
          {/* URL Bar */}
          <div className="h-20 bg-white/[0.02] border-b border-[#1a1a1a] flex items-center px-8 gap-6">
            <div className="flex items-center gap-2 bg-black border border-[#1a1a1a] rounded-md px-4 py-2">
              <select 
                value={requestState.method}
                onChange={(e) => setRequestState(prev => ({ ...prev, method: e.target.value }))}
                className="bg-transparent text-sm font-medium text-[#00ffaa] outline-none cursor-pointer uppercase"
              >
                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m} className="bg-black">{m}</option>)}
              </select>
            </div>
            <div className="flex-1 flex items-center gap-3 bg-black border border-[#1a1a1a] rounded-md px-4 py-2 group focus-within:border-[#00ffaa]/30 transition-all">
               <Globe size={14} className="text-slate-700 group-focus-within:text-[#00ffaa] transition-colors" />
               <input 
                type="text" 
                value={requestState.url}
                onChange={(e) => setRequestState(prev => ({ ...prev, url: e.target.value }))}
                placeholder="/api/v1/..."
                className="flex-1 bg-transparent text-sm font-mono text-slate-300 outline-none placeholder:text-slate-800"
              />
            </div>
            <button 
              onClick={sendRequest}
              disabled={requestState.loading}
              className="bg-[#00ffaa] text-black font-medium py-3 px-10 rounded-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,170,0.2)]"
            >
              {requestState.loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Execute
            </button>
          </div>

          {/* Console Grid */}
          <div className="flex-1 grid grid-cols-2 gap-px bg-[#1a1a1a]">
            {/* Request Config */}
            <div className="bg-[#0a0a0a] flex flex-col">
              <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-600 flex items-center gap-2">
                      <Terminal size={12} />
                      Request Payload
                    </h5>
                    <button onClick={() => setRequestState(prev => ({ ...prev, body: '{\n  \n}' }))} className="text-[10px] font-medium text-slate-700 hover:text-red-400 transition-colors flex items-center gap-1">
                       <Trash2 size={10} /> Clear
                    </button>
                  </div>
                  
                  {/* Field Reference Quick View */}
                  {activeSchema && ['POST', 'PUT', 'PATCH'].includes(requestState.method) && (
                    <div className="flex flex-wrap gap-2 mb-2 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mr-2 flex items-center gap-1">
                         <Info size={10} /> Schema:
                       </span>
                       {(activeSchema.schema_definition?.fields || []).map(f => (
                         <div key={f.name} className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 border border-white/5 rounded text-[9px]">
                            <span className="text-slate-300 font-mono">{f.name}</span>
                            <span className="text-slate-600 font-bold uppercase">{f.field_type}</span>
                            {f.required && <span className="text-amber-500/50">*</span>}
                         </div>
                       ))}
                    </div>
                  )}

                  <textarea 
                    value={requestState.body}
                    onChange={(e) => setRequestState(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="{ ... }"
                    className="w-full h-48 bg-black border border-[#1a1a1a] rounded-md p-6 text-xs font-mono text-slate-300 outline-none resize-none focus:border-[#00ffaa]/20 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-4">
                  <h5 className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-600 flex items-center gap-2">
                    <Shield size={12} />
                    Headers
                  </h5>
                  <textarea 
                    value={requestState.headers}
                    onChange={(e) => setRequestState(prev => ({ ...prev, headers: e.target.value }))}
                    placeholder='{ "X-API-Key": "..." }'
                    className="w-full h-40 bg-black border border-[#1a1a1a] rounded-md p-6 text-xs font-mono text-slate-300 outline-none resize-none focus:border-[#00ffaa]/20 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Response Viewer */}
            <div className="bg-[#0a0a0a] flex flex-col relative">
              <div className="flex justify-between items-center p-8 border-b border-[#1a1a1a] h-16">
                <h5 className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-600">Response</h5>
                {requestState.response && (
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${requestState.response.status < 300 ? 'bg-[#00ffaa] shadow-[0_0_10px_rgba(0,255,170,0.5)]' : 'bg-red-500'}`} />
                       <span className={`text-xs font-medium ${requestState.response.status < 300 ? 'text-[#00ffaa]' : 'text-red-400'}`}>
                          {requestState.response.status} {requestState.response.statusText}
                       </span>
                    </div>
                    <div className="w-px h-3 bg-[#1a1a1a]" />
                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">{requestState.response.time}</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 p-8 overflow-auto font-mono text-xs leading-relaxed relative custom-scrollbar bg-black/40">
                {requestState.response ? (
                  <>
                    <button 
                      onClick={copyResponse}
                      className="absolute top-6 right-6 p-2 bg-[#1a1a1a] border border-[#333] rounded-md text-slate-500 hover:text-[#00ffaa] transition-all z-20 group"
                    >
                      {isCopied ? <CheckCircle2 size={14} className="text-[#00ffaa]" /> : <Copy size={14} />}
                      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black border border-[#1a1a1a] px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Copy JSON</span>
                    </button>
                    <pre className="text-slate-300 whitespace-pre-wrap">{JSON.stringify(requestState.response.data, null, 2)}</pre>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-30 select-none">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center mb-6 animate-[spin_20s_linear_infinite]">
                       <Terminal size={40} />
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.4em]">Awaiting Request</p>
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className="h-10 bg-white/[0.01] border-t border-[#1a1a1a] px-8 flex items-center justify-between text-[9px] font-medium text-slate-600 uppercase tracking-widest">
                 <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Box size={10}/> Size: {requestState.response?.size || '0 KB'}</span>
                    <span className="flex items-center gap-1.5"><Lock size={10}/> Auth: {localStorage.getItem('token') ? 'Active' : 'Guest'}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                    v1.0.0 Stable
                 </div>
              </div>
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

export default ApiTester;
