'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RecentArtworks } from '@/components/ui/RecentArtworks';
import { useProfileStore } from '@/store/profileStore';
import { getRandomInspiration } from '@/constants/inspirations';
import { useTranslation } from '@/lib/i18n';

const FLOATING_EMOJIS = ['🎨', '🖌️', '🌈', '⭐', '🦄', '🎉', '🦋', '🌸'];

const SAMPLE_PROMPTS: Record<string, { emoji: string; text: string }[]> = {
  tr: [
    { emoji: '🦁', text: 'Ormanda oynayan bir aslan' },
    { emoji: '🚀', text: 'Uzayda uçan bir roket' },
    { emoji: '🧜‍♀️', text: 'Denizaltında bir deniz kızı' },
    { emoji: '🏰', text: 'Büyülü bir prenses kalesi' },
    { emoji: '🦖', text: 'Mutlu bir dinozor ailesi' },
    { emoji: '🌊', text: 'Dalgalarda sörf yapan kedi' },
  ],
  en: [
    { emoji: '🦁', text: 'A lion playing in the forest' },
    { emoji: '🚀', text: 'A rocket flying in space' },
    { emoji: '🧜‍♀️', text: 'A mermaid under the sea' },
    { emoji: '🏰', text: 'A magical princess castle' },
    { emoji: '🦖', text: 'A happy dinosaur family' },
    { emoji: '🌊', text: 'A cat surfing on waves' },
  ],
};

export default function Home() {
  const profile = useProfileStore((s) => s.profile);
  const [inspiration, setInspiration] = useState('');
  const { t, locale } = useTranslation();

  const STEPS = [
    { emoji: '🗣️', title: t('home.step1Title'), desc: t('home.step1Desc') },
    { emoji: '✨', title: t('home.step2Title'), desc: t('home.step2Desc') },
    { emoji: '🎨', title: t('home.step3Title'), desc: t('home.step3Desc') },
  ];

  useEffect(() => {
    setInspiration(getRandomInspiration(locale));
  }, [locale]);

  return (
    <div className="relative overflow-hidden">
      {/* Floating emojis */}
      {FLOATING_EMOJIS.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl pointer-events-none select-none"
          initial={{ x: `${10 + (i * 12)}vw`, y: '100vh', opacity: 0 }}
          animate={{ y: '-10vh', opacity: [0, 0.7, 0.7, 0], rotate: [0, 15, -15, 0] }}
          transition={{ duration: 8 + i * 1.5, repeat: Infinity, delay: i * 2, ease: 'linear' }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Hero Section */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Personalized greeting */}
          {profile && (
            <motion.p
              className="text-lg md:text-xl text-purple-500 font-bold mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t('home.greeting', { name: profile.name })} {profile.avatar}
            </motion.p>
          )}

          <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
            {profile ? (
              <>
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 bg-clip-text text-transparent">
                  {t('home.heroTitlePersonal1')}
                </span>
                <br />
                <span className="bg-gradient-to-r from-pink-500 via-red-400 to-amber-500 bg-clip-text text-transparent">
                  {t('home.heroTitlePersonal2')}
                </span>
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 bg-clip-text text-transparent">
                  {t('home.heroTitle1')}
                </span>
                <br />
                <span className="bg-gradient-to-r from-pink-500 via-red-400 to-amber-500 bg-clip-text text-transparent">
                  {t('home.heroTitle2')}
                </span>
              </>
            )}
          </h1>

          {/* Random inspiration */}
          {inspiration && (
            <motion.p
              className="text-lg md:text-xl text-purple-600/60 max-w-lg mx-auto mb-8 font-semibold italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              &ldquo;{inspiration}&rdquo;
            </motion.p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/olustur"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-lg shadow-xl shadow-purple-300/50 hover:shadow-2xl hover:scale-105 transition-all min-h-[56px] flex items-center justify-center gap-2"
            >
              {t('home.startButton')}
            </Link>
            <Link
              href="/galeri"
              className="px-8 py-4 rounded-2xl bg-white/80 border-2 border-purple-200 text-purple-600 font-extrabold text-lg hover:bg-purple-50 transition-all min-h-[56px] flex items-center justify-center gap-2"
            >
              {t('home.galleryButton')}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <motion.h2
          className="text-3xl md:text-4xl font-extrabold text-center mb-14 text-purple-800"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t('home.howItWorks')}
        </motion.h2>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-xl border border-purple-100 hover:shadow-2xl hover:-translate-y-2 transition-all"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
            >
              <div className="text-5xl mb-4">{step.emoji}</div>
              <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-sm mb-3">
                Adım {i + 1}
              </div>
              <h3 className="text-2xl font-extrabold text-purple-800 mb-2">{step.title}</h3>
              <p className="text-purple-600/70 font-medium">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sample Prompts */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-purple-50/50">
        <motion.h2
          className="text-3xl md:text-4xl font-extrabold text-center mb-4 text-purple-800"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t('home.promptIdeas')}
        </motion.h2>
        <p className="text-center text-purple-500 mb-12 font-semibold">
          {t('home.promptIdeasSub')}
        </p>

        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {(SAMPLE_PROMPTS[locale] || SAMPLE_PROMPTS.tr).map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={`/olustur?prompt=${encodeURIComponent(item.text)}`}
                className="block bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg border border-purple-100 hover:shadow-xl hover:scale-105 hover:border-purple-300 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2"
              >
                <span className="text-4xl">{item.emoji}</span>
                <span className="text-sm font-bold text-purple-700">{item.text}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Free Draw CTA */}
      <section className="py-12 px-4">
        <motion.div
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link
            href="/ciz"
            className="block bg-gradient-to-r from-amber-100 to-orange-100 rounded-3xl p-8 text-center shadow-xl border border-amber-200 hover:shadow-2xl hover:scale-[1.02] transition-all"
          >
            <div className="text-5xl mb-3">✏️</div>
            <h3 className="text-2xl font-extrabold text-purple-800 mb-2">{t('draw.title')}</h3>
            <p className="text-purple-500 font-semibold">{t('draw.subtitle')}</p>
          </Link>
        </motion.div>
      </section>

      {/* Recent Artworks */}
      <RecentArtworks />

      {/* Footer */}
      <footer className="py-8 text-center text-purple-400 font-semibold border-t border-purple-100/50">
        <p>{t('home.footer')}</p>
      </footer>
    </div>
  );
}
