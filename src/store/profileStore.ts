import { create } from 'zustand';
import type { ChildProfile } from '@/types/canvas';
import { getActiveProfile } from '@/lib/storage';

interface ProfileStore {
  profile: ChildProfile | null;
  isLoaded: boolean;
  loadProfile: () => void;
  setProfile: (profile: ChildProfile | null) => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  isLoaded: false,
  loadProfile: () => {
    const profile = getActiveProfile();
    set({ profile, isLoaded: true });
  },
  setProfile: (profile) => set({ profile }),
}));
