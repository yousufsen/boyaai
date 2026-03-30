import { FLOOD_FILL_TOLERANCE } from '@/constants/limits';

// Pixels with R+G+B < this are considered outline and cannot be painted
const DARK_THRESHOLD = 380;

function isDark(data: Uint8ClampedArray, idx: number): boolean {
  return data[idx] + data[idx + 1] + data[idx + 2] < DARK_THRESHOLD;
}

function colorsMatch(
  data: Uint8ClampedArray,
  idx: number,
  tr: number, tg: number, tb: number,
  tolerance: number
): boolean {
  // Compare RGB only (ignore alpha) with tolerance
  return (
    Math.abs(data[idx] - tr) <= tolerance &&
    Math.abs(data[idx + 1] - tg) <= tolerance &&
    Math.abs(data[idx + 2] - tb) <= tolerance
  );
}

function hexToRGBA(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  tolerance: number = FLOOD_FILL_TOLERANCE
): void {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const { data, width, height } = imageData;

  const x = Math.floor(startX);
  const y = Math.floor(startY);
  if (x < 0 || x >= width || y < 0 || y >= height) return;

  const startIdx = (y * width + x) * 4;

  // Don't fill if clicking on a dark/outline pixel
  if (isDark(data, startIdx)) return;

  // Target color = whatever color is at the clicked point
  const tr = data[startIdx];
  const tg = data[startIdx + 1];
  const tb = data[startIdx + 2];

  const fill = hexToRGBA(fillColorHex);

  // Don't fill if already the same color
  if (Math.abs(tr - fill.r) <= 2 && Math.abs(tg - fill.g) <= 2 && Math.abs(tb - fill.b) <= 2) return;

  const stack: number[] = [x, y];
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const cy = stack.pop()!;
    const cx = stack.pop()!;

    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

    const pixelIdx = cy * width + cx;
    if (visited[pixelIdx]) continue;
    visited[pixelIdx] = 1;

    const dataIdx = pixelIdx * 4;

    // Stop at dark pixels (outlines)
    if (isDark(data, dataIdx)) continue;

    // Stop if color doesn't match the target (RGB only, no alpha check)
    if (!colorsMatch(data, dataIdx, tr, tg, tb, tolerance)) continue;

    // Paint this pixel
    data[dataIdx] = fill.r;
    data[dataIdx + 1] = fill.g;
    data[dataIdx + 2] = fill.b;
    data[dataIdx + 3] = 255;

    // Expand in 4 directions
    stack.push(cx + 1, cy);
    stack.push(cx - 1, cy);
    stack.push(cx, cy + 1);
    stack.push(cx, cy - 1);
  }

  ctx.putImageData(imageData, 0, 0);
}
