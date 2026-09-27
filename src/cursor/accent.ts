import { hexToRgb, mixRgb, randomAccent, rgbString, type Rgb } from '../lib/color';
import { prefersReducedMotion } from '../motion/tokens';

const CYCLE_MS = 5000;
const WRITE_EVERY_MS = 33;

let current: Rgb = [255, 224, 0];

export const accentRgb = (): Rgb => current;

export function startAccentCycle(): void {
  const root = document.documentElement;
  const ink = hexToRgb(getComputedStyle(root).getPropertyValue('--ink'));
  const write = (colour: Rgb) => {
    current = colour;
    root.style.setProperty('--accent', rgbString(colour));
  };

  let from = randomAccent(ink);
  write(from);
  if (prefersReducedMotion()) return;

  let to = randomAccent(ink);
  let start = performance.now();
  let lastWrite = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / CYCLE_MS);
    if (now - lastWrite >= WRITE_EVERY_MS || t === 1) {
      write(mixRgb(from, to, t));
      lastWrite = now;
    }
    if (t === 1) {
      from = to;
      to = randomAccent(ink);
      start = now;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
