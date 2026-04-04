'use client';

import { Suspense, useCallback, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ColoringCanvas } from '@/components/canvas/ColoringCanvas';
import type { ColoringCanvasHandle } from '@/components/canvas/ColoringCanvas';
import { Toolbar } from '@/components/canvas/Toolbar';
import { ColorPalette } from '@/components/canvas/ColorPalette';
import { BrushSettings } from '@/components/canvas/BrushSettings';
import { UndoRedoControls } from '@/components/canvas/UndoRedoControls';
import { SaveSuccessAnimation } from '@/components/ui/SaveSuccessAnimation';
import { CompletionCelebration } from '@/components/ui/CompletionCelebration';
import { useCanvasStore } from '@/store/canvasStore';
import { usePromptStore } from '@/store/promptStore';
import { useProfileStore } from '@/store/profileStore';
import { saveArtwork, updateArtwork, getArtwork } from '@/lib/storage';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/constants/limits';
import { playTadaSound } from '@/lib/sounds';

export default function BoyaPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><span className="text-4xl animate-spin">🎨</span></div>}>
      <BoyaPage />
    </Suspense>
  );
}

function BoyaPage() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const legacyImageUrl = searchParams.get('image');
  const artworkId = searchParams.get('artworkId');
  const canvasRef = useRef<ColoringCanvasHandle>(null);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const prompt = usePromptStore((s) => s.prompt);
  const profile = useProfileStore((s) => s.profile);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentArtworkId, setCurrentArtworkId] = useState<string | null>(artworkId);
  const [initialDrawingData, setInitialDrawingData] = useState<string | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);

  // Resolve image URL from various sources
  useEffect(() => {
    if (artworkId) {
      // Resuming an existing artwork
      const existing = getArtwork(artworkId);
      if (existing) {
        setResolvedImageUrl(existing.originalImageUrl);
        if (existing.drawingDataUrl) {
          setInitialDrawingData(existing.drawingDataUrl);
        }
      }
    } else if (source === 'generated') {
      // New image from /olustur — read base64 from localStorage
      const stored = localStorage.getItem('boyaai-current-image');
      if (stored) {
        setResolvedImageUrl(stored);
      }
    } else if (legacyImageUrl) {
      // Legacy URL param (backward compat with mock SVGs or direct links)
      setResolvedImageUrl(legacyImageUrl);
    }
  }, [artworkId, source, legacyImageUrl]);

  const imageUrl = resolvedImageUrl;

  const getMergedDataUrl = useCallback((): string | null => {
    const bgCanvas = canvasRef.current?.getBgCanvas();
    const drawCanvas = canvasRef.current?.getDrawCanvas();
    const outlineCanvas = canvasRef.current?.getOutlineCanvas();
    if (!bgCanvas || !drawCanvas) return null;

    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = CANVAS_WIDTH;
    mergedCanvas.height = CANVAS_HEIGHT;
    const ctx = mergedCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(bgCanvas, 0, 0);
    ctx.drawImage(drawCanvas, 0, 0);
    if (outlineCanvas) {
      ctx.drawImage(outlineCanvas, 0, 0);
    }
    return mergedCanvas.toDataURL('image/png');
  }, []);

  const getDrawingDataUrl = useCallback((): string | null => {
    const drawCanvas = canvasRef.current?.getDrawCanvas();
    if (!drawCanvas) return null;
    return drawCanvas.toDataURL('image/png');
  }, []);

  const handleDownload = useCallback(() => {
    const dataUrl = getMergedDataUrl();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = 'boyaai-resim.png';
    link.href = dataUrl;
    link.click();
  }, [getMergedDataUrl]);

  const handleSaveToGallery = useCallback((status: 'completed' | 'in-progress' = 'completed', stars?: number) => {
    const coloredDataUrl = getMergedDataUrl();
    const drawingDataUrl = getDrawingDataUrl();
    if (!coloredDataUrl || !imageUrl) return;

    const artworkPrompt = prompt || 'Boyama';

    if (currentArtworkId) {
      updateArtwork(currentArtworkId, {
        coloredDataUrl,
        drawingDataUrl: drawingDataUrl || undefined,
        status,
        prompt: artworkPrompt,
        ...(stars !== undefined && { stars }),
      });
    } else {
      const saved = saveArtwork({
        prompt: artworkPrompt,
        originalImageUrl: imageUrl,
        coloredDataUrl,
        drawingDataUrl: drawingDataUrl || undefined,
        status,
        ...(stars !== undefined && { stars }),
        profileId: profile?.id,
      });
      setCurrentArtworkId(saved.id);
    }

    if (status === 'completed') {
      playTadaSound();
    }
    setShowSaveSuccess(true);
  }, [getMergedDataUrl, getDrawingDataUrl, imageUrl, prompt, currentArtworkId, profile]);

  const handleCompletePainting = useCallback(() => {
    setShowCelebration(true);
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
      {/* Prompt text at top */}
      {prompt && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-purple-100 shadow-sm max-w-md">
          <p className="text-xs font-bold text-purple-500 truncate text-center">&ldquo;{prompt}&rdquo;</p>
        </div>
      )}

      {/* Save success animation */}
      <SaveSuccessAnimation show={showSaveSuccess} onComplete={() => setShowSaveSuccess(false)} />

      {/* Completion celebration */}
      <CompletionCelebration
        show={showCelebration}
        onComplete={(stars) => {
          handleSaveToGallery('completed', stars);
          setShowCelebration(false);
        }}
        onDismiss={() => {
          handleSaveToGallery('completed');
          setShowCelebration(false);
        }}
      />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col gap-4 p-3 w-[88px] bg-white/60 backdrop-blur-xl border-r border-purple-100 overflow-y-auto">
        <Toolbar />
        <div className="w-full h-px bg-purple-200" />
        <BrushSettings />
        <div className="w-full h-px bg-purple-200" />
        <ColorPalette />
        <div className="w-full h-px bg-purple-200" />
        <UndoRedoControls onSave={handleDownload} onClear={handleClear} />
        <div className="w-full h-px bg-purple-200" />
        {/* Gallery save buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleCompletePainting}
            title="Boyamayı Tamamla"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-xs shadow-md hover:shadow-lg hover:scale-105 transition-all flex flex-col items-center gap-0.5"
          >
            <span className="text-lg">🎉</span>
            <span>Bitti!</span>
          </button>
          <button
            onClick={() => handleSaveToGallery('in-progress')}
            title="Yarım Kaydet"
            className="w-full py-2.5 rounded-xl bg-amber-100 text-amber-700 font-bold text-xs hover:bg-amber-200 transition-all flex flex-col items-center gap-0.5"
          >
            <span className="text-lg">⏸️</span>
            <span>Ara Ver</span>
          </button>
        </div>
      </aside>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-3 md:p-6 overflow-hidden">
        <motion.div
          className="w-full max-w-[calc(100vh-14rem)] md:max-w-[calc(100vh-8rem)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <ColoringCanvas
            ref={canvasRef}
            imageUrl={imageUrl}
            initialDrawingDataUrl={initialDrawingData}
          />
        </motion.div>
      </div>

      {/* Mobile bottom bar */}
      <aside className="md:hidden flex flex-col gap-2 p-2 bg-white/80 backdrop-blur-xl border-t border-purple-100 safe-bottom">
        {/* Colors row */}
        <ColorPalette />
        {/* Tools row */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <Toolbar />
          <BrushSettings />
          <div className="w-px h-8 bg-purple-200 flex-shrink-0" />
          <UndoRedoControls onSave={handleDownload} onClear={handleClear} />
          <div className="w-px h-8 bg-purple-200 flex-shrink-0" />
          <button
            onClick={handleCompletePainting}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center text-xl shadow-md"
          >
            🎉
          </button>
          <button
            onClick={() => handleSaveToGallery('in-progress')}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl"
          >
            ⏸️
          </button>
        </div>
      </aside>
    </div>
  );
}
