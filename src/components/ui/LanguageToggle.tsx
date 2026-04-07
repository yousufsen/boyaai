'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 text-xs font-bold text-purple-600 transition-all"
      >
        {locale.toUpperCase()} <span className="text-[8px] ml-0.5">▼</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-purple-100 overflow-hidden z-50 min-w-[130px]">
          <button
            onClick={() => { setLocale('tr'); setOpen(false); }}
            className={`w-full px-3 py-2 text-left text-sm font-bold flex items-center gap-2 hover:bg-purple-50 transition-all ${locale === 'tr' ? 'text-purple-700 bg-purple-50' : 'text-gray-600'}`}
          >
            🇹🇷 Türkçe
          </button>
          <button
            onClick={() => { setLocale('en'); setOpen(false); }}
            className={`w-full px-3 py-2 text-left text-sm font-bold flex items-center gap-2 hover:bg-purple-50 transition-all ${locale === 'en' ? 'text-purple-700 bg-purple-50' : 'text-gray-600'}`}
          >
            🇺🇸 English
          </button>
        </div>
      )}
    </div>
  );
}
