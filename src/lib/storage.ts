import type { Artwork } from '@/types/canvas';

const STORAGE_KEY = 'boyaai-artworks';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function getArtworks(): Artwork[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Artwork[];
  } catch {
    return [];
  }
}

export function getArtwork(id: string): Artwork | null {
  const artworks = getArtworks();
  return artworks.find((a) => a.id === id) || null;
}

export function saveArtwork(artwork: Omit<Artwork, 'id' | 'createdAt'>): Artwork {
  const artworks = getArtworks();
  const newArtwork: Artwork = {
    ...artwork,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  artworks.unshift(newArtwork);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(artworks));
  return newArtwork;
}

export function updateArtwork(id: string, updates: Partial<Omit<Artwork, 'id' | 'createdAt'>>): Artwork | null {
  const artworks = getArtworks();
  const index = artworks.findIndex((a) => a.id === id);
  if (index === -1) return null;
  artworks[index] = { ...artworks[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(artworks));
  return artworks[index];
}

export function deleteArtwork(id: string): boolean {
  const artworks = getArtworks();
  const filtered = artworks.filter((a) => a.id !== id);
  if (filtered.length === artworks.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}
