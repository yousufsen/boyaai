'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { RecentArtworks } from '@/components/ui/RecentArtworks';

const FLOATING_EMOJIS = ['🎨', '🖌️', '🌈', '⭐', '🦄', '🎉', '🦋', '🌸'];

const SAMPLE_PROMPTS = [
  { emoji: '🦁', text: 'Ormanda oynayan bir aslan' },
  { emoji: '🚀', text: 'Uzayda uçan bir roket' },
  { emoji: '🧜‍♀️', text: 'Denizaltında bir deniz kızı' },
  { emoji: '🏰', text: 'Büyülü bir prenses kalesi' },
  { emoji: '🦖', text: 'Mutlu bir dinozor ailesi' },
  { emoji: '🌊', text: 'Dalgalarda sörf yapan kedi' },
];

const STEPS = [
  { emoji: '🗣️', title: 'Anlat', desc: 'Hayal ettiğin sahneyi anlat veya yaz' },
  { emoji: '✨', title: 'Üret', desc: 'Yapay zeka boyama sayfanı çizsin' },
  { emoji: '🎨', title: 'Boya', desc: 'Renklerle hayalini canlandır!' },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Floating emojis */}
      {FLOATING_EMOJIS.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl pointer-events-none select-none"
          initial={{
            x: `${10 + (i * 12)}vw`,
            y: '100vh',
            opacity: 0,
          }}
          animate={{
            y: '-10vh',
            opacity: [0, 0.7, 0.7, 0],
            rotate: [0, 15, -15, 0],
          }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            delay: i * 2,
            ease: 'linear',
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Hero Section */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              Hayal Et,
            </span>
            <br />
            <span className="bg-gradient-to-r from-pink-500 via-red-400 to-amber-500 bg-clip-text text-transparent">
              Boya!
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-purple-700/70 max-w-xl mx-auto mb-10 font-semibold">
            Hayalindeki sahneyi anlat, yapay zeka senin için boyama sayfası çizsin! 🎨
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/olustur"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-lg shadow-xl shadow-purple-300/50 hover:shadow-2xl hover:scale-105 transition-all min-h-[56px] flex items-center justify-center gap-2"
            >
              🚀 Hayalini Çiz!
            </Link>
            <Link
              href="/galeri"
              className="px-8 py-4 rounded-2xl bg-white/80 border-2 border-purple-200 text-purple-600 font-extrabold text-lg hover:bg-purple-50 transition-all min-h-[56px] flex items-center justify-center gap-2"
            >
              🖼️ Galeriye Bak
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
          Nasıl Çalışır? 🤔
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
          Ne Çizmek İstersin? 🎯
        </motion.h2>
        <p className="text-center text-purple-500 mb-12 font-semibold">
          Bir tanesine tıkla ve hemen başla!
        </p>

        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {SAMPLE_PROMPTS.map((item, i) => (
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

      {/* Recent Artworks */}
      <RecentArtworks />

      {/* Footer */}
      <footer className="py-8 text-center text-purple-400 font-semibold border-t border-purple-100/50">
        <p>🎨 BoyaAI ile hayal gücünü keşfet! 🌈</p>
      </footer>
    </div>
  );
}
