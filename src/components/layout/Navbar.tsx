'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfileStore } from '@/store/profileStore';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useTranslation } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

function getNavItems(t: (key: string) => string) {
  return [
    { href: '/', label: t('nav.home'), icon: '🏠' },
    { href: '/olustur', label: t('nav.create'), icon: '✨' },
    { href: '/kutuphane', label: t('nav.library'), icon: '📚' },
    { href: '/ciz', label: t('nav.freeDraw'), icon: '✏️' },
    { href: '/galeri', label: t('nav.gallery'), icon: '🖼️' },
  ];
}

export function Navbar() {
  const pathname = usePathname();
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const { t } = useTranslation();
  const isBoyaPage = pathname === '/boya';
  const isCizPage = pathname === '/ciz';
  const NAV_ITEMS = getNavItems(t);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const switchProfile = () => {
    localStorage.removeItem('boyaai-active-profile');
    setProfile(null);
  };

  // Minimal navbar on painting/drawing pages
  if (isBoyaPage || isCizPage) {
    return (
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-purple-100/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <span className="text-lg font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              BoyaAI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <SoundToggle />
            <Link href="/olustur" className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 font-bold text-xs hover:bg-purple-200 transition-all">
              ✨ {t('nav.newPage')}
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-purple-100/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl md:text-3xl">🎨</span>
            <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              BoyaAI
            </span>
          </Link>

          {/* Desktop: center nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                  pathname === item.href
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-purple-500 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop: right controls */}
          <div className="hidden md:flex items-center gap-1.5">
            <LanguageToggle />
            <SoundToggle />
            <Link href="/ebeveyn" className="w-8 h-8 rounded-full flex items-center justify-center text-sm hover:bg-purple-50 transition-all" title={t('nav.parent')}>
              👨‍👩‍👧
            </Link>
            {profile && (
              <button onClick={switchProfile} title={t('nav.home')}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 hover:bg-purple-100 transition-all">
                <span className="text-base">{profile.avatar}</span>
                <span className="text-[11px] font-bold text-purple-700 max-w-[60px] truncate">{profile.name}</span>
              </button>
            )}
          </div>

          {/* Mobile: right side — profile + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {profile && (
              <span className="text-lg">{profile.avatar}</span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-xl hover:bg-purple-50 transition-all"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-in menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="md:hidden fixed inset-0 z-[60] bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu panel */}
            <motion.div
              className="md:hidden fixed top-0 right-0 bottom-0 w-[260px] z-[70] bg-white shadow-2xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-purple-100">
                <span className="text-lg font-extrabold text-purple-700">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-purple-50">✕</button>
              </div>

              {/* Profile */}
              {profile && (
                <div className="flex items-center gap-3 p-4 border-b border-purple-50">
                  <span className="text-3xl">{profile.avatar}</span>
                  <div>
                    <p className="font-extrabold text-purple-800">{profile.name}</p>
                    <button onClick={() => { switchProfile(); setMobileMenuOpen(false); }} className="text-xs font-bold text-purple-400 hover:text-purple-600">
                      {t('nav.home') === 'Home' ? 'Switch Profile' : 'Profil Değiştir'}
                    </button>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto p-3">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 font-bold transition-all ${
                      pathname === item.href
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                <Link
                  href="/ebeveyn"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 font-bold transition-all ${
                    pathname === '/ebeveyn'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <span className="text-xl">👨‍👩‍👧</span>
                  <span>{t('nav.parent')}</span>
                </Link>
              </div>

              {/* Bottom controls */}
              <div className="p-4 border-t border-purple-100 flex items-center gap-3">
                <LanguageToggle />
                <SoundToggle />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
