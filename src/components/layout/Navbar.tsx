'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfileStore } from '@/store/profileStore';
import { SoundToggle } from '@/components/ui/SoundToggle';

const NAV_ITEMS = [
  { href: '/', label: 'Ana Sayfa', icon: '🏠' },
  { href: '/olustur', label: 'Oluştur', icon: '✨' },
  { href: '/galeri', label: 'Galeri', icon: '🖼️' },
];

export function Navbar() {
  const pathname = usePathname();
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const isBoyaPage = pathname === '/boya';

  // Minimal navbar on painting page
  if (isBoyaPage) {
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
            <SoundToggle />
            <Link
              href="/olustur"
              className="px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 font-bold text-sm hover:bg-purple-200 transition-all"
            >
              ✨ Yeni Sayfa
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Desktop navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-purple-100/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🎨</span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              BoyaAI
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  pathname === item.href
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <Link
              href="/olustur"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all min-h-[48px] flex items-center"
            >
              ✨ Hayalini Çiz
            </Link>

            <div className="w-px h-8 bg-purple-200" />

            <SoundToggle />

            <Link
              href="/ebeveyn"
              className="px-3 py-2 rounded-full text-xs font-bold text-purple-400 hover:bg-purple-50 transition-all"
            >
              👨‍👩‍👧
            </Link>

            {/* Profile badge */}
            {profile && (
              <button
                onClick={() => {
                  localStorage.removeItem('boyaai-active-profile');
                  setProfile(null);
                }}
                title="Profil değiştir"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 transition-all"
              >
                <span className="text-lg">{profile.avatar}</span>
                <span className="text-xs font-bold text-purple-700">{profile.name}</span>
              </button>
            )}
          </div>

          {/* Mobile top-right: profile + sound */}
          <div className="md:hidden flex items-center gap-2">
            <SoundToggle />
            {profile && (
              <button
                onClick={() => {
                  localStorage.removeItem('boyaai-active-profile');
                  setProfile(null);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50"
              >
                <span className="text-lg">{profile.avatar}</span>
                <span className="text-[10px] font-bold text-purple-700">{profile.name}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-purple-100 safe-bottom">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all min-w-[64px] ${
                pathname === item.href
                  ? 'text-purple-700'
                  : 'text-purple-400 hover:text-purple-600'
              }`}
            >
              <span className={`text-2xl ${pathname === item.href ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold ${pathname === item.href ? 'text-purple-700' : ''}`}>
                {item.label}
              </span>
              {pathname === item.href && (
                <div className="absolute bottom-1 w-6 h-1 rounded-full bg-purple-500" />
              )}
            </Link>
          ))}
          <Link
            href="/ebeveyn"
            className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all min-w-[64px] ${
              pathname === '/ebeveyn' ? 'text-purple-700' : 'text-purple-400 hover:text-purple-600'
            }`}
          >
            <span className="text-2xl">👨‍👩‍👧</span>
            <span className="text-[10px] font-bold">Ebeveyn</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
