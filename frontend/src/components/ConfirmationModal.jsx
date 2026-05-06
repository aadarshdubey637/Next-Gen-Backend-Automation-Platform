import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Trash2, X } from 'lucide-react'

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", loading = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? null : onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#0a0f1d] border border-white/10 rounded-[32px] p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              disabled={loading}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors disabled:opacity-0"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                <Trash2 size={32} />
              </div>

              <h3 className="text-2xl font-black mb-2">{title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-4 w-full">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </div>
                  ) : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmationModal
