import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb, hslToRgb, mixRgb, randomAccent, type Rgb } from './color';

const ink: Rgb = [10, 10, 11];

describe('color', () => {
  it('parses hex tokens', () => {
    expect(hexToRgb(' #0a0a0b')).toEqual([10, 10, 11]);
    expect(hexToRgb('#e8e6de')).toEqual([232, 230, 222]);
  });

  it('converts HSL', () => {
    expect(hslToRgb(0, 1, 0.5)).toEqual([255, 0, 0]);
    expect(hslToRgb(120, 1, 0.25)).toEqual([0, 128, 0]);
    expect(hslToRgb(240, 1, 0.5)).toEqual([0, 0, 255]);
  });

  it('measures contrast and mixes', () => {
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5);
    expect(mixRgb([0, 0, 0], [200, 100, 50], 0.5)).toEqual([100, 50, 25]);
  });

  it('keeps every random accent readable under ink text', () => {
    for (let n = 0; n < 500; n++) {
      expect(contrastRatio(randomAccent(ink), ink)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
