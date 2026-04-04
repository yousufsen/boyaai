'use client';

import { useTranslation } from '@/lib/i18n';

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center bg-white/80 rounded-full shadow-sm border border-purple-100 p-0.5">
      <button
        onClick={() => setLocale('tr')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
          locale === 'tr'
            ? 'bg-purple-500 text-white shadow-sm'
            : 'text-purple-400 hover:text-purple-600'
        }`}
      >
        🇹🇷 TR
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
          locale === 'en'
            ? 'bg-purple-500 text-white shadow-sm'
            : 'text-purple-400 hover:text-purple-600'
        }`}
      >
        🇬🇧 EN
      </button>
    </div>
  );
}
