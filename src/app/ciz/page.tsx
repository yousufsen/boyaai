'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DrawingCanvas } from '@/components/drawing/DrawingCanvas';
import type { DrawingCanvasHandle, DrawTool, BgPattern } from '@/components/drawing/DrawingCanvas';
import { COLORS, BRUSH_SIZES } from '@/constants/colors';
import { useTranslation } from '@/lib/i18n';
import { useProfileStore } from '@/store/profileStore';
import { saveArtwork } from '@/lib/storage';
import { SaveSuccessAnimation } from '@/components/ui/SaveSuccessAnimation';
import { playPopSound, playClickSound } from '@/lib/sounds';
import { createPortal } from 'react-dom';

const BG_OPTIONS: { type: BgPattern; name: string; nameEn: string; label: string }[] = [
  { type: 'plain', name: 'Düz', nameEn: 'Plain', label: '⬜' },
  { type: 'grid', name: 'Kareli', nameEn: 'Grid', label: '▦' },
  { type: 'dots', name: 'Noktalı', nameEn: 'Dots', label: '···' },
  { type: 'lines', name: 'Çizgili', nameEn: 'Lines', label: '☰' },
];

export default function CizPage() {
  const { t, locale } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [activeTool, setActiveTool] = useState<DrawTool>('brush');
  const [activeColor, setActiveColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [bgPattern, setBgPattern] = useState<BgPattern>('plain');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [, setStrokeCount] = useState(0);

  const handleSave = useCallback(() => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = 'boyaai-cizim.png';
    link.href = dataUrl;
    link.click();
  }, []);

  const handleSaveToGallery = useCallback(() => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (!dataUrl) return;
    saveArtwork({ prompt: locale === 'en' ? 'Free Drawing' : 'Serbest Çizim', originalImageUrl: '', coloredDataUrl: dataUrl, status: 'completed', profileId: profile?.id });
    setShowSaveSuccess(true);
  }, [profile, locale]);

  const callFn = (name: string) => { const fn = (window as unknown as Record<string, () => void>)[name]; if (fn) { fn(); setStrokeCount((c) => c + 1); } };
  const canUndo = () => { const fn = (window as unknown as Record<string, () => boolean>).__drawingCanUndo; return fn ? fn() : false; };
  const canRedo = () => { const fn = (window as unknown as Record<string, () => boolean>).__drawingCanRedo; return fn ? fn() : false; };
  const selectTool = (tool: DrawTool) => { setActiveTool(tool); playClickSound(); };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden">
      <SaveSuccessAnimation show={showSaveSuccess} onComplete={() => setShowSaveSuccess(false)} />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[100px] bg-white/60 backdrop-blur-xl border-r border-purple-100 overflow-y-auto p-2 gap-2">
        {/* Tools */}
        <p className="text-[10px] font-bold text-purple-400 uppercase">{t('paint.tools')}</p>
        {[
          { type: 'brush' as DrawTool, icon: '🖌️', name: 'Fırça', nameEn: 'Brush' },
          { type: 'eraser' as DrawTool, icon: '🧽', name: 'Silgi', nameEn: 'Eraser' },
          { type: 'fill' as DrawTool, icon: '🪣', name: 'Boya Kovası', nameEn: 'Fill' },
          { type: 'line' as DrawTool, icon: '📏', name: 'Çizgi', nameEn: 'Line' },
        ].map((tool) => (
          <button key={tool.type} onClick={() => selectTool(tool.type)}
            title={locale === 'en' ? tool.nameEn : tool.name}
            className={`w-full h-10 rounded-xl flex items-center justify-center text-xl transition-all ${activeTool === tool.type ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/80 hover:bg-purple-100'}`}>
            {tool.icon}
          </button>
        ))}

        <div className="h-px bg-purple-200" />

        {/* Brush size */}
        <p className="text-[10px] font-bold text-purple-400 uppercase">{t('paint.size')}</p>
        {BRUSH_SIZES.map((b) => (
          <button key={b.size} onClick={() => setBrushSize(b.size)}
            title={locale === 'en' ? b.nameEn : b.name}
            className={`h-8 rounded-xl flex items-center justify-center ${brushSize === b.size ? 'bg-purple-500 shadow-lg' : 'bg-white/80 hover:bg-purple-100'}`}>
            <span className={`rounded-full ${brushSize === b.size ? 'bg-white' : 'bg-purple-700'}`} style={{ width: Math.min(b.size + 4, 28), height: Math.min(b.size + 4, 28) }} />
          </button>
        ))}

        <div className="h-px bg-purple-200" />

        {/* Colors */}
        <p className="text-[10px] font-bold text-purple-400 uppercase">{t('paint.colors')}</p>
        <div className="flex flex-wrap gap-1">
          {COLORS.map((c) => (
            <button key={c.hex} onClick={() => { setActiveColor(c.hex); playPopSound(); }}
              title={locale === 'en' ? c.nameEn : c.name}
              className={`w-6 h-6 rounded-full border-2 hover:scale-110 ${activeColor === c.hex ? 'border-purple-500 ring-1 ring-purple-300 scale-110' : 'border-gray-200'}`}
              style={{ backgroundColor: c.hex }} />
          ))}
        </div>

        <div className="h-px bg-purple-200" />

        {/* Background patterns */}
        <p className="text-[10px] font-bold text-purple-400 uppercase">{locale === 'en' ? 'Paper' : 'Kağıt'}</p>
        <div className="flex gap-1">
          {BG_OPTIONS.map((bg) => (
            <button key={bg.type} onClick={() => setBgPattern(bg.type)}
              title={locale === 'en' ? bg.nameEn : bg.name}
              className={`flex-1 h-8 rounded-lg text-sm flex items-center justify-center ${bgPattern === bg.type ? 'bg-purple-500 text-white' : 'bg-white/80 text-purple-600 hover:bg-purple-100'}`}>
              {bg.label}
            </button>
          ))}
        </div>

        <div className="h-px bg-purple-200" />

        {/* Actions */}
        <button onClick={() => callFn('__drawingUndo')} disabled={!canUndo()} title={t('paint.undo')} className="h-8 rounded-xl flex items-center justify-center text-lg bg-white/80 hover:bg-purple-100 disabled:opacity-30">↩️</button>
        <button onClick={() => callFn('__drawingRedo')} disabled={!canRedo()} title={t('paint.redo')} className="h-8 rounded-xl flex items-center justify-center text-lg bg-white/80 hover:bg-purple-100 disabled:opacity-30">↪️</button>
        <button onClick={() => setShowClearConfirm(true)} title={t('paint.clear')} className="h-8 rounded-xl flex items-center justify-center text-lg bg-white/80 hover:bg-red-100">🗑️</button>
        <button onClick={handleSave} title={t('paint.save')} className="h-8 rounded-xl flex items-center justify-center text-lg bg-green-100 hover:bg-green-200">💾</button>
        <button onClick={handleSaveToGallery} title={locale === 'en' ? 'Save to Gallery' : 'Galeriye Kaydet'} className="h-8 rounded-xl flex items-center justify-center text-lg bg-purple-100 hover:bg-purple-200">🖼️</button>
        <Link href="/olustur" title={t('paint.newPage')} className="h-8 rounded-xl flex items-center justify-center text-lg bg-amber-100 hover:bg-amber-200">✨</Link>
      </aside>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-3 md:p-6 overflow-hidden">
        <motion.div className="w-full max-w-[calc(100vh-14rem)] md:max-w-[calc(100vh-8rem)]"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <DrawingCanvas ref={canvasRef} activeTool={activeTool} activeColor={activeColor}
            brushSize={brushSize} bgPattern={bgPattern} onStrokeEnd={() => setStrokeCount((c) => c + 1)} />
        </motion.div>
      </div>

      {/* Mobile bottom bar */}
      <aside className="md:hidden flex flex-col gap-1 p-2 bg-white/80 backdrop-blur-xl border-t border-purple-100 safe-bottom">
        <div className="flex gap-1 overflow-x-auto py-0.5">
          {COLORS.map((c) => (
            <button key={c.hex} onClick={() => { setActiveColor(c.hex); playPopSound(); }}
              className={`flex-shrink-0 w-7 h-7 rounded-full border-2 ${activeColor === c.hex ? 'border-purple-500 ring-1 ring-purple-300' : 'border-gray-200'}`}
              style={{ backgroundColor: c.hex }} />
          ))}
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { type: 'brush' as DrawTool, icon: '🖌️' },
            { type: 'eraser' as DrawTool, icon: '🧽' },
            { type: 'fill' as DrawTool, icon: '🪣' },
            { type: 'line' as DrawTool, icon: '📏' },
          ].map((tool) => (
            <button key={tool.type} onClick={() => selectTool(tool.type)}
              className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg ${activeTool === tool.type ? 'bg-purple-500 text-white' : 'bg-white/80'}`}>{tool.icon}</button>
          ))}
          <div className="w-px h-7 bg-purple-200 flex-shrink-0" />
          <button onClick={() => callFn('__drawingUndo')} className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg bg-white/80">↩️</button>
          <button onClick={() => callFn('__drawingRedo')} className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg bg-white/80">↪️</button>
          <button onClick={() => setShowClearConfirm(true)} className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg bg-white/80">🗑️</button>
          <button onClick={handleSaveToGallery} className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg bg-green-500 text-white">💾</button>
        </div>
      </aside>

      {showClearConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-xl font-extrabold text-purple-800 mb-2">{t('paint.clearConfirmTitle')}</h3>
            <p className="text-purple-500 font-semibold mb-6">{t('paint.clearConfirmDesc')}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowClearConfirm(false)} className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold min-h-[48px]">{t('common.cancel')}</button>
              <button onClick={() => { callFn('__drawingClear'); setShowClearConfirm(false); }}
                className="px-6 py-3 rounded-2xl bg-red-500 text-white font-bold min-h-[48px]">
                {locale === 'en' ? 'Yes, Clear' : 'Evet, Temizle'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
