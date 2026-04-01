function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Flood fill with outline detection from a SEPARATE background image.
 *
 * @param ctx         - The canvas context to fill (merged: draw layer composited on white bg)
 * @param startX      - Click x
 * @param startY      - Click y
 * @param fillColorHex - The color to fill with
 * @param bgData      - ImageData of the ORIGINAL coloring page (used for outline detection only)
 * @returns number of pixels changed
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  bgData: ImageData
): number {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const bg = bgData.data;

  const x0 = Math.floor(startX);
  const y0 = Math.floor(startY);
  if (x0 < 0 || x0 >= width || y0 < 0 || y0 >= height) return 0;

  const startIdx = (y0 * width + x0) * 4;

  // Clicked on outline? Do nothing.
  if (bg[startIdx] < 60 && bg[startIdx + 1] < 60 && bg[startIdx + 2] < 60) return 0;

  const fill = hexToRgb(fillColorHex);

  // Already this color? Do nothing.
  if (
    Math.abs(data[startIdx] - fill.r) < 5 &&
    Math.abs(data[startIdx + 1] - fill.g) < 5 &&
    Math.abs(data[startIdx + 2] - fill.b) < 5
  ) {
    return 0;
  }

  let pixelsChanged = 0;
  const visited = new Uint8Array(width * height);
  const stack: number[] = [x0, y0];

  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const pos = y * width + x;
    if (visited[pos]) continue;
    visited[pos] = 1;

    const idx = pos * 4;

    // Stop at outlines (checked from BACKGROUND canvas only)
    if (bg[idx] < 60 && bg[idx + 1] < 60 && bg[idx + 2] < 60) continue;

    // NO color matching — paint every non-outline pixel in the enclosed area
    data[idx] = fill.r;
    data[idx + 1] = fill.g;
    data[idx + 2] = fill.b;
    data[idx + 3] = 255;
    pixelsChanged++;

    stack.push(x + 1, y);
    stack.push(x - 1, y);
    stack.push(x, y + 1);
    stack.push(x, y - 1);

    if (pixelsChanged > 5000000) break;
  }

  if (pixelsChanged > 0) {
    ctx.putImageData(imageData, 0, 0);
  }

  return pixelsChanged;
}
