'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getArtworksForProfile, deleteArtwork, getActiveProfileId, getArtworks } from '@/lib/storage';
import type { Artwork } from '@/types/canvas';

export default function GaleriPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    const profileId = getActiveProfileId();
    if (profileId) {
      setArtworks(getArtworksForProfile(profileId));
    } else {
      setArtworks(getArtworks());
    }
  }, []);

  const handleDelete = (id: string) => {
    deleteArtwork(id);
    const profileId = getActiveProfileId();
    if (profileId) {
      setArtworks(getArtworksForProfile(profileId));
    } else {
      setArtworks(getArtworks());
    }
    setDeleteTarget(null);
    setSelectedArtwork(null);
  };

  const handleDownload = (artwork: Artwork) => {
    const link = document.createElement('a');
    link.download = `boyaai-${artwork.id}.png`;
    link.href = artwork.coloredDataUrl;
    link.click();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (artworks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-extrabold text-purple-800 mb-4">🖼️ Galeri</h1>
          <p className="text-purple-500 font-semibold mb-10">Boyadığın resimler burada görünecek!</p>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-purple-100">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-extrabold text-purple-700 mb-2">Henüz eserin yok!</h2>
            <p className="text-purple-400 font-semibold mb-6">Hadi bir tane oluştur ve boyamaya başla!</p>
            <Link
              href="/olustur"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-lg shadow-xl hover:scale-105 transition-all"
            >
              ✨ Hadi Başlayalım!
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-extrabold text-purple-800 mb-2">🖼️ Galeri</h1>
        <p className="text-purple-500 font-semibold">{artworks.length} eser</p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {artworks.map((artwork, i) => (
          <motion.div
            key={artwork.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="group"
          >
            <button
              onClick={() => {
                if (artwork.status === 'in-progress') {
                  window.location.href = `/boya?artworkId=${artwork.id}`;
                } else {
                  setSelectedArtwork(artwork);
                }
              }}
              className="w-full bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-purple-100 hover:shadow-xl hover:scale-[1.02] hover:border-purple-300 transition-all text-left"
            >
              {/* Preview */}
              <div className="relative aspect-square bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artwork.coloredDataUrl}
                  alt={artwork.prompt}
                  className="w-full h-full object-contain p-2"
                />
                {/* Status badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                  artwork.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {artwork.status === 'completed' ? '✅ Bitti' : '🖌️ Devam'}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-purple-800 truncate flex-1">{artwork.prompt}</p>
                  {artwork.stars && (
                    <span className="text-xs flex-shrink-0">{'⭐'.repeat(artwork.stars)}</span>
                  )}
                </div>
                <p className="text-xs text-purple-400 mt-1">{formatDate(artwork.createdAt)}</p>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedArtwork && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedArtwork(null)}
          >
            <motion.div
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full"
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border-4 border-purple-200 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedArtwork.coloredDataUrl}
                  alt={selectedArtwork.prompt}
                  className="w-full h-full object-contain p-2"
                />
              </div>

              <h3 className="text-lg font-extrabold text-purple-800 mb-1">{selectedArtwork.prompt}</h3>
              <p className="text-sm text-purple-400 mb-4">{formatDate(selectedArtwork.createdAt)}</p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleDownload(selectedArtwork)}
                  className="px-5 py-2.5 rounded-2xl bg-green-100 text-green-700 font-bold hover:bg-green-200 transition-all min-h-[44px] flex items-center gap-1"
                >
                  📥 PNG İndir
                </button>
                <button
                  onClick={() => setDeleteTarget(selectedArtwork.id)}
                  className="px-5 py-2.5 rounded-2xl bg-red-100 text-red-600 font-bold hover:bg-red-200 transition-all min-h-[44px] flex items-center gap-1"
                >
                  🗑️ Sil
                </button>
                <button
                  onClick={() => setSelectedArtwork(null)}
                  className="ml-auto px-5 py-2.5 rounded-2xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all min-h-[44px]"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <div className="text-5xl mb-4">🗑️</div>
              <h3 className="text-xl font-extrabold text-purple-800 mb-2">Eseri silmek istediğine emin misin?</h3>
              <p className="text-purple-500 font-semibold mb-6 text-sm">Bu işlem geri alınamaz!</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all min-h-[48px]"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  className="px-6 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all min-h-[48px]"
                >
                  Evet, Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
