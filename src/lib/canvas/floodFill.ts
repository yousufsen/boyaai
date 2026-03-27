import { FLOOD_FILL_TOLERANCE } from '@/constants/limits';

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function getPixelColor(imageData: ImageData, x: number, y: number): RGBA {
  const index = (y * imageData.width + x) * 4;
  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3],
  };
}

function setPixelColor(imageData: ImageData, x: number, y: number, color: RGBA): void {
  const index = (y * imageData.width + x) * 4;
  imageData.data[index] = color.r;
  imageData.data[index + 1] = color.g;
  imageData.data[index + 2] = color.b;
  imageData.data[index + 3] = color.a;
}

function colorsMatch(a: RGBA, b: RGBA, tolerance: number): boolean {
  return (
    Math.abs(a.r - b.r) <= tolerance &&
    Math.abs(a.g - b.g) <= tolerance &&
    Math.abs(a.b - b.b) <= tolerance &&
    Math.abs(a.a - b.a) <= tolerance
  );
}

function hexToRGBA(hex: string): RGBA {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0, a: 255 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 255,
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
  const { width, height } = imageData;

  const x = Math.floor(startX);
  const y = Math.floor(startY);

  if (x < 0 || x >= width || y < 0 || y >= height) return;

  const targetColor = getPixelColor(imageData, x, y);
  const fillColor = hexToRGBA(fillColorHex);

  if (colorsMatch(targetColor, fillColor, 0)) return;

  const stack: [number, number][] = [[x, y]];
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    const idx = cy * width + cx;

    if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
    if (visited[idx]) continue;

    const currentColor = getPixelColor(imageData, cx, cy);
    if (!colorsMatch(currentColor, targetColor, tolerance)) continue;

    visited[idx] = 1;
    setPixelColor(imageData, cx, cy, fillColor);

    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}
