'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getArtworksForProfile, getActiveProfileId, getArtworks } from '@/lib/storage';
import type { Artwork } from '@/types/canvas';

export function RecentArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    const profileId = getActiveProfileId();
    const all = profileId ? getArtworksForProfile(profileId) : getArtworks();
    setArtworks(all.slice(0, 3));
  }, []);

  if (artworks.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4 text-purple-800">
          Son Eserlerin 🎨
        </h2>
        <p className="text-center text-purple-500 mb-10 font-semibold">
          En son boyadığın resimler
        </p>

        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
          {artworks.map((artwork, i) => (
            <motion.div
              key={artwork.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={artwork.status === 'in-progress'
                  ? `/boya?artworkId=${artwork.id}`
                  : '/galeri'
                }
                className="block bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-purple-100 hover:shadow-xl hover:scale-105 transition-all"
              >
                <div className="relative aspect-square bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artwork.coloredDataUrl}
                    alt={artwork.prompt}
                    className="w-full h-full object-contain p-2"
                  />
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    artwork.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {artwork.status === 'completed' ? '✅' : '🖌️'}
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-purple-800 truncate">{artwork.prompt}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/galeri"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/80 border-2 border-purple-200 text-purple-600 font-bold hover:bg-purple-50 hover:scale-105 transition-all"
          >
            🖼️ Tümünü Gör
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
