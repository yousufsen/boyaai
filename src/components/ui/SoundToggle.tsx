'use client';

import { useState, useEffect } from 'react';
import { isSoundEnabled, setSoundEnabled } from '@/lib/sounds';

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
  };

  return (
    <button
      onClick={toggle}
      title={enabled ? 'Sesi Kapat' : 'Sesi Aç'}
      className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white/60 hover:bg-white/80 transition-all"
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  );
}
