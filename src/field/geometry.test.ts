import { describe, expect, it } from 'vitest';
import {
  cardSize,
  CUBE_WIRES,
  cubeLatLon,
  dirFromLatLon,
  faceFront,
  fibonacciLatLon,
  latLonFromDir,
  lerpLatLon,
  rotateXYZ,
  shortestDeg,
  sphereWires,
  wireAngles,
  type Vec3,
} from './geometry';

const expectVec = (actual: Vec3, expected: Vec3) => {
  actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i]!, 6));
};

describe('field geometry', () => {
  it('converts between lat/lon and directions', () => {
    const back = latLonFromDir(dirFromLatLon({ lat: 0.4, lon: -1.2 }));
    expect(back.lat).toBeCloseTo(0.4, 9);
    expect(back.lon).toBeCloseTo(-1.2, 9);
  });

  it('keeps small sets of cards off the poles', () => {
    for (let n = 1; n <= 8; n++) {
      for (let i = 0; i < n; i++) {
        expect(Math.abs(fibonacciLatLon(i, n).lat)).toBeLessThan((75 * Math.PI) / 180);
      }
    }
  });

  it('spreads the first four cube cards over a regular tetrahedron', () => {
    const dirs = [0, 1, 2, 3].map((i) => dirFromLatLon(cubeLatLon(i)));
    for (let a = 0; a < 4; a++) {
      for (let b = a + 1; b < 4; b++) {
        const dot = dirs[a]!.reduce((sum, v, k) => sum + v * dirs[b]![k]!, 0);
        expect(dot).toBeCloseTo(-1 / 3, 6);
      }
    }
  });

  it('builds 12 cube edges and a lat/lon grid', () => {
    expect(CUBE_WIRES).toHaveLength(12);
    expect(sphereWires(6)).toHaveLength(78);
  });

  it('turns any card to face the viewer', () => {
    const cases: Array<[number, number, number]> = [
      [0.3, 2.1, 40],
      [-0.9, -0.4, -123],
      [0.05, 3.1, 7],
    ];
    for (const [lat, lon, rz] of cases) {
      const dir = dirFromLatLon({ lat, lon });
      const { rx, ry } = faceFront(dir, rz);
      expectVec(rotateXYZ(dir, rx, ry, rz), [0, 0, 1]);
    }
  });

  it('stretches a wire exactly from a to b', () => {
    const a: Vec3 = [10, -20, 5];
    const b: Vec3 = [-30, 40, 25];
    const { length, yaw, roll } = wireAngles(a, b);
    const end = rotateXYZ([length, 0, 0], 0, yaw, roll);
    expectVec([a[0] + end[0], a[1] + end[1], a[2] + end[2]], b);
  });

  it('turns and morphs the short way round', () => {
    expect(shortestDeg(350)).toBe(-10);
    expect(shortestDeg(-190)).toBe(170);
    const mid = lerpLatLon(
      { lat: 0, lon: (170 * Math.PI) / 180 },
      { lat: 0, lon: (-170 * Math.PI) / 180 },
      0.5,
    );
    expect(Math.cos(mid.lon)).toBeCloseTo(-1, 6);
  });

  it('sizes cards at the requested aspect', () => {
    const { w, h } = cardSize(3, 6, 170, 16 / 9);
    expect(w / h).toBeCloseTo(16 / 9, 1);
  });
});
