import React from 'react';
import { motion } from 'framer-motion';
import { 
  GripVertical, 
  Trash2, 
  Settings2, 
  Type, 
  Hash, 
  ToggleLeft, 
  Calendar, 
  Mail, 
  Fingerprint, 
  Code, 
  List,
  Check
} from 'lucide-react';

const typeIcons = {
  string: <Type size={16} />,
  integer: <Hash size={16} />,
  float: <Hash size={16} />,
  boolean: <ToggleLeft size={16} />,
  datetime: <Calendar size={16} />,
  text: <Type size={16} />,
  email: <Mail size={16} />,
  uuid: <Fingerprint size={16} />,
  json: <Code size={16} />,
  array: <List size={16} />,
};

const FieldCard = ({ 
  field, 
  onDelete, 
  onEdit, 
  onUpdate,
  isDragging 
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className={`
        group relative flex items-center gap-4 p-5 
        bg-[#0f0f0f] border border-[#1a1a1a] rounded-md
        hover:border-[#00ffaa]/40 hover:bg-[#161616] transition-all duration-300
        ${isDragging ? 'shadow-2xl border-[#00ffaa] bg-[#161616] z-50' : 'shadow-lg'}
      `}
    >
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-[#00ffaa] transition-colors p-2 bg-[#1a1a1a] rounded-md">
        <GripVertical size={18} />
      </div>

      {/* Field Info */}
      <div className="flex-1 grid grid-cols-12 gap-6 items-center">
        <div className="col-span-4">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#00ffaa]" />
                <span className="text-[9px] font-medium text-slate-600 uppercase tracking-widest">Attribute Name</span>
             </div>
             <input
               type="text"
               value={field.name}
               onChange={(e) => onUpdate({ ...field, name: e.target.value })}
               placeholder="e.g. email_address"
               className="w-full bg-black/40 border border-[#1a1a1a] focus:border-[#00ffaa]/30 rounded-md px-4 py-2.5 text-sm font-medium text-slate-200 placeholder:text-slate-800 outline-none transition-all"
             />
          </div>
        </div>

        <div className="col-span-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#00ffaa]" />
                <span className="text-[9px] font-medium text-slate-600 uppercase tracking-widest">Data Type</span>
            </div>
            <div className="relative group/select">
              <select
                value={field.field_type}
                onChange={(e) => onUpdate({ ...field, field_type: e.target.value })}
                className="appearance-none w-full bg-black/40 border border-[#1a1a1a] focus:border-[#00ffaa]/30 rounded-md px-4 py-2.5 text-xs font-medium text-[#00ffaa] outline-none cursor-pointer hover:bg-black/60 transition-all uppercase tracking-tight"
              >
                {Object.keys(typeIcons).map(type => (
                  <option key={type} value={type} className="bg-[#0f0f0f]">{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="col-span-3 flex items-center gap-4 pt-4">
          <button 
            onClick={() => onUpdate({ ...field, required: !field.required })}
            className="flex items-center gap-2 group/label"
          >
            <div 
              className={`
                w-4 h-4 rounded border transition-all flex items-center justify-center
                ${field.required ? 'bg-primary border-primary' : 'border-white/20 bg-transparent'}
              `}
            >
              {field.required && <Check size={12} className="text-deep font-bold" />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/label:text-slate-300 transition-colors">Required</span>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(field)}
          className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          title="Settings"
        >
          <Settings2 size={18} />
        </button>
        <button
          onClick={() => onDelete(field.id)}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default FieldCard;
