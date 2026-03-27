'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function GaleriPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-extrabold text-purple-800 mb-4">
          🖼️ Galeri
        </h1>
        <p className="text-purple-500 font-semibold mb-10">
          Boyadığın resimler burada görünecek!
        </p>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-purple-100">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-2xl font-extrabold text-purple-700 mb-2">
            Henüz resim yok!
          </h2>
          <p className="text-purple-400 font-semibold mb-6">
            İlk boyama sayfanı oluştur ve boyamaya başla!
          </p>
          <Link
            href="/olustur"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-lg shadow-xl hover:scale-105 transition-all"
          >
            ✨ Hadi Başlayalım!
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
