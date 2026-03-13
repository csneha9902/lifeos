import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: 20, x: '-50%' }}
    className="fixed bottom-10 left-1/2 z-50 px-6 py-3 rounded-2xl glass-panel shadow-3d-lg border-primary/30 flex items-center gap-3 min-w-[300px]"
  >
    <div className={`size-2 rounded-full ${type === 'success' ? 'bg-emerald-500' : 'bg-primary'} animate-pulse`} />
    <p className="text-sm font-bold text-white flex-1">{message}</p>
    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
      <X className="size-4" />
    </button>
  </motion.div>
);
