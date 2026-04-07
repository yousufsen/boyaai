'use client';

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/constants/limits';

export type DrawTool = 'brush' | 'eraser' | 'fill' | 'line';
export type BgPattern = 'plain' | 'grid' | 'dots' | 'lines';

export interface DrawingCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  toDataURL: () => string | null;
}

interface DrawingCanvasProps {
  activeTool: DrawTool;
  activeColor: string;
  brushSize: number;
  bgPattern: BgPattern;
  onStrokeEnd: () => void;
}

function drawBgPattern(ctx: CanvasRenderingContext2D, pattern: BgPattern) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (pattern === 'grid') {
    ctx.strokeStyle = '#E8E8E8';
    ctx.lineWidth = 0.8;
    for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }
  } else if (pattern === 'dots') {
    ctx.fillStyle = '#D4D4D4';
    for (let x = 20; x < CANVAS_WIDTH; x += 40) {
      for (let y = 20; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (pattern === 'lines') {
    ctx.strokeStyle = '#E8E8E8';
    ctx.lineWidth = 0.8;
    for (let y = 40; y <= CANVAS_HEIGHT; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }
  }
}

/**
 * Flood fill for drawing canvas.
 * Outline detection uses a SEPARATE strokeData (only brush strokes, not fills).
 * This prevents black-filled areas from acting as boundaries.
 */
function drawingFloodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillHex: string,
  strokeData: Uint8ClampedArray
): number {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const x0 = Math.floor(startX), y0 = Math.floor(startY);
  if (x0 < 0 || x0 >= w || y0 < 0 || y0 >= h) return 0;

  const si = (y0 * w + x0) * 4;

  // Check outline from STROKE canvas (not the painted canvas)
  if (strokeData[si] + strokeData[si + 1] + strokeData[si + 2] < 200) return 0;

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fillHex);
  if (!result) return 0;
  const fR = parseInt(result[1], 16), fG = parseInt(result[2], 16), fB = parseInt(result[3], 16);

  // Already this color?
  if (Math.abs(data[si] - fR) < 5 && Math.abs(data[si + 1] - fG) < 5 && Math.abs(data[si + 2] - fB) < 5) return 0;

  let changed = 0;
  const visited = new Uint8Array(w * h);
  const stack = [x0, y0];

  while (stack.length > 0) {
    const cy = stack.pop()!, cx = stack.pop()!;
    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
    const pos = cy * w + cx;
    if (visited[pos]) continue;
    visited[pos] = 1;
    const idx = pos * 4;
    // Boundary check from STROKE canvas only (brush strokes = walls, fills = passable)
    if (strokeData[idx] + strokeData[idx + 1] + strokeData[idx + 2] < 200) continue;
    // Paint this pixel (no color matching — fill everything in the enclosed area)
    data[idx] = fR; data[idx + 1] = fG; data[idx + 2] = fB; data[idx + 3] = 255;
    changed++;
    stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
    if (changed > 5000000) break;
  }
  if (changed > 0) ctx.putImageData(imgData, 0, 0);
  return changed;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas({ activeTool, activeColor, brushSize, bgPattern, onStrokeEnd }, ref) {
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);
    const strokeCanvasRef = useRef<HTMLCanvasElement>(null); // Hidden: tracks only brush strokes for fill boundaries
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const lineStart = useRef<{ x: number; y: number } | null>(null);
    const snapshotBeforeLine = useRef<ImageData | null>(null);

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isPanningMouse = useRef(false);
    const panStartPos = useRef({ x: 0, y: 0 });
    const [isPanningState, setIsPanningState] = useState(false);

    const snapshotsRef = useRef<ImageData[]>([]);
    const redoStackRef = useRef<ImageData[]>([]);
    const strokeSnapshotsRef = useRef<ImageData[]>([]);
    const strokeRedoStackRef = useRef<ImageData[]>([]);

    // Check if a hex color is "dark" (would act as fill boundary)
    const isDarkColor = useCallback((hex: string): boolean => {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!m) return true;
      return parseInt(m[1], 16) + parseInt(m[2], 16) + parseInt(m[3], 16) < 200;
    }, []);

    useImperativeHandle(ref, () => ({
      getCanvas: () => drawCanvasRef.current,
      toDataURL: () => {
        const bg = bgCanvasRef.current;
        const draw = drawCanvasRef.current;
        if (!bg || !draw) return null;
        const merged = document.createElement('canvas');
        merged.width = CANVAS_WIDTH; merged.height = CANVAS_HEIGHT;
        const ctx = merged.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(bg, 0, 0);
        ctx.drawImage(draw, 0, 0);
        return merged.toDataURL('image/png');
      },
    }));

    useEffect(() => {
      const ctx = bgCanvasRef.current?.getContext('2d');
      if (ctx) drawBgPattern(ctx, bgPattern);
    }, [bgPattern]);

    useEffect(() => {
      const ctx = drawCanvasRef.current?.getContext('2d');
      const sCtx = strokeCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      snapshotsRef.current = [ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)];
      redoStackRef.current = [];
      if (sCtx) {
        sCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Fill stroke canvas white (non-dark = passable)
        sCtx.fillStyle = '#FFFFFF';
        sCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        strokeSnapshotsRef.current = [sCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)];
        strokeRedoStackRef.current = [];
      }
    }, []);

    const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      const canvas = drawCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      let cx: number, cy: number;
      if ('touches' in e) {
        if (e.touches.length === 0) return null;
        cx = e.touches[0].clientX; cy = e.touches[0].clientY;
      } else { cx = e.clientX; cy = e.clientY; }
      return { x: (cx - rect.left) * (CANVAS_WIDTH / rect.width), y: (cy - rect.top) * (CANVAS_HEIGHT / rect.height) };
    }, []);

    const saveSnapshot = useCallback(() => {
      const ctx = drawCanvasRef.current?.getContext('2d');
      const sCtx = strokeCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      snapshotsRef.current.push(ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
      if (snapshotsRef.current.length > 51) snapshotsRef.current.shift();
      redoStackRef.current = [];
      if (sCtx) {
        strokeSnapshotsRef.current.push(sCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
        if (strokeSnapshotsRef.current.length > 51) strokeSnapshotsRef.current.shift();
        strokeRedoStackRef.current = [];
      }
      onStrokeEnd();
    }, [onStrokeEnd]);

    const undo = useCallback(() => {
      const ctx = drawCanvasRef.current?.getContext('2d');
      const sCtx = strokeCanvasRef.current?.getContext('2d');
      if (!ctx || snapshotsRef.current.length <= 1) return;
      redoStackRef.current.push(snapshotsRef.current.pop()!);
      ctx.putImageData(snapshotsRef.current[snapshotsRef.current.length - 1], 0, 0);
      if (sCtx && strokeSnapshotsRef.current.length > 1) {
        strokeRedoStackRef.current.push(strokeSnapshotsRef.current.pop()!);
        sCtx.putImageData(strokeSnapshotsRef.current[strokeSnapshotsRef.current.length - 1], 0, 0);
      }
    }, []);

    const redo = useCallback(() => {
      const ctx = drawCanvasRef.current?.getContext('2d');
      const sCtx = strokeCanvasRef.current?.getContext('2d');
      if (!ctx || redoStackRef.current.length === 0) return;
      const s = redoStackRef.current.pop()!;
      snapshotsRef.current.push(s);
      ctx.putImageData(s, 0, 0);
      if (sCtx && strokeRedoStackRef.current.length > 0) {
        const ss = strokeRedoStackRef.current.pop()!;
        strokeSnapshotsRef.current.push(ss);
        sCtx.putImageData(ss, 0, 0);
      }
    }, []);

    const clearCanvas = useCallback(() => {
      const ctx = drawCanvasRef.current?.getContext('2d');
      const sCtx = strokeCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (sCtx) {
        sCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        sCtx.fillStyle = '#FFFFFF';
        sCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      saveSnapshot();
    }, [saveSnapshot]);

    useEffect(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__drawingUndo = undo; w.__drawingRedo = redo; w.__drawingClear = clearCanvas;
      w.__drawingCanUndo = () => snapshotsRef.current.length > 1;
      w.__drawingCanRedo = () => redoStackRef.current.length > 0;
    }, [undo, redo, clearCanvas]);

    const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if ('button' in e && e.button === 1) return;
      const point = getCanvasPoint(e);
      if (!point) return;
      const ctx = drawCanvasRef.current?.getContext('2d');
      if (!ctx) return;

      if (activeTool === 'fill') {
        const sCtx = strokeCanvasRef.current?.getContext('2d');
        if (!sCtx || !bgCanvasRef.current) return;

        // Merge bg + draw for fill target
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = CANVAS_WIDTH; tempCanvas.height = CANVAS_HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        tempCtx.drawImage(bgCanvasRef.current, 0, 0);
        tempCtx.drawImage(drawCanvasRef.current!, 0, 0);

        const before = new Uint8ClampedArray(tempCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data);

        // Use STROKE canvas for boundary detection (only brush strokes, not fills)
        const strokeImgData = sCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const changed = drawingFloodFill(tempCtx, point.x, point.y, activeColor, strokeImgData.data);
        if (changed === 0) return;

        const after = tempCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const drawData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        for (let i = 0; i < after.data.length; i += 4) {
          if (after.data[i] !== before[i] || after.data[i + 1] !== before[i + 1] || after.data[i + 2] !== before[i + 2]) {
            drawData.data[i] = after.data[i]; drawData.data[i + 1] = after.data[i + 1];
            drawData.data[i + 2] = after.data[i + 2]; drawData.data[i + 3] = 255;
          }
        }
        ctx.putImageData(drawData, 0, 0);
        // NOTE: fill does NOT write to stroke canvas (fills are not boundaries)
        saveSnapshot();
        return;
      }

      if (activeTool === 'line') {
        lineStart.current = point;
        snapshotBeforeLine.current = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        return;
      }

      isDrawing.current = true;
      lastPoint.current = point;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = brushSize;
      ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = activeTool === 'eraser' ? 'rgba(0,0,0,1)' : activeColor;
      ctx.fillStyle = activeTool === 'eraser' ? 'rgba(0,0,0,1)' : activeColor;
      ctx.beginPath(); ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2); ctx.fill();

      // Mirror dark brush strokes to stroke canvas (for fill boundary detection)
      const sCtx = strokeCanvasRef.current?.getContext('2d');
      if (sCtx) {
        if (activeTool === 'eraser') {
          // Eraser: clear from stroke canvas too (white = passable)
          sCtx.fillStyle = '#FFFFFF';
          sCtx.beginPath(); sCtx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2); sCtx.fill();
        } else if (isDarkColor(activeColor)) {
          sCtx.lineCap = 'round'; sCtx.lineJoin = 'round'; sCtx.lineWidth = brushSize;
          sCtx.strokeStyle = activeColor; sCtx.fillStyle = activeColor;
          sCtx.beginPath(); sCtx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2); sCtx.fill();
        }
      }
    }, [getCanvasPoint, activeTool, activeColor, brushSize, saveSnapshot]);

    const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const point = getCanvasPoint(e);
      if (!point) return;
      const ctx = drawCanvasRef.current?.getContext('2d');
      if (!ctx) return;

      if (activeTool === 'line' && lineStart.current && snapshotBeforeLine.current) {
        ctx.putImageData(snapshotBeforeLine.current, 0, 0);
        ctx.strokeStyle = activeColor; ctx.lineWidth = brushSize; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(lineStart.current.x, lineStart.current.y); ctx.lineTo(point.x, point.y); ctx.stroke();
        return;
      }

      if (!isDrawing.current || !lastPoint.current) return;
      ctx.beginPath(); ctx.moveTo(lastPoint.current.x, lastPoint.current.y); ctx.lineTo(point.x, point.y); ctx.stroke();

      // Mirror to stroke canvas
      const sCtx = strokeCanvasRef.current?.getContext('2d');
      if (sCtx) {
        if (activeTool === 'eraser') {
          sCtx.globalCompositeOperation = 'source-over';
          sCtx.strokeStyle = '#FFFFFF'; sCtx.lineCap = 'round'; sCtx.lineJoin = 'round'; sCtx.lineWidth = brushSize;
          sCtx.beginPath(); sCtx.moveTo(lastPoint.current.x, lastPoint.current.y); sCtx.lineTo(point.x, point.y); sCtx.stroke();
        } else if (isDarkColor(activeColor)) {
          sCtx.globalCompositeOperation = 'source-over';
          sCtx.strokeStyle = activeColor; sCtx.lineCap = 'round'; sCtx.lineJoin = 'round'; sCtx.lineWidth = brushSize;
          sCtx.beginPath(); sCtx.moveTo(lastPoint.current.x, lastPoint.current.y); sCtx.lineTo(point.x, point.y); sCtx.stroke();
        }
      }

      lastPoint.current = point;
    }, [getCanvasPoint, activeTool, activeColor, brushSize]);

    const handlePointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const ctx = drawCanvasRef.current?.getContext('2d');

      if (activeTool === 'line' && lineStart.current && snapshotBeforeLine.current && ctx) {
        const point = getCanvasPoint(e);
        if (point) {
          ctx.putImageData(snapshotBeforeLine.current, 0, 0);
          ctx.strokeStyle = activeColor; ctx.lineWidth = brushSize; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(lineStart.current.x, lineStart.current.y); ctx.lineTo(point.x, point.y); ctx.stroke();

          // Mirror dark lines to stroke canvas
          if (isDarkColor(activeColor)) {
            const sCtx = strokeCanvasRef.current?.getContext('2d');
            if (sCtx) {
              sCtx.strokeStyle = activeColor; sCtx.lineWidth = brushSize; sCtx.lineCap = 'round';
              sCtx.beginPath(); sCtx.moveTo(lineStart.current.x, lineStart.current.y); sCtx.lineTo(point.x, point.y); sCtx.stroke();
            }
          }
        }
        lineStart.current = null; snapshotBeforeLine.current = null;
        saveSnapshot(); return;
      }

      if (!isDrawing.current) return;
      isDrawing.current = false; lastPoint.current = null;
      if (ctx) ctx.globalCompositeOperation = 'source-over';
      saveSnapshot();
    }, [activeTool, getCanvasPoint, activeColor, brushSize, saveSnapshot]);

    const handleWheel = useCallback((e: React.WheelEvent) => { e.preventDefault(); setZoom((z) => Math.min(3, Math.max(1, z * (e.deltaY > 0 ? 0.9 : 1.1)))); }, []);
    const handleDoubleClick = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
    useEffect(() => { if (zoom <= 1) setPan({ x: 0, y: 0 }); }, [zoom]);

    const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
      if (e.button === 1 && zoom > 1) { e.preventDefault(); isPanningMouse.current = true; setIsPanningState(true); panStartPos.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; }
    }, [pan, zoom]);
    const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
      if (isPanningMouse.current && e.buttons === 4) {
        const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return;
        const mx = (rect.width * zoom - rect.width) / 2, my = (rect.height * zoom - rect.height) / 2;
        setPan({ x: Math.max(-mx, Math.min(mx, e.clientX - panStartPos.current.x)), y: Math.max(-my, Math.min(my, e.clientY - panStartPos.current.y)) });
      }
    }, [zoom]);
    const handleContainerMouseUp = useCallback(() => { isPanningMouse.current = false; setIsPanningState(false); }, []);

    const getCursor = () => {
      if (isPanningState) return 'grabbing';
      if (activeTool === 'fill') return 'cell';
      return 'crosshair';
    };

    return (
      <div className="relative">
        <div className="absolute top-2 right-2 z-40 flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="w-8 h-8 rounded-lg bg-white/80 text-purple-700 font-bold text-sm shadow hover:bg-white">+</button>
          <span className="px-2 py-1 rounded-lg bg-white/80 text-purple-600 font-bold text-xs shadow min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.25))} className="w-8 h-8 rounded-lg bg-white/80 text-purple-700 font-bold text-sm shadow hover:bg-white">−</button>
        </div>

        <div ref={containerRef}
          className="relative w-full aspect-square max-h-[calc(100vh-12rem)] bg-gray-100 rounded-2xl shadow-xl overflow-hidden border-4 border-purple-200"
          onWheel={handleWheel} onDoubleClick={handleDoubleClick}
          onMouseDown={handleContainerMouseDown} onMouseMove={handleContainerMouseMove} onMouseUp={handleContainerMouseUp}
          style={{ touchAction: 'none', cursor: isPanningState ? 'grabbing' : undefined }}>
          {/* Hidden stroke canvas for fill boundary detection */}
          <canvas ref={strokeCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="hidden" />

          <div style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transformOrigin: 'center', width: '100%', height: '100%', position: 'relative' }}>
            <canvas ref={bgCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute inset-0 w-full h-full" />
            <canvas ref={drawCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
              className="absolute inset-0 w-full h-full" style={{ cursor: getCursor() }}
              onMouseDown={handlePointerDown} onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
              onAuxClick={(e) => e.preventDefault()} />
          </div>
        </div>
      </div>
    );
  }
);
