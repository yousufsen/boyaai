'use client';

import { useCanvasStore } from '@/store/canvasStore';
import { BRUSH_SIZES } from '@/constants/colors';
import { useTranslation } from '@/lib/i18n';

export function BrushSettings() {
  const { t, locale } = useTranslation();
  const { brushSize, setBrushSize, activeTool } = useCanvasStore();

  if (activeTool === 'fill') return null;

  return (
    <div>
      <p className="hidden md:block text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">{t('paint.size')}</p>
      <div className="flex md:flex-col gap-2">
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.size}
            onClick={() => setBrushSize(b.size)}
            title={locale === 'en' ? b.nameEn : b.name}
            className={`w-12 h-12 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${
              brushSize === b.size
                ? 'bg-purple-500 shadow-lg shadow-purple-300 scale-110'
                : 'bg-white/80 hover:bg-purple-100'
            }`}
          >
            <span
              className={`rounded-full ${brushSize === b.size ? 'bg-white' : 'bg-purple-700'}`}
              style={{ width: Math.min(b.size + 4, 28), height: Math.min(b.size + 4, 28) }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
