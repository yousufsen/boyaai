'use client';

import { useCanvasStore } from '@/store/canvasStore';
import { TOOLS } from '@/constants/colors';
import type { ToolType } from '@/constants/colors';
import { playClickSound } from '@/lib/sounds';
import { useTranslation } from '@/lib/i18n';

export function Toolbar() {
  const { t, locale } = useTranslation();
  const { activeTool, setTool } = useCanvasStore();

  return (
    <div className="flex md:flex-col gap-2">
      <p className="hidden md:block text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">{t('paint.tools')}</p>
      {TOOLS.map((tool) => (
        <button
          key={tool.type}
          onClick={() => { setTool(tool.type as ToolType); playClickSound(); }}
          title={locale === 'en' ? tool.nameEn : tool.name}
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
            activeTool === tool.type
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-300 scale-110'
              : 'bg-white/80 hover:bg-purple-100 text-purple-700'
          }`}
        >
          {tool.icon}
          {activeTool === tool.type && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-purple-600 whitespace-nowrap md:hidden">
              {locale === 'en' ? tool.nameEn : tool.name}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
