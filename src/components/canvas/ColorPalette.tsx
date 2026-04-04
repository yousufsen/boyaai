'use client';

import { useCanvasStore } from '@/store/canvasStore';
import { COLORS } from '@/constants/colors';
import { playPopSound } from '@/lib/sounds';
import { useTranslation } from '@/lib/i18n';

export function ColorPalette() {
  const { t, locale } = useTranslation();
  const { activeColor, setColor, activeTool } = useCanvasStore();

  return (
    <div>
      <p className="hidden md:block text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">{t('paint.colors')}</p>
      <div className="flex md:flex-wrap gap-1.5 overflow-x-auto md:overflow-visible py-1 px-1 max-w-full">
        {COLORS.map((color) => (
          <button
            key={color.hex}
            onClick={() => { setColor(color.hex); playPopSound(); }}
            title={locale === 'en' ? color.nameEn : color.name}
            disabled={activeTool === 'eraser'}
            className={`flex-shrink-0 w-9 h-9 md:w-8 md:h-8 rounded-full border-2 transition-all hover:scale-110 ${
              activeColor === color.hex && activeTool !== 'eraser'
                ? 'border-purple-500 ring-2 ring-purple-300 scale-110 shadow-lg'
                : 'border-gray-200 hover:border-purple-300'
            } ${activeTool === 'eraser' ? 'opacity-40 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: color.hex }}
          >
            {color.hex === '#FFFFFF' && (
              <span className="w-full h-full rounded-full border border-gray-300 block" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
