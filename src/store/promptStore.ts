import { create } from 'zustand';

export type GenerationStatus = 'idle' | 'recording' | 'generating' | 'done' | 'error';

interface PromptStore {
  prompt: string;
  status: GenerationStatus;
  imageUrl: string | null;
  error: string | null;
  dailyCount: number;

  setPrompt: (prompt: string) => void;
  setStatus: (status: GenerationStatus) => void;
  setImageUrl: (url: string) => void;
  setError: (error: string) => void;
  incrementDailyCount: () => void;
  reset: () => void;
}

export const usePromptStore = create<PromptStore>((set) => ({
  prompt: '',
  status: 'idle',
  imageUrl: null,
  error: null,
  dailyCount: 0,

  setPrompt: (prompt) => set({ prompt }),
  setStatus: (status) => set({ status }),
  setImageUrl: (url) => set({ imageUrl: url, status: 'done' }),
  setError: (error) => set({ error, status: 'error' }),
  incrementDailyCount: () => set((state) => ({ dailyCount: state.dailyCount + 1 })),
  reset: () => set({ prompt: '', status: 'idle', imageUrl: null, error: null }),
}));
