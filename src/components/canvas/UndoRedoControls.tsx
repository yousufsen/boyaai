'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import Link from 'next/link';

interface UndoRedoControlsProps {
  onSave: () => void;
  onClear: () => void;
}

export function UndoRedoControls({ onSave, onClear }: UndoRedoControlsProps) {
  const { actions, undoneActions, undo, redo } = useCanvasStore();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div className="flex md:flex-col gap-2">
        <p className="hidden md:block text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">İşlemler</p>

        {/* Undo */}
        <button
          onClick={undo}
          disabled={actions.length === 0}
          title="Geri Al"
          className="w-12 h-12 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-xl bg-white/80 hover:bg-purple-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ↩️
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={undoneActions.length === 0}
          title="Yinele"
          className="w-12 h-12 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-xl bg-white/80 hover:bg-purple-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ↪️
        </button>

        {/* Divider */}
        <div className="hidden md:block w-full h-px bg-purple-200 my-1" />
        <div className="md:hidden w-px h-8 bg-purple-200 self-center mx-1" />

        {/* Clear */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={actions.length === 0}
          title="Temizle"
          className="w-12 h-12 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-xl bg-white/80 hover:bg-red-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          🗑️
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          title="Kaydet"
          className="w-12 h-12 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-xl bg-green-100 hover:bg-green-200 transition-all"
        >
          💾
        </button>

        {/* New page */}
        <Link
          href="/olustur"
          title="Yeni Sayfa"
          className="w-12 h-12 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-xl bg-amber-100 hover:bg-amber-200 transition-all"
        >
          ✨
        </Link>
      </div>

      {/* Clear confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-xl font-extrabold text-purple-800 mb-2">Emin misin?</h3>
            <p className="text-purple-500 font-semibold mb-6">Tüm boyaman silinecek!</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all min-h-[48px]"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  onClear();
                  setShowConfirm(false);
                }}
                className="px-6 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all min-h-[48px]"
              >
                Evet, Temizle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
