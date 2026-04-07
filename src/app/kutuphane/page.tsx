'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { STOCK_CATEGORIES, CATEGORY_NAMES_EN, IMAGE_TITLES_EN } from '@/constants/stockLibrary';
import { useTranslation } from '@/lib/i18n';

export default function KutuphanePage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  // Filter categories by locale: show 'alfabe' for TR, 'alphabet' for EN
  const filteredCategories = STOCK_CATEGORIES.filter((c) => {
    if (c.id === 'alfabe' && locale === 'en') return false;
    if (c.id === 'alphabet' && locale === 'tr') return false;
    return true;
  });

  const [activeCategory, setActiveCategory] = useState(filteredCategories[0]?.id || '');

  const category = filteredCategories.find((c) => c.id === activeCategory) || filteredCategories[0];

  const handleSelectImage = (imagePath: string) => {
    localStorage.setItem('boyaai-current-image', imagePath);
    router.push('/boya?source=generated');
  };

  if (filteredCategories.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h1 className="text-3xl font-extrabold text-purple-800 mb-4">{t('library.notReady')}</h1>
        <p className="text-purple-500 font-semibold mb-6">
          {t('library.notReadySub')}
        </p>
        <Link
          href="/olustur"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-lg shadow-xl hover:scale-105 transition-all"
        >
          {t('library.createOwn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-extrabold text-purple-800 mb-2">{t('library.title')}</h1>
        <p className="text-purple-500 font-semibold">{t('library.subtitle')}</p>
      </motion.div>

      {/* Category tabs */}
      <div className="overflow-x-auto pb-2 mb-6 -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all min-h-[44px] ${
                activeCategory === cat.id
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-300'
                  : 'bg-white/80 text-purple-600 hover:bg-purple-100 border border-purple-100'
              }`}
            >
              {cat.emoji} {locale === 'en' ? (CATEGORY_NAMES_EN[cat.id] || cat.name) : cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Image grid */}
      {category && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {category.images.map((img, i) => (
            <motion.button
              key={img.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSelectImage(img.path)}
              className="group bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-purple-100 hover:shadow-xl hover:scale-[1.03] hover:border-purple-300 transition-all text-left"
            >
              <div className="aspect-square bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.path}
                  alt={img.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-bold text-purple-800 truncate">{locale === 'en' ? (IMAGE_TITLES_EN[img.title] || img.title) : img.title}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {category && category.images.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🖼️</div>
          <p className="text-purple-400 font-bold">{t('library.empty')}</p>
        </div>
      )}
    </div>
  );
}
