'use client';

import { create } from 'zustand';
import { tr } from '@/locales/tr';
import { en } from '@/locales/en';

export type Locale = 'tr' | 'en';
export type Translations = typeof tr;

const LOCALES: Record<Locale, Translations> = { tr, en };
const STORAGE_KEY = 'boyaai-language';

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'tr';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'tr' || stored === 'en') return stored;
  const browser = navigator.language?.slice(0, 2);
  return browser === 'tr' ? 'tr' : 'en';
}

interface I18nStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nStore>((set) => ({
  locale: 'tr',
  setLocale: (locale) => {
    localStorage.setItem(STORAGE_KEY, locale);
    set({ locale });
  },
}));

// Initialize locale from browser/storage (client-side only)
if (typeof window !== 'undefined') {
  useI18nStore.setState({ locale: detectLocale() });
}

/**
 * Get a nested value from an object by dot-separated key.
 * t('home.greeting', { name: 'Yusuf' }) → "Merhaba Yusuf!"
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return typeof value === 'string' ? value : path;
}

export function useTranslation() {
  const { locale, setLocale } = useI18nStore();
  const translations = LOCALES[locale];

  function t(key: string, vars?: Record<string, string | number>): string {
    let text = getNestedValue(translations as unknown as Record<string, unknown>, key);
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }

  return { t, locale, setLocale };
}
