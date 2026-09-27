import { describe, expect, it } from 'vitest';
import { ditherColor, ditherMono } from './dither';
import { revealOrder } from './sweep';

const flat = (cols: number, rows: number, value: number) => {
  const data = new Uint8ClampedArray(cols * rows * 4).fill(value);
  for (let i = 3; i < data.length; i += 4) data[i] = 255;
  return data;
};

describe('ditherMono', () => {
  it('leaves white empty and fills black', () => {
    expect(ditherMono(flat(8, 8, 255), 8, 8).every((dot) => dot === 0)).toBe(true);
    expect(ditherMono(flat(8, 8, 0), 8, 8).filter((dot) => dot === 1).length).toBe(63); // threshold 0 never passes
  });

  it('puts dots on about half the cells for mid grey', () => {
    const dots = ditherMono(flat(8, 8, 128), 8, 8).reduce((sum, dot) => sum + dot, 0);
    expect(dots).toBeGreaterThanOrEqual(28);
    expect(dots).toBeLessThanOrEqual(36);
  });
});

describe('ditherColor', () => {
  it('snaps every channel to 0 or 255', () => {
    const out = ditherColor(flat(8, 8, 100), 8, 8);
    expect([...out].every((v) => v === 0 || v === 255)).toBe(true);
  });
});

describe('revealOrder', () => {
  it('visits every cell exactly once', () => {
    const order = revealOrder(12, 7, 'left');
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: 84 }, (_, i) => i));
  });

  it('starts at the leading corner and ends at the trailing one', () => {
    const down = revealOrder(8, 4, 'down');
    expect(down[0]).toBe(0); // top row, first band
    expect(down[down.length - 1]).toBe(4 * 8 - 1); // bottom row, last band
    const up = revealOrder(8, 4, 'up');
    expect(up[0]).toBe(3 * 8); // bottom row, first band
  });
});
