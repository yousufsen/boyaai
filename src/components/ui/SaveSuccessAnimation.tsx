'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface SaveSuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

const PARTICLES = ['⭐', '🌟', '✨', '🎉', '🎊', '💫', '🌈', '🎨'];

export function SaveSuccessAnimation({ show, onComplete }: SaveSuccessAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            setTimeout(() => onComplete?.(), 1500);
          }}
        >
          {/* Particles */}
          {PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              className="absolute text-4xl"
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                rotate: Math.random() * 720 - 360,
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.08,
                ease: 'easeOut',
              }}
            >
              {p}
            </motion.span>
          ))}

          {/* Center message */}
          <motion.div
            className="bg-white/95 backdrop-blur-md rounded-3xl px-10 py-8 shadow-2xl text-center z-10"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: [0, 1.1, 1], rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
          >
            <div className="text-6xl mb-3">🎉</div>
            <h3 className="text-2xl font-extrabold text-purple-800">Harika!</h3>
            <p className="text-purple-500 font-semibold">Eserin kaydedildi!</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
