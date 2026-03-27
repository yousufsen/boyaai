export interface Point {
  x: number;
  y: number;
}

export interface BrushStroke {
  points: Point[];
  color: string;
  size: number;
  tool: 'brush' | 'eraser';
}

export interface FillAction {
  point: Point;
  color: string;
  tool: 'fill';
}

export type CanvasAction = BrushStroke | FillAction;

export interface CanvasState {
  actions: CanvasAction[];
  undoneActions: CanvasAction[];
  activeColor: string;
  activeTool: 'brush' | 'fill' | 'eraser';
  brushSize: number;
  imageUrl: string | null;
}

export type ArtworkStatus = 'completed' | 'in-progress';

export interface Artwork {
  id: string;
  prompt: string;
  originalImageUrl: string;
  coloredDataUrl: string;
  drawingDataUrl?: string; // drawing layer only, for resuming
  createdAt: string;
  status: ArtworkStatus;
}

export interface GenerateResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}
