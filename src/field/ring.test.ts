import { describe, expect, it } from 'vitest';
import { angleDelta, DEPTH_SCALE, ringLayout, ringSlot } from './ring';

describe('ringLayout', () => {
  const sizes: Array<[number, number, number]> = [
    [7, 1440, 836],
    [4, 1440, 836],
    [7, 1024, 704],
    [7, 390, 714],
    [4, 768, 900],
  ];

  it.each(sizes)('keeps %i cards inside a %ix%i stage', (n, width, height) => {
    const desktop = width > 820;
    const ring = ringLayout(n, width, height, { reserveX: desktop ? 230 : 0 });
    const front = 1 + DEPTH_SCALE;
    // Top and bottom cards stay on screen.
    expect(ring.ry + (ring.h / 2) * front).toBeLessThanOrEqual(height / 2);
    if (height <= width * 1.1) {
      // Landscape: the sides stay clear of the rail.
      expect(ring.rx + (ring.w / 2) * front).toBeLessThanOrEqual(width / 2 - 230 + 1);
      expect(ring.ry).toBeLessThan(ring.rx);
    } else {
      expect(ring.ry).toBeGreaterThanOrEqual(ring.rx);
    }
    expect(ring.w / ring.h).toBeCloseTo(16 / 9, 6);
    expect(ring.innerW).toBeGreaterThan(0);
  });

  it('gives fewer cards more room each', () => {
    const few = ringLayout(4, 1440, 836, { reserveX: 230 });
    const many = ringLayout(7, 1440, 836, { reserveX: 230 });
    expect(few.w / few.rx).toBeGreaterThan(many.w / many.rx);
  });
});

describe('ringSlot', () => {
  it('starts card 0 at the front, bottom centre', () => {
    const slot = ringSlot(0, 4, 0, 300, 200);
    expect(slot.x).toBeCloseTo(0, 6);
    expect(slot.y).toBeCloseTo(200, 6);
    expect(slot.depth).toBeCloseTo(1, 6);
    expect(slot.scale).toBeCloseTo(1 + DEPTH_SCALE, 6);
  });

  it('spaces cards evenly around the ring', () => {
    expect(ringSlot(1, 4, 0, 300, 200).x).toBeCloseTo(-300, 6);
    expect(ringSlot(2, 4, 0, 300, 200).y).toBeCloseTo(-200, 6);
    expect(ringSlot(3, 4, 0, 300, 200).x).toBeCloseTo(300, 6);
  });

  it('turns clockwise on screen as the turn grows', () => {
    // Bottom centre moves left (clockwise with y pointing down).
    expect(ringSlot(0, 4, 0.1, 300, 200).x).toBeLessThan(0);
  });
});

describe('angleDelta', () => {
  it('takes the short way round', () => {
    expect(angleDelta(3, -3)).toBeCloseTo(-3 + Math.PI * 2 - 3, 6);
    expect(angleDelta(-3, 3)).toBeCloseTo(3 - Math.PI * 2 + 3, 6);
    expect(angleDelta(0.2, 0.5)).toBeCloseTo(0.3, 6);
  });
});
