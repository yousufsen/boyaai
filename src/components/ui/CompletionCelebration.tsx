'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playTadaSound } from '@/lib/sounds';
import { useTranslation } from '@/lib/i18n';

interface CompletionCelebrationProps {
  show: boolean;
  onComplete: (stars: number) => void;
  onDismiss: () => void;
}

const STAR_MESSAGES = ['', 'Güzel! 👍', 'Harika! 🌟', 'Muhteşem! 🏆'];
const CONFETTI = ['🎉', '🎊', '⭐', '🌟', '✨', '💫', '🎨', '🌈', '🦄', '🎵', '💖', '🔥'];

export function CompletionCelebration({ show, onComplete, onDismiss }: CompletionCelebrationProps) {
  const [stars, setStars] = useState(0);
  const { t } = useTranslation();

  const handleShow = () => {
    playTadaSound();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={handleShow}
        >
          {/* Confetti particles */}
          {CONFETTI.map((c, i) => (
            <motion.span
              key={i}
              className="absolute text-3xl pointer-events-none"
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{
                x: (Math.random() - 0.5) * 500,
                y: (Math.random() - 0.5) * 500,
                opacity: [0, 1, 1, 0],
                rotate: Math.random() * 720 - 360,
                scale: [0, 1.2, 1, 0],
              }}
              transition={{ duration: 2, delay: i * 0.05, ease: 'easeOut' }}
            >
              {c}
            </motion.span>
          ))}

          <motion.div
            className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center z-10"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <motion.div
              className="text-7xl mb-4"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              🎉
            </motion.div>

            <h2 className="text-3xl font-black text-purple-800 mb-2">{t('celebration.title')}</h2>
            <p className="text-purple-500 font-semibold mb-6">{t('celebration.subtitle')}</p>

            {/* Star rating */}
            <div className="flex justify-center gap-3 mb-3">
              {[1, 2, 3].map((n) => (
                <motion.button
                  key={n}
                  onClick={() => setStars(n)}
                  whileTap={{ scale: 1.3 }}
                  className={`text-5xl transition-all ${
                    stars >= n ? 'drop-shadow-lg' : 'grayscale opacity-30'
                  }`}
                >
                  ⭐
                </motion.button>
              ))}
            </div>

            {stars > 0 && (
              <motion.p
                className="text-lg font-bold text-amber-500 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {STAR_MESSAGES[stars]}
              </motion.p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={onDismiss}
                className="flex-1 min-h-[48px] rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
              >
                {t('celebration.skip')}
              </button>
              <button
                onClick={() => onComplete(stars || 1)}
                className="flex-1 min-h-[48px] rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-extrabold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                {t('celebration.saveButton')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
