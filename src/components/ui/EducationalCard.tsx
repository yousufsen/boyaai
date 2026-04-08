'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EducationalFact } from '@/constants/educationalFacts';
import { useTranslation } from '@/lib/i18n';

interface EducationalCardProps {
  fact: EducationalFact;
  title: string;
  onClose: () => void;
}

export function EducationalCard({ fact, title, onClose }: EducationalCardProps) {
  const { locale } = useTranslation();
  const [showFunFact, setShowFunFact] = useState(false);

  const mainFact = locale === 'en' ? fact.factEn : fact.factTr;
  const funFactText = locale === 'en' ? fact.funFactEn : fact.funFactTr;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }}
        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg border border-amber-200 p-4 max-w-[260px] w-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl flex-shrink-0">{fact.emoji}</span>
            <h3 className="text-sm font-extrabold text-purple-800 truncate">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-purple-400 hover:bg-purple-100 hover:text-purple-700 transition-all flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Fact content */}
        <AnimatePresence mode="wait">
          <motion.p
            key={showFunFact ? 'fun' : 'main'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs font-semibold text-purple-700/80 leading-relaxed mb-3"
          >
            {showFunFact ? funFactText : mainFact}
          </motion.p>
        </AnimatePresence>

        {/* Actions */}
        <button
          onClick={() => setShowFunFact(!showFunFact)}
          className="w-full px-2 py-1.5 rounded-xl bg-white/80 text-[10px] font-bold text-purple-600 hover:bg-purple-100 transition-all"
        >
          {showFunFact
            ? (locale === 'en' ? '↩ Go Back' : '↩ Geri')
            : (locale === 'en' ? '✨ Fun Fact' : '✨ Eğlenceli Bilgi')}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
