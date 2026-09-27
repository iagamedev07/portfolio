import { drawDithered } from './dither';

// The slide-change reveal (docs/interactions.md 5.9): the next image builds in cell by cell over
// the current one, first as a clean 1-bit dither, then for real with a glitchy sideways kick and
// a red leading edge.

export type SweepDirection = 'down' | 'up' | 'right' | 'left';

const DIRECTIONS: SweepDirection[] = ['down', 'up', 'right', 'left'];

export interface SweepOptions {
  cell: number;
  jitterX: number;
  jitterY: number;
  passMs: number;
  tint: string;
}

/**
 * The order cells appear in. The grid is split into `bands` strips across the sweep; each strip
 * sweeps along the direction and starts a little after the one before, so it reads as a cascade.
 */
export function revealOrder(
  cols: number,
  rows: number,
  direction: SweepDirection,
  bands = 8,
  stagger = 0.35,
): number[] {
  const vertical = direction === 'down' || direction === 'up';
  const time: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const across = vertical ? c / cols : r / rows;
      const band = Math.min(bands - 1, Math.floor(across * bands));
      const length = vertical ? rows : cols;
      const along = vertical
        ? direction === 'down'
          ? r
          : rows - 1 - r
        : direction === 'right'
          ? c
          : cols - 1 - c;
      const bandShare = bands > 1 ? band / (bands - 1) : 0;
      const alongShare = length > 1 ? along / (length - 1) : 0;
      time.push(bandShare * stagger + alongShare * (1 - stagger));
    }
  }
  return time.map((_, i) => i).sort((a, b) => (time[a] ?? 0) - (time[b] ?? 0));
}

/** Plays the reveal of `target` on `canvas`, which sits over the current image. */
export function sweepReveal(
  canvas: HTMLCanvasElement,
  target: HTMLImageElement,
  options: SweepOptions,
): Promise<void> {
  return new Promise((resolve) => {
    // Layout size, not getBoundingClientRect: the frame may be tilted.
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    const crisp = offscreen(w, h);
    const dithered = offscreen(w, h);
    const crispCtx = crisp.getContext('2d');
    const ditherCtx = dithered.getContext('2d');
    if (!ctx || !crispCtx || !ditherCtx || !target.naturalWidth) {
      resolve();
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    crispCtx.fillStyle = '#000';
    crispCtx.fillRect(0, 0, w, h);
    const scale = Math.min(w / target.naturalWidth, h / target.naturalHeight);
    const dw = target.naturalWidth * scale;
    const dh = target.naturalHeight * scale;
    crispCtx.drawImage(target, (w - dw) / 2, (h - dh) / 2, dw, dh);
    drawDithered(ditherCtx, target, w, h, 'mono');

    const cols = Math.max(1, Math.round(w / options.cell));
    const rows = Math.max(1, Math.round(h / options.cell));
    const cw = w / cols;
    const ch = h / rows;
    const total = cols * rows;
    const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)] ?? 'down';
    const order = revealOrder(cols, rows, direction);

    const drawCells = (source: HTMLCanvasElement, from: number, to: number, dx = 0, dy = 0) => {
      for (let i = from; i < to; i++) {
        const idx = order[i] ?? 0;
        const r = Math.floor(idx / cols);
        const c = idx - r * cols;
        // +0.6 hides hairline seams between cells
        ctx.drawImage(source, c * cw, r * ch, cw, ch, c * cw + dx, r * ch + dy, cw + 0.6, ch + 0.6);
      }
    };
    const tint = (from: number, to: number) => {
      ctx.fillStyle = options.tint;
      for (let i = from; i < to; i++) {
        const idx = order[i] ?? 0;
        const r = Math.floor(idx / cols);
        ctx.fillRect((idx - r * cols) * cw, r * ch, cw + 0.6, ch + 0.6);
      }
    };

    const pass = (source: HTMLCanvasElement, jitter: boolean, done: () => void) => {
      let drawn = 0;
      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / options.passMs);
        const count = Math.floor(t * total);
        // Settle last frame's leading edge, kick in the new cells, tint the new edge.
        drawCells(source, Math.max(0, drawn - cols), drawn);
        const dx = jitter ? (Math.random() * 2 - 1) * options.jitterX : 0;
        const dy = jitter ? (Math.random() * 2 - 1) * options.jitterY : 0;
        drawCells(source, drawn, count, dx, dy);
        tint(Math.max(0, count - cols), count);
        drawn = count;
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          drawCells(source, Math.max(0, total - cols), total);
          done();
        }
      };
      requestAnimationFrame(frame);
    };

    pass(dithered, false, () => pass(crisp, true, resolve));
  });
}

function offscreen(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w);
  canvas.height = Math.round(h);
  return canvas;
}
