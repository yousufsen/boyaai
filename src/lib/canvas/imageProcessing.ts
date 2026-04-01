/**
 * 8-directional dilation of black pixels (3x3 kernel).
 * Makes every black pixel's 8 neighbors also black.
 * Thickens outlines by 1px in each direction including diagonals.
 */
export function dilateBlack(
  data: Buffer | Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const size = width * height;
  const output = new Uint8Array(size);
  output.fill(255);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] === 0) {
        // Set this pixel and all 8 neighbors (3x3 kernel) to black
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              output[ny * width + nx] = 0;
            }
          }
        }
      }
    }
  }

  return output;
}

/**
 * Morphological closing: dilate then erode.
 * Closes small gaps in black outlines while preserving line thickness.
 * Operates on a single-channel binary image (0=black, 255=white).
 */
export function morphologicalClose(
  data: Buffer | Uint8Array,
  width: number,
  height: number,
  radius: number = 1
): Uint8Array {
  const size = width * height;
  const input = new Uint8Array(size);
  const dilated = new Uint8Array(size);
  const output = new Uint8Array(size);

  // Copy input (already single-channel grayscale)
  for (let i = 0; i < size; i++) {
    input[i] = data[i];
  }

  // Dilate black: if ANY neighbor in kernel is black(0), pixel becomes black
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let foundBlack = false;

      for (let dy = -radius; dy <= radius && !foundBlack; dy++) {
        for (let dx = -radius; dx <= radius && !foundBlack; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (input[ny * width + nx] === 0) {
              foundBlack = true;
            }
          }
        }
      }

      dilated[idx] = foundBlack ? 0 : 255;
    }
  }

  // Erode black: pixel stays black only if ALL neighbors in kernel are black
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let allBlack = true;

      for (let dy = -radius; dy <= radius && allBlack; dy++) {
        for (let dx = -radius; dx <= radius && allBlack; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (dilated[ny * width + nx] !== 0) {
              allBlack = false;
            }
          }
        }
      }

      output[idx] = allBlack ? 0 : 255;
    }
  }

  return output;
}
