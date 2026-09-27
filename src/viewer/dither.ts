import { hexToRgb } from '../lib/color';

// Ordered (Bayer 8x8) dithering for the slide reveal and filmstrip hover
// (docs/interactions.md 5.8, 5.9). The maths works on raw RGBA so it can be unit tested.

// prettier-ignore
const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

const threshold = (x: number, y: number) => ((BAYER8[(y % 8) * 8 + (x % 8)] ?? 0) / 64) * 255;

/** 1-bit dither of cols x rows pixels (one pixel per dot): 1 where a dark dot goes. */
export function ditherMono(rgba: Uint8ClampedArray, cols: number, rows: number): Uint8Array {
  const out = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const p = i * 4;
      const lum = 0.299 * (rgba[p] ?? 0) + 0.587 * (rgba[p + 1] ?? 0) + 0.114 * (rgba[p + 2] ?? 0);
      out[i] = lum < threshold(x, y) ? 1 : 0;
    }
  }
  return out;
}

/** 8-colour dither: each channel thresholded on its own, so the hues survive. Returns RGBA. */
export function ditherColor(
  rgba: Uint8ClampedArray,
  cols: number,
  rows: number,
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(cols * rows * 4);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const p = (y * cols + x) * 4;
      const t = threshold(x, y);
      out[p] = (rgba[p] ?? 0) > t ? 255 : 0;
      out[p + 1] = (rgba[p + 1] ?? 0) > t ? 255 : 0;
      out[p + 2] = (rgba[p + 2] ?? 0) > t ? 255 : 0;
      out[p + 3] = 255;
    }
  }
  return out;
}

/**
 * Draws `img` dithered into a w x h box (contain, dark letterbox) as `dot`-px squares.
 * Mono uses the paper and ink colours; colour keeps each channel at 0 or 255.
 */
export function drawDithered(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  mode: 'mono' | 'color',
  dot = 3,
): void {
  const cols = Math.max(1, Math.floor(w / dot));
  const rows = Math.max(1, Math.floor(h / dot));
  const sample = document.createElement('canvas');
  sample.width = cols;
  sample.height = rows;
  const s = sample.getContext('2d', { willReadFrequently: true });
  if (!s || !img.naturalWidth) return;

  s.fillStyle = '#000';
  s.fillRect(0, 0, cols, rows);
  const scale = Math.min(cols / img.naturalWidth, rows / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  s.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
  const source = s.getImageData(0, 0, cols, rows).data;

  let pixels: Uint8ClampedArray<ArrayBuffer>;
  if (mode === 'color') {
    pixels = ditherColor(source, cols, rows);
  } else {
    const css = getComputedStyle(document.documentElement);
    const paper = hexToRgb(css.getPropertyValue('--paper'));
    const ink = hexToRgb(css.getPropertyValue('--ink'));
    const mask = ditherMono(source, cols, rows);
    pixels = new Uint8ClampedArray(cols * rows * 4);
    mask.forEach((dark, i) => {
      const c = dark ? ink : paper;
      pixels.set([c[0], c[1], c[2], 255], i * 4);
    });
  }

  s.putImageData(new ImageData(pixels, cols, rows), 0, 0);
  ctx.imageSmoothingEnabled = false; // keep the dots square when scaled up
  ctx.drawImage(sample, 0, 0, cols * dot, rows * dot);
  ctx.imageSmoothingEnabled = true;
}
