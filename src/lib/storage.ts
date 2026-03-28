import type { Artwork, ChildProfile, ParentSettings } from '@/types/canvas';

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

// --- Child Profiles ---
const PROFILES_KEY = 'boyaai-profiles';
const ACTIVE_PROFILE_KEY = 'boyaai-active-profile';
const PARENT_SETTINGS_KEY = 'boyaai-parent-settings';

export function getProfiles(): ChildProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PROFILES_KEY);
    if (!data) return [];
    return JSON.parse(data) as ChildProfile[];
  } catch {
    return [];
  }
}

export function getProfile(id: string): ChildProfile | null {
  return getProfiles().find((p) => p.id === id) || null;
}

export function saveProfile(profile: Omit<ChildProfile, 'id' | 'createdAt'>): ChildProfile {
  const profiles = getProfiles();
  const newProfile: ChildProfile = {
    ...profile,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  profiles.push(newProfile);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  return newProfile;
}

export function deleteProfile(id: string): boolean {
  const profiles = getProfiles().filter((p) => p.id !== id);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  // Also delete artworks for this profile
  const artworks = getArtworks().filter((a) => a.profileId !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(artworks));
  if (getActiveProfileId() === id) {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
  return true;
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

export function getActiveProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function getActiveProfile(): ChildProfile | null {
  const id = getActiveProfileId();
  if (!id) return null;
  return getProfile(id);
}

export function getArtworksForProfile(profileId: string): Artwork[] {
  return getArtworks().filter((a) => a.profileId === profileId);
}

// --- Parent Settings ---
const DEFAULT_SETTINGS: ParentSettings = { pin: '1234', dailyLimit: 3 };

export function getParentSettings(): ParentSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(PARENT_SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    return JSON.parse(data) as ParentSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveParentSettings(settings: ParentSettings): void {
  localStorage.setItem(PARENT_SETTINGS_KEY, JSON.stringify(settings));
}

export function verifyPin(pin: string): boolean {
  return getParentSettings().pin === pin;
}

export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROFILES_KEY);
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
  localStorage.removeItem(PARENT_SETTINGS_KEY);
}

// --- Daily Usage Counter ---
const DAILY_USAGE_KEY = 'boyaai-daily-usage';

interface DailyUsage {
  profileId: string;
  date: string; // YYYY-MM-DD
  count: number;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDailyUsageData(): DailyUsage[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(DAILY_USAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as DailyUsage[];
  } catch {
    return [];
  }
}

export function getDailyUsageCount(profileId: string): number {
  const today = getTodayString();
  const usages = getDailyUsageData();
  const entry = usages.find((u) => u.profileId === profileId && u.date === today);
  return entry?.count || 0;
}

export function incrementDailyUsage(profileId: string): number {
  const today = getTodayString();
  const usages = getDailyUsageData();
  const index = usages.findIndex((u) => u.profileId === profileId && u.date === today);

  if (index >= 0) {
    usages[index].count += 1;
  } else {
    usages.push({ profileId, date: today, count: 1 });
  }

  // Clean up old entries (keep only today)
  const cleaned = usages.filter((u) => u.date === today);
  localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify(cleaned));

  return index >= 0 ? usages[index].count : 1;
}

export function getDailyLimit(): number {
  return getParentSettings().dailyLimit;
}

export function getRemainingGenerations(profileId: string): number {
  const limit = getDailyLimit();
  const used = getDailyUsageCount(profileId);
  return Math.max(0, limit - used);
}
