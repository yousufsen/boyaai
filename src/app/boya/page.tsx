'use client';

import { Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ColoringCanvas } from '@/components/canvas/ColoringCanvas';
import type { ColoringCanvasHandle } from '@/components/canvas/ColoringCanvas';
import { Toolbar } from '@/components/canvas/Toolbar';
import { ColorPalette } from '@/components/canvas/ColorPalette';
import { BrushSettings } from '@/components/canvas/BrushSettings';
import { UndoRedoControls } from '@/components/canvas/UndoRedoControls';
import { useCanvasStore } from '@/store/canvasStore';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/constants/limits';

export default function BoyaPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><span className="text-4xl animate-spin">🎨</span></div>}>
      <BoyaPage />
    </Suspense>
  );
}

function BoyaPage() {
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get('image');
  const canvasRef = useRef<ColoringCanvasHandle>(null);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);

  const handleSave = useCallback(() => {
    const bgCanvas = canvasRef.current?.getBgCanvas();
    const drawCanvas = canvasRef.current?.getDrawCanvas();
    if (!bgCanvas || !drawCanvas) return;

    // Merge both canvases
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = CANVAS_WIDTH;
    mergedCanvas.height = CANVAS_HEIGHT;
    const ctx = mergedCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(bgCanvas, 0, 0);
    ctx.drawImage(drawCanvas, 0, 0);

    const link = document.createElement('a');
    link.download = 'boyaai-resim.png';
    link.href = mergedCanvas.toDataURL('image/png');
    link.click();
  }, []);

  const handleClear = useCallback(() => {
    clearCanvas();
  }, [clearCanvas]);

  if (!imageUrl) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-6xl mb-4">🖼️</div>
          <h1 className="text-3xl font-extrabold text-purple-800 mb-4">
            Önce bir boyama sayfası oluştur!
          </h1>
          <Link
            href="/olustur"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-lg shadow-xl hover:scale-105 transition-all"
          >
            ✨ Oluşturmaya Git
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col gap-4 p-3 w-[88px] bg-white/60 backdrop-blur-xl border-r border-purple-100 overflow-y-auto">
        <Toolbar />
        <div className="w-full h-px bg-purple-200" />
        <BrushSettings />
        <div className="w-full h-px bg-purple-200" />
        <ColorPalette />
        <div className="w-full h-px bg-purple-200" />
        <UndoRedoControls onSave={handleSave} onClear={handleClear} />
      </aside>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-3 md:p-6 overflow-hidden">
        <motion.div
          className="w-full max-w-[calc(100vh-14rem)] md:max-w-[calc(100vh-8rem)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <ColoringCanvas ref={canvasRef} imageUrl={imageUrl} />
        </motion.div>
      </div>

      {/* Mobile bottom bar */}
      <aside className="md:hidden flex flex-col gap-2 p-2 bg-white/80 backdrop-blur-xl border-t border-purple-100 safe-bottom">
        {/* Colors row */}
        <ColorPalette />
        {/* Tools row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <Toolbar />
          <BrushSettings />
          <div className="w-px h-8 bg-purple-200 flex-shrink-0" />
          <UndoRedoControls onSave={handleSave} onClear={handleClear} />
        </div>
      </aside>
    </div>
  );
}
