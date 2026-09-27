import { scrambleFrame } from '../lib/scramble';
import { prefersReducedMotion } from './tokens';

const running = new WeakMap<HTMLElement, number>();

/** Scrambles `el` into `text` over `durationMs`. Instant under reduced motion. */
export function scrambleText(el: HTMLElement, text: string, durationMs: number): void {
  cancelScramble(el);
  if (prefersReducedMotion() || durationMs <= 0) {
    el.textContent = text;
    return;
  }
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    el.textContent = scrambleFrame(text, t);
    if (t < 1) running.set(el, requestAnimationFrame(frame));
    else running.delete(el);
  };
  running.set(el, requestAnimationFrame(frame));
}

export function cancelScramble(el: HTMLElement): void {
  const id = running.get(el);
  if (id !== undefined) cancelAnimationFrame(id);
  running.delete(el);
}
