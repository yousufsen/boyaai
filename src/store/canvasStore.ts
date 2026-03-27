import { create } from 'zustand';
import type { CanvasAction } from '@/types/canvas';
import { MAX_UNDO_STEPS } from '@/constants/limits';

interface CanvasStore {
  activeTool: 'brush' | 'fill' | 'eraser';
  activeColor: string;
  brushSize: number;
  actions: CanvasAction[];
  undoneActions: CanvasAction[];
  imageUrl: string | null;

  setTool: (tool: 'brush' | 'fill' | 'eraser') => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  addAction: (action: CanvasAction) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  setImageUrl: (url: string) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  activeTool: 'brush',
  activeColor: '#FF0000',
  brushSize: 8,
  actions: [],
  undoneActions: [],
  imageUrl: null,

  setTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ activeColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),

  addAction: (action) =>
    set((state) => ({
      actions: [...state.actions, action].slice(-MAX_UNDO_STEPS),
      undoneActions: [],
    })),

  undo: () =>
    set((state) => {
      if (state.actions.length === 0) return state;
      const last = state.actions[state.actions.length - 1];
      return {
        actions: state.actions.slice(0, -1),
        undoneActions: [...state.undoneActions, last],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.undoneActions.length === 0) return state;
      const last = state.undoneActions[state.undoneActions.length - 1];
      return {
        undoneActions: state.undoneActions.slice(0, -1),
        actions: [...state.actions, last],
      };
    }),

  clearCanvas: () => set({ actions: [], undoneActions: [] }),
  setImageUrl: (url) => set({ imageUrl: url }),
}));
