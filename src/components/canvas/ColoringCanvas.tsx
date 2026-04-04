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
  getOutlineCanvas: () => HTMLCanvasElement | null;
}

/**
 * 3-layer canvas stack (bottom to top):
 *   1. bgCanvasRef      — solid white background (never changes)
 *   2. drawCanvasRef    — user's painting (brush strokes, fill colors)
 *   3. outlineCanvasRef — black outlines only (transparent white, pointer-events: none)
 *
 * The user interacts with drawCanvas. Outlines always render on top so they
 * are never covered by paint. The brush needs NO outline-avoidance logic.
 */
export const ColoringCanvas = forwardRef<ColoringCanvasHandle, ColoringCanvasProps>(
  function ColoringCanvas({ imageUrl, initialDrawingDataUrl }, ref) {
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);
    const outlineCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Keep a copy of the original background ImageData for flood-fill outline detection
    const bgImageDataRef = useRef<ImageData | null>(null);

    useImperativeHandle(ref, () => ({
      getBgCanvas: () => bgCanvasRef.current,
      getDrawCanvas: () => drawCanvasRef.current,
      getOutlineCanvas: () => outlineCanvasRef.current,
    }));

    const isDrawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const snapshotsRef = useRef<ImageData[]>([]);
    const redoStackRef = useRef<ImageData[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [loadError, setLoadError] = useState(false);

    // Zoom state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const lastPinchDist = useRef<number | null>(null);

    const { activeTool, activeColor, brushSize, addAction, actions, undoneActions } = useCanvasStore();

    // ── Load image: populate bgCanvas (white+image) and outlineCanvas (outlines only) ──
    useEffect(() => {
      const bgCanvas = bgCanvasRef.current;
      const outlineCanvas = outlineCanvasRef.current;
      if (!bgCanvas || !outlineCanvas) return;
      const bgCtx = bgCanvas.getContext('2d');
      const olCtx = outlineCanvas.getContext('2d');
      if (!bgCtx || !olCtx) return;

      setLoadError(false);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw full image on bg canvas (white background)
        bgCtx.fillStyle = '#FFFFFF';
        bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const ix = (CANVAS_WIDTH - w) / 2;
        const iy = (CANVAS_HEIGHT - h) / 2;
        bgCtx.drawImage(img, ix, iy, w, h);

        // Cache bg ImageData for flood-fill outline detection
        bgImageDataRef.current = bgCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Build outline canvas: copy only dark pixels, make everything else transparent
        olCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const src = bgImageDataRef.current;
        const outlineImgData = olCtx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
        const sd = src.data;
        const od = outlineImgData.data;
        for (let i = 0; i < sd.length; i += 4) {
          if (sd[i] < 60 && sd[i + 1] < 60 && sd[i + 2] < 60) {
            // Dark pixel → keep as black, fully opaque
            od[i] = 0;
            od[i + 1] = 0;
            od[i + 2] = 0;
            od[i + 3] = 255;
          }
          // else: leave as transparent (0,0,0,0)
        }
        olCtx.putImageData(outlineImgData, 0, 0);

        setIsReady(true);
      };
      img.onerror = () => setLoadError(true);
      img.src = imageUrl;
    }, [imageUrl]);

    // ── Initialize drawing canvas ──
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

    // ── Coordinate helpers ──
    const getCanvasPoint = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
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
      },
      []
    );

    const drawLine = useCallback(
      (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) => {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      },
      []
    );

    // ── Snapshot / Undo / Redo ──
    const saveSnapshot = useCallback(() => {
      const ctx = drawCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      const snapshot = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      snapshotsRef.current.push(snapshot);
      if (snapshotsRef.current.length > 51) snapshotsRef.current.shift();
      redoStackRef.current = [];
      addAction({ points: [], color: activeColor, size: brushSize, tool: activeTool === 'eraser' ? 'eraser' : 'brush' });
    }, [addAction, activeColor, brushSize, activeTool]);

    useEffect(() => {
      const ctx = drawCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      if (actions.length < snapshotsRef.current.length - 1) {
        const removed = snapshotsRef.current.pop();
        if (removed) redoStackRef.current.push(removed);
        const prev = snapshotsRef.current[snapshotsRef.current.length - 1];
        if (prev) ctx.putImageData(prev, 0, 0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actions.length]);

    useEffect(() => {
      const ctx = drawCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      if (undoneActions.length < redoStackRef.current.length) {
        const snapshot = redoStackRef.current.pop();
        if (snapshot) {
          snapshotsRef.current.push(snapshot);
          ctx.putImageData(snapshot, 0, 0);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [undoneActions.length]);

    // ── Fill tool ──
    const handleFill = useCallback(
      (point: { x: number; y: number }) => {
        const bgCanvas = bgCanvasRef.current;
        const drawCanvas = drawCanvasRef.current;
        if (!bgCanvas || !drawCanvas || !bgImageDataRef.current) return;

        const drawCtx = drawCanvas.getContext('2d');
        if (!drawCtx) return;

        // Create a merged view: white bg + draw layer
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = CANVAS_WIDTH;
        tempCanvas.height = CANVAS_HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        tempCtx.drawImage(drawCanvas, 0, 0);

        // Snapshot before fill
        const beforeData = tempCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const beforeCopy = new Uint8ClampedArray(beforeData.data);

        // Flood fill on merged canvas, outline detection from ORIGINAL background
        const changed = floodFill(tempCtx, point.x, point.y, activeColor, bgImageDataRef.current);
        if (changed === 0) return;

        // Extract changed pixels into draw layer
        const afterData = tempCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const drawData = drawCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        for (let i = 0; i < afterData.data.length; i += 4) {
          if (
            afterData.data[i] !== beforeCopy[i] ||
            afterData.data[i + 1] !== beforeCopy[i + 1] ||
            afterData.data[i + 2] !== beforeCopy[i + 2]
          ) {
            drawData.data[i] = afterData.data[i];
            drawData.data[i + 1] = afterData.data[i + 1];
            drawData.data[i + 2] = afterData.data[i + 2];
            drawData.data[i + 3] = 255;
          }
        }

        drawCtx.putImageData(drawData, 0, 0);
        saveSnapshot();
      },
      [activeColor, saveSnapshot]
    );

    // ── Pointer handlers (brush / eraser — NO outline avoidance needed) ──
    const handlePointerDown = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();

        // Middle mouse button → pan only, no painting
        if ('button' in e && e.button === 1) return;

        // Pinch-to-zoom detection
        if ('touches' in e && e.touches.length === 2) {
          isPanning.current = true;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
          return;
        }

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
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = '#FFFFFF';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = activeColor;
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = activeTool === 'eraser' ? '#FFFFFF' : activeColor;
        ctx.fill();
      },
      [getCanvasPoint, activeTool, activeColor, brushSize, handleFill]
    );

    const handlePointerMove = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();

        // Pinch zoom
        if ('touches' in e && e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (lastPinchDist.current !== null) {
            const scale = dist / lastPinchDist.current;
            setZoom((z) => Math.min(3, Math.max(1, z * scale)));
          }
          lastPinchDist.current = dist;
          return;
        }

        if (!isDrawing.current || !lastPoint.current) return;
        const point = getCanvasPoint(e);
        if (!point) return;

        const ctx = drawCanvasRef.current?.getContext('2d');
        if (!ctx) return;

        drawLine(ctx, lastPoint.current, point);
        lastPoint.current = point;
      },
      [getCanvasPoint, drawLine]
    );

    const handlePointerUp = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();

        if ('touches' in e && e.touches.length < 2) {
          isPanning.current = false;
          lastPinchDist.current = null;
        }

        if (!isDrawing.current) return;
        isDrawing.current = false;
        lastPoint.current = null;

        const ctx = drawCanvasRef.current?.getContext('2d');
        if (ctx) ctx.globalCompositeOperation = 'source-over';

        saveSnapshot();
      },
      [saveSnapshot]
    );

    // ── Zoom with scroll wheel ──
    const handleWheel = useCallback((e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.min(3, Math.max(1, z * delta)));
    }, []);

    // ── Double-click to reset zoom ──
    const handleDoubleClick = useCallback(() => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }, []);

    // ── Re-clamp pan whenever zoom changes ──
    useEffect(() => {
      setPan((p) => {
        if (zoom <= 1) return { x: 0, y: 0 };
        const container = containerRef.current;
        if (!container) return p;
        const rect = container.getBoundingClientRect();
        const maxX = (rect.width * zoom - rect.width) / 2;
        const maxY = (rect.height * zoom - rect.height) / 2;
        return {
          x: Math.max(-maxX, Math.min(maxX, p.x)),
          y: Math.max(-maxY, Math.min(maxY, p.y)),
        };
      });
    }, [zoom]);

    // ── Clamp pan within bounds so canvas edges never leave the container ──
    const clampPan = useCallback(
      (rawX: number, rawY: number, z: number): { x: number; y: number } => {
        if (z <= 1) return { x: 0, y: 0 };
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0 };
        const rect = container.getBoundingClientRect();
        const maxX = (rect.width * z - rect.width) / 2;
        const maxY = (rect.height * z - rect.height) / 2;
        return {
          x: Math.max(-maxX, Math.min(maxX, rawX)),
          y: Math.max(-maxY, Math.min(maxY, rawY)),
        };
      },
      []
    );

    // ── Middle-mouse pan (only when zoomed in) ──
    const [isPanningState, setIsPanningState] = useState(false);

    const handleContainerMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 1 && zoom > 1) {
          e.preventDefault();
          isPanning.current = true;
          setIsPanningState(true);
          panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        }
      },
      [pan, zoom]
    );

    const handleContainerMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (isPanning.current && e.buttons === 4) {
          const raw = { x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y };
          setPan(clampPan(raw.x, raw.y, zoom));
        }
      },
      [clampPan, zoom]
    );

    const handleContainerMouseUp = useCallback(() => {
      isPanning.current = false;
      setIsPanningState(false);
    }, []);

    // ── Clear drawing canvas ──
    useEffect(() => {
      const ctx = drawCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      if (actions.length === 0 && snapshotsRef.current.length > 1) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        snapshotsRef.current = [ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)];
        redoStackRef.current = [];
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actions.length]);

    const getCursorStyle = () => {
      switch (activeTool) {
        case 'brush': return 'crosshair';
        case 'fill': return 'cell';
        case 'eraser': return 'crosshair';
        default: return 'crosshair';
      }
    };

    return (
      <div className="relative">
        {/* Zoom controls */}
        <div className="absolute top-2 right-2 z-40 flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="w-8 h-8 rounded-lg bg-white/80 text-purple-700 font-bold text-sm shadow hover:bg-white transition-all"
          >
            +
          </button>
          <span className="px-2 py-1 rounded-lg bg-white/80 text-purple-600 font-bold text-xs shadow min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            className="w-8 h-8 rounded-lg bg-white/80 text-purple-700 font-bold text-sm shadow hover:bg-white transition-all"
          >
            −
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative w-full aspect-square max-h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-purple-200"
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleContainerMouseDown}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          style={{
            touchAction: 'none',
            cursor: isPanningState ? 'grabbing' : undefined,
          }}
        >
          {!isReady && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
              <div className="text-center">
                <span className="text-4xl animate-bounce block mb-2">🎨</span>
                <p className="text-sm font-bold text-purple-400">Görsel yükleniyor...</p>
              </div>
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
              <div className="text-center p-6">
                <span className="text-4xl block mb-3">😢</span>
                <p className="text-lg font-bold text-purple-800 mb-1">Görsel yüklenemedi</p>
                <p className="text-sm text-purple-400">İnternet bağlantını kontrol edip tekrar dene</p>
              </div>
            </div>
          )}

          <div
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              width: '100%',
              height: '100%',
              position: 'relative',
            }}
          >
            {/* Layer 1 (bottom): white background */}
            <canvas
              ref={bgCanvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="absolute inset-0 w-full h-full"
            />

            {/* Layer 2 (middle): user painting */}
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
              onAuxClick={(e) => e.preventDefault()}
            />

            {/* Layer 3 (top): outlines only — transparent bg, black lines */}
            <canvas
              ref={outlineCanvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          </div>
        </div>
      </div>
    );
  }
);
