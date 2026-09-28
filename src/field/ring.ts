// Geometry for the orbit field: cards on a flat ring seen slightly from above, turning clockwise
// around the section's name (docs/interactions.md, "Orbit field"). Pure maths, no DOM.

export interface RingLayout {
  /** Horizontal and vertical radius of the ring the card centres sit on. */
  rx: number;
  ry: number;
  /** Card size. */
  w: number;
  h: number;
  /** Room left in the middle for the centre text. */
  innerW: number;
  innerH: number;
}

export interface RingOptions {
  /** Space kept clear at the left and right edges (the pill rail on desktop). */
  reserveX?: number;
  aspect?: number;
}

/** Hovered cards grow by this much (and the ring leaves room for it). */
export const HOT_SCALE = 1.3;
/** Cards at the front of the ring are this much bigger than cards at the back. */
export const DEPTH_SCALE = 0.08;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Fits a ring of `n` cards into a `width` x `height` stage.
 * Landscape: a wide ellipse (a circle tilted back), cards sized by how many share it.
 * Portrait: a tall ellipse with big cards that run slightly off the sides as they pass.
 */
export function ringLayout(
  n: number,
  width: number,
  height: number,
  { reserveX = 0, aspect = 16 / 9 }: RingOptions = {},
): RingLayout {
  const margin = clamp(Math.min(width, height) * 0.04, 12, 40);
  const ay = height / 2 - margin;
  // Room for the front card at full depth scale plus a little of the hover growth.
  const grow = (1 + DEPTH_SCALE) * 1.1;

  if (height > width * 1.1) {
    const w = clamp(width * 0.42, 120, 320);
    const h = w / aspect;
    const rx = width / 2 - w * 0.35;
    const ry = Math.max(rx, Math.min(ay - (h / 2) * grow, rx * 1.8));
    return {
      rx,
      ry,
      w,
      h,
      innerW: width * 0.78,
      innerH: Math.max(0, 2 * (ry - h / 2) * 0.8),
    };
  }

  const ax = width / 2 - Math.max(margin, reserveX);
  const share = n <= 4 ? 0.9 : n <= 7 ? 0.8 : 0.62; // card width as a share of rx
  const tilt = 0.7; // ry / rx
  const rx = Math.max(
    40,
    Math.min(ax / (1 + (share / 2) * grow), ay / (tilt + (share / aspect / 2) * grow)),
  );
  const w = rx * share;
  const h = w / aspect;
  const ry = rx * tilt;
  return {
    rx,
    ry,
    w,
    h,
    // The side cards pass right by the text, so leave it some air.
    innerW: Math.max(0, 2 * (rx - w / 2) * 0.72),
    innerH: Math.max(0, 2 * (ry - h / 2) * 0.8),
  };
}

export interface RingSlot {
  x: number;
  y: number;
  /** -1 at the back (top of the ring) to 1 at the front (bottom). */
  depth: number;
  scale: number;
}

/**
 * Where card `i` of `n` sits when the ring has turned `turn` radians (clockwise on screen,
 * since y points down). Card 0 starts at the front.
 */
export function ringSlot(i: number, n: number, turn: number, rx: number, ry: number): RingSlot {
  const angle = turn + (i / n) * Math.PI * 2 + Math.PI / 2;
  const depth = Math.sin(angle);
  return {
    x: Math.cos(angle) * rx,
    y: depth * ry,
    depth,
    scale: 1 + depth * DEPTH_SCALE,
  };
}

/** Signed smallest difference between two angles, in (-PI, PI]. */
export function angleDelta(from: number, to: number): number {
  const d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) return d - Math.PI * 2;
  if (d <= -Math.PI) return d + Math.PI * 2;
  return d;
}
