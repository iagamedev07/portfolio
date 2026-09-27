export type Vec3 = [number, number, number];

export interface LatLon {
  lat: number;
  lon: number;
}

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

export function dirFromLatLon({ lat, lon }: LatLon): Vec3 {
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
}

export function latLonFromDir([x, y, z]: Vec3): LatLon {
  const length = Math.hypot(x, y, z) || 1;
  return { lat: Math.asin(Math.max(-1, Math.min(1, y / length))), lon: Math.atan2(x, z) };
}

export function fibonacciLatLon(i: number, n: number): LatLon {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (2 * i + 1) / n;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = golden * i;
  return latLonFromDir([Math.cos(theta) * r, y, Math.sin(theta) * r]);
}

const CUBE: Vec3[] = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [-1, -1, -1],
  [-1, 1, 1],
  [1, -1, 1],
  [1, 1, -1],
];

const unit = (v: Vec3): Vec3 => {
  const length = Math.hypot(...v);
  return [v[0] / length, v[1] / length, v[2] / length];
};

export function cubeLatLon(i: number): LatLon {
  return latLonFromDir(CUBE[i % CUBE.length]!);
}

export const CUBE_WIRES: Array<[Vec3, Vec3]> = CUBE.flatMap((a, i) =>
  CUBE.slice(i + 1)
    .filter((b) => a.filter((value, k) => value !== b[k]).length === 1)
    .map((b): [Vec3, Vec3] => [unit(a), unit(b)]),
);

export function sphereWires(n: number): Array<[Vec3, Vec3]> {
  const rings = Math.max(4, Math.round(Math.sqrt(n * 0.55)));
  const meridians = Math.max(6, Math.round(Math.sqrt(n * 1.8)));
  const step = (Math.PI * 2) / meridians;
  const at = (lat: number, lon: number) => dirFromLatLon({ lat, lon });
  const latOf = (r: number) => Math.PI / 2 - (r / rings) * Math.PI;
  const segments: Array<[Vec3, Vec3]> = [];

  for (let r = 1; r < rings; r++) {
    for (let c = 0; c < meridians; c++) {
      const lon = c * step - Math.PI;
      for (let s = 0; s < 3; s++) {
        segments.push([
          at(latOf(r), lon + (s / 3) * step),
          at(latOf(r), lon + ((s + 1) / 3) * step),
        ]);
      }
    }
  }
  for (let c = 0; c < meridians; c++) {
    const lon = c * step - Math.PI;
    for (let r = 0; r < rings; r++) segments.push([at(latOf(r), lon), at(latOf(r + 1), lon)]);
  }
  return segments;
}

export function rotateXYZ([x, y, z]: Vec3, rx: number, ry: number, rz: number): Vec3 {
  const [cz, sz] = [Math.cos(rz * RAD), Math.sin(rz * RAD)];
  const [cy, sy] = [Math.cos(ry * RAD), Math.sin(ry * RAD)];
  const [cx, sx] = [Math.cos(rx * RAD), Math.sin(rx * RAD)];
  const x1 = x * cz - y * sz;
  const y1 = x * sz + y * cz;
  const x2 = x1 * cy + z * sy;
  const z2 = -x1 * sy + z * cy;
  return [x2, y1 * cx - z2 * sx, y1 * sx + z2 * cx];
}

export function faceFront(dir: Vec3, rz: number): { rx: number; ry: number } {
  const [ex, ey, ez] = rotateXYZ(dir, 0, 0, rz);
  return { rx: Math.atan2(ey, Math.hypot(ex, ez)) * DEG, ry: Math.atan2(-ex, ez) * DEG };
}

export function shortestDeg(delta: number): number {
  return (((delta % 360) + 540) % 360) - 180;
}

export function lerpLatLon(a: LatLon, b: LatLon, t: number): LatLon {
  let dLon = b.lon - a.lon;
  if (dLon > Math.PI) dLon -= Math.PI * 2;
  if (dLon < -Math.PI) dLon += Math.PI * 2;
  return { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + dLon * t };
}

export function wireAngles(a: Vec3, b: Vec3): { length: number; yaw: number; roll: number } {
  const [dx, dy, dz] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const length = Math.hypot(dx, dy, dz);
  if (length < 1e-6) return { length: 0, yaw: 0, roll: 0 };
  return { length, yaw: Math.atan2(-dz, dx) * DEG, roll: Math.asin(dy / length) * DEG };
}

export function fieldRadius(n: number, w: number, h: number, scale = 1.7): number {
  const density = Math.sqrt(n / 14);
  const base = Math.max(190, Math.min(360, Math.min(w, h) * 0.34));
  return base * Math.max(1, density * 0.92) * 0.52 * scale;
}

export function cardSize(
  i: number,
  n: number,
  base: number,
  aspect: number,
): { w: number; h: number; depth: number } {
  const density = Math.sqrt(n / 14);
  const sizeSeed = Math.sin(i * 12.9898) * 43758.5453;
  const depthSeed = Math.sin(i * 78.233) * 12543.112;
  const spread = Math.max(0.25, Math.min(0.7, 0.9 / density));
  const smallest = Math.max(0.55, Math.min(0.8, 1.2 / density));
  const size = base * (smallest + (sizeSeed - Math.floor(sizeSeed)) * spread);
  return {
    w: Math.round(size * Math.sqrt(aspect)),
    h: Math.round(size / Math.sqrt(aspect)),
    depth: 0.88 + (depthSeed - Math.floor(depthSeed)) * 0.22,
  };
}

export function autoSpeed(n: number): number {
  return Math.max(0.05, 0.14 / Math.sqrt(Math.sqrt(n / 14)));
}
