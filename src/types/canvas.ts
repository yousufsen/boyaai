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

export interface Artwork {
  id: string;
  prompt: string;
  originalImageUrl: string;
  coloredDataUrl: string;
  createdAt: string;
}

export interface GenerateResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}
