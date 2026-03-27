'use client';

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { floodFill } from '@/lib/canvas/floodFill';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/constants/limits';

interface ColoringCanvasProps {
  imageUrl: string;
  initialDrawingDataUrl?: string | null;
}

export interface ColoringCanvasHandle {
  getBgCanvas: () => HTMLCanvasElement | null;
  getDrawCanvas: () => HTMLCanvasElement | null;
}

export const ColoringCanvas = forwardRef<ColoringCanvasHandle, ColoringCanvasProps>(function ColoringCanvas({ imageUrl, initialDrawingDataUrl }, ref) {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getBgCanvas: () => bgCanvasRef.current,
    getDrawCanvas: () => drawCanvasRef.current,
  }));
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const snapshotsRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [isReady, setIsReady] = useState(false);

  const { activeTool, activeColor, brushSize, addAction, actions, undoneActions } = useCanvasStore();

  // Load background image
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw image centered and scaled to fit
      const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (CANVAS_WIDTH - w) / 2;
      const y = (CANVAS_HEIGHT - h) / 2;
      ctx.drawImage(img, x, y, w, h);

      setIsReady(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Initialize drawing canvas (and restore if resuming)
  useEffect(() => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (initialDrawingDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        snapshotsRef.current = [ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)];
        redoStackRef.current = [];
      };
      img.src = initialDrawingDataUrl;
    } else {
      snapshotsRef.current = [ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)];
      redoStackRef.current = [];
    }
  }, [imageUrl, initialDrawingDataUrl]);

  // Get canvas-relative coordinates from mouse/touch event
  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Draw a line segment
  const drawLine = useCallback((ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  // Save snapshot for undo
  const saveSnapshot = useCallback(() => {
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    snapshotsRef.current.push(snapshot);
    // Keep max 51 snapshots (initial + 50 undos)
    if (snapshotsRef.current.length > 51) {
      snapshotsRef.current.shift();
    }
    redoStackRef.current = [];
    addAction({ points: [], color: activeColor, size: brushSize, tool: activeTool === 'eraser' ? 'eraser' : 'brush' });
  }, [addAction, activeColor, brushSize, activeTool]);

  // Handle undo from store
  useEffect(() => {
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Calculate expected snapshot index based on actions count
    const targetIndex = actions.length;
    if (targetIndex < snapshotsRef.current.length - 1) {
      // Undo happened
      const removed = snapshotsRef.current.pop();
      if (removed) {
        redoStackRef.current.push(removed);
      }
      const prev = snapshotsRef.current[snapshotsRef.current.length - 1];
      if (prev) {
        ctx.putImageData(prev, 0, 0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions.length]);

  // Handle redo from store
  useEffect(() => {
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (undoneActions.length < redoStackRef.current.length) {
      // A redo happened — restore the last redo snapshot
      const snapshot = redoStackRef.current.pop();
      if (snapshot) {
        snapshotsRef.current.push(snapshot);
        ctx.putImageData(snapshot, 0, 0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undoneActions.length]);

  // Handle fill tool
  const handleFill = useCallback((point: { x: number; y: number }) => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!bgCanvas || !drawCanvas) return;

    const bgCtx = bgCanvas.getContext('2d');
    const drawCtx = drawCanvas.getContext('2d');
    if (!bgCtx || !drawCtx) return;

    // Create a temporary merged canvas for flood fill
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_WIDTH;
    tempCanvas.height = CANVAS_HEIGHT;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Merge: bg first, then draw layer on top
    tempCtx.drawImage(bgCanvas, 0, 0);
    tempCtx.drawImage(drawCanvas, 0, 0);

    // Flood fill on temp canvas
    floodFill(tempCtx, point.x, point.y, activeColor);

    // Now extract only the filled pixels and put them on the draw layer
    // Strategy: compare temp with original merge to find changed pixels
    const originalData = bgCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const drawData = drawCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const filledData = tempCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = 0; i < filledData.data.length; i += 4) {
      const bgR = originalData.data[i], bgG = originalData.data[i+1], bgB = originalData.data[i+2];
      const fR = filledData.data[i], fG = filledData.data[i+1], fB = filledData.data[i+2];

      // If pixel changed from original bg+draw merge
      if (fR !== bgR || fG !== bgG || fB !== bgB) {
        // Check if it was already drawn (not from bg)
        const dA = drawData.data[i+3];
        if (dA > 0) {
          // Already had drawing, just update
          drawData.data[i] = fR;
          drawData.data[i+1] = fG;
          drawData.data[i+2] = fB;
          drawData.data[i+3] = 255;
        } else {
          drawData.data[i] = fR;
          drawData.data[i+1] = fG;
          drawData.data[i+2] = fB;
          drawData.data[i+3] = 255;
        }
      }
    }

    drawCtx.putImageData(drawData, 0, 0);
    saveSnapshot();
  }, [activeColor, saveSnapshot]);

  // Start drawing
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    if (activeTool === 'fill') {
      handleFill(point);
      return;
    }

    isDrawing.current = true;
    lastPoint.current = point;

    const ctx = drawCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activeColor;
    }

    // Draw a dot for single tap/click
    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = activeTool === 'eraser' ? 'rgba(0,0,0,1)' : activeColor;
    ctx.fill();
  }, [getCanvasPoint, activeTool, activeColor, brushSize, handleFill]);

  // Continue drawing
  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current || !lastPoint.current) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    const ctx = drawCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    drawLine(ctx, lastPoint.current, point);
    lastPoint.current = point;
  }, [getCanvasPoint, drawLine]);

  // End drawing
  const handlePointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPoint.current = null;

    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.globalCompositeOperation = 'source-over';
    }

    saveSnapshot();
  }, [saveSnapshot]);

  // Get cursor style based on tool
  const getCursorStyle = () => {
    switch (activeTool) {
      case 'brush': return 'crosshair';
      case 'fill': return 'cell';
      case 'eraser': return 'crosshair';
      default: return 'crosshair';
    }
  };

  // Clear drawing canvas
  useEffect(() => {
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (actions.length === 0 && snapshotsRef.current.length > 1) {
      // Canvas was cleared via store
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      snapshotsRef.current = [ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)];
      redoStackRef.current = [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions.length]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square max-h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-purple-200"
      style={{ touchAction: 'none' }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-30">
          <span className="text-4xl animate-bounce">🎨</span>
        </div>
      )}

      {/* Background canvas (coloring page image) */}
      <canvas
        ref={bgCanvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="absolute inset-0 w-full h-full"
      />

      {/* Drawing canvas (user paintings) */}
      <canvas
        ref={drawCanvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: getCursorStyle() }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
    </div>
  );
});
