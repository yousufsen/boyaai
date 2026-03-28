'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  duration?: number;
  variant?: 'success' | 'info' | 'error';
}

const VARIANTS = {
  success: 'bg-green-500 text-white',
  info: 'bg-purple-500 text-white',
  error: 'bg-red-500 text-white',
};

export function Toast({ message, show, onClose, duration = 2500, variant = 'success' }: ToastProps) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [show, onClose, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-4 left-1/2 z-[300] pointer-events-none"
          initial={{ x: '-50%', y: -80, opacity: 0 }}
          animate={{ x: '-50%', y: 0, opacity: 1 }}
          exit={{ x: '-50%', y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className={`px-6 py-3 rounded-2xl font-bold text-sm shadow-xl ${VARIANTS[variant]}`}>
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
