import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle } from 'lucide-react';

const FieldEditor = ({ field, isOpen, onClose, onSave }) => {
  const [editedField, setEditedField] = React.useState(field);

  React.useEffect(() => {
    setEditedField(field);
  }, [field]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setEditedField(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md bg-[#0d1117] border-l border-white/10 h-full shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div>
              <h3 className="text-xl font-bold text-white">Field Settings</h3>
              <p className="text-xs text-slate-500 font-medium">Configure advanced validation and defaults</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="space-y-4">
               <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">Description</span>
                  <textarea
                    value={editedField?.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe what this field is for..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-700 outline-none focus:border-primary/50 transition-all h-24 resize-none"
                  />
               </label>

               <div className="grid grid-cols-2 gap-4">
                  <div className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">Default Value</span>
                    {editedField?.field_type === 'boolean' ? (
                      <select
                        value={editedField?.default === true ? 'true' : editedField?.default === false ? 'false' : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleChange('default', val === 'true' ? true : val === 'false' ? false : null);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-primary/50 transition-all cursor-pointer"
                      >
                        <option value="" className="bg-[#0d1117]">No Default</option>
                        <option value="true" className="bg-[#0d1117]">True</option>
                        <option value="false" className="bg-[#0d1117]">False</option>
                      </select>
                    ) : (
                      <input
                        type={editedField?.field_type === 'integer' || editedField?.field_type === 'float' ? 'number' : 'text'}
                        value={editedField?.default === null || editedField?.default === undefined ? '' : editedField.default}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (editedField.field_type === 'integer' || editedField.field_type === 'float') {
                            handleChange('default', val === '' ? null : Number(val));
                          } else {
                            handleChange('default', val === '' ? null : val);
                          }
                        }}
                        placeholder={editedField?.field_type === 'integer' || editedField?.field_type === 'float' ? 'e.g. 0' : "e.g. 'active'"}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 outline-none focus:border-primary/50 transition-all"
                      />
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-end pb-1">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div 
                          onClick={() => handleChange('unique', !editedField?.unique)}
                          className={`
                            w-5 h-5 rounded-lg border transition-all flex items-center justify-center
                            ${editedField?.unique ? 'bg-primary border-primary' : 'border-white/20 bg-transparent group-hover:border-white/40'}
                          `}
                        >
                          {editedField?.unique && <Save size={12} className="text-deep font-bold" />}
                        </div>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200">Unique Constraint</span>
                     </label>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/80">Validation Rules</h4>
               
               <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">Max Length / Value</span>
                    <input
                      type="number"
                      value={editedField?.max_length || editedField?.max_value || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value);
                        if (editedField.field_type === 'string' || editedField.field_type === 'text') {
                           handleChange('max_length', val);
                        } else {
                           handleChange('max_value', val);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-primary/50 transition-all"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block">Min Value</span>
                    <input
                      type="number"
                      value={editedField?.min_value || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value);
                        handleChange('min_value', val);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-primary/50 transition-all"
                    />
                  </label>
               </div>
            </div>

            {editedField?.field_type === 'array' && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex gap-3">
                 <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                 <p className="text-xs text-blue-400/80 leading-relaxed font-medium">
                   Array fields can contain lists of strings or primitive types. Nested object arrays are coming soon.
                 </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-white/5 flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onSave(editedField);
                onClose();
              }}
              className="flex-1 bg-primary text-deep px-6 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FieldEditor;
