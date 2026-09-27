import { describe, expect, it } from 'vitest';
import { buildField, stepField } from './particles';

function mask(width: number, height: number, lit: [number, number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  const [x0, y0, x1, y1] = lit;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) data[(y * width + x) * 4 + 3] = 255;
  }
  return data;
}

describe('buildField', () => {
  it('lays a grid and lights the particles inside the mask', () => {
    const f = buildField(mask(60, 30, [0, 0, 30, 30]), 60, 30, 6);
    expect([f.cols, f.rows, f.count]).toEqual([10, 5, 50]);
    expect(f.lit[0]).toBe(1); // home (3, 3), inside
    expect(f.lit[9]).toBe(0); // home (57, 3), outside
  });
});

describe('stepField', () => {
  const idle = { x: 0, y: 0, active: false };

  it('pushes particles away from the pointer', () => {
    const f = buildField(mask(60, 60, [0, 0, 0, 0]), 60, 60, 6);
    const i = 4 * f.cols + 4; // home (27, 27)
    stepField(f, { x: 25, y: 27, active: true }, 1 / 60);
    expect(f.x[i]).toBeGreaterThan(27);
  });

  it('springs back home and reports when it has settled', () => {
    const f = buildField(mask(60, 60, [0, 0, 0, 0]), 60, 60, 6);
    const i = 4 * f.cols + 4;
    stepField(f, { x: 25, y: 27, active: true }, 1 / 60);

    let frames = 0;
    while (stepField(f, idle, 1 / 60) && frames < 600) frames++;

    expect(frames).toBeLessThan(600);
    expect(Math.abs(f.x[i]! - f.hx[i]!)).toBeLessThan(0.5);
  });

    it('splits a long frame into normal steps instead of flinging particles', () => {
    const push = { x: 25, y: 27, active: true };
    const a = buildField(mask(60, 60, [0, 0, 0, 0]), 60, 60, 6);
    const b = buildField(mask(60, 60, [0, 0, 0, 0]), 60, 60, 6);
    const i = 4 * a.cols + 4;

    stepField(a, push, 3 / 60); // one slow frame
    for (let n = 0; n < 3; n++) stepField(b, push, 1 / 60); // three normal frames

    expect(a.x[i]).toBeCloseTo(b.x[i]!, 3);
  });
});