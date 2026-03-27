'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-purple-100/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl">🎨</span>
          <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 bg-clip-text text-transparent">
            BoyaAI
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/galeri"
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              pathname === '/galeri'
                ? 'bg-purple-100 text-purple-700'
                : 'text-purple-600 hover:bg-purple-50'
            }`}
          >
            🖼️ Galeri
          </Link>
          <Link
            href="/olustur"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all min-h-[48px] flex items-center"
          >
            ✨ Hayalini Çiz
          </Link>
        </div>
      </div>
    </nav>
  );
}
