
export interface Field {
  cols: number;
  rows: number;
  count: number;
  hx: Float32Array;
  hy: Float32Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  /** 1 where the particle is part of the name, 0 for the background dot grid. */
  lit: Uint8Array;
}

export interface Pointer {
  x: number;
  y: number;
  active: boolean;
}

// Velocities are per 60 fps frame; stepField scales everything by the real frame time.
export const PHYSICS = {
  step: 6,
  size: 3,
  repelRadius: 90,
  repelStrength: 150,
  spring: 0.09,
  damping: 0.86,
};

/**
 * Lays a particle every `step` px over a width x height area. `rgba` is the ImageData of a mask drawn at the same size; particles on opaque mask pixels are lit.
 */
export function buildField(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  step: number = PHYSICS.step,
): Field {
  const cols = Math.floor(width / step);
  const rows = Math.floor(height / step);
  const count = cols * rows;
  const field: Field = {
    cols,
    rows,
    count,
    hx: new Float32Array(count),
    hy: new Float32Array(count),
    x: new Float32Array(count),
    y: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
    lit: new Uint8Array(count),
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const px = Math.floor(step / 2 + c * step);
      const py = Math.floor(step / 2 + r * step);
      field.hx[i] = field.x[i] = px;
      field.hy[i] = field.y[i] = py;
      field.lit[i] = (rgba[(py * width + px) * 4 + 3] ?? 0) > 127 ? 1 : 0;
    }
  }
  return field;
}

export function stepField(f: Field, pointer: Pointer, dt: number): boolean {
  const frames = Math.min(dt * 60, 3);
  const steps = Math.max(1, Math.ceil(frames));
  let moving = false;
  for (let s = 0; s < steps; s++) {
    if (integrate(f, pointer, frames / steps)) moving = true;
  }
  return moving;
}

/** One physics step of `k` 60 fps frames (k is at most 1). */
function integrate(f: Field, pointer: Pointer, k: number): boolean {
  const spring = PHYSICS.spring * k;
  const damp = Math.pow(PHYSICS.damping, k);
  const push = PHYSICS.repelStrength * k;
  const r = PHYSICS.repelRadius;
  const { hx, hy, x, y, vx, vy } = f;
  let moving = false;

  for (let i = 0; i < f.count; i++) {
    let px = x[i]!;
    let py = y[i]!;
    let pvx = vx[i]!;
    let pvy = vy[i]!;
    const homeX = hx[i]!;
    const homeY = hy[i]!;

    if (pointer.active) {
      const dx = px - pointer.x;
      const dy = py - pointer.y;
      if (dx > -r && dx < r && dy > -r && dy < r) {
        const d = Math.max(0.5, Math.sqrt(dx * dx + dy * dy));
        if (d < r) {
          const force = (1 - d / r) * push;
          pvx += (dx / d) * force;
          pvy += (dy / d) * force;
        }
      }
    }

    pvx = (pvx + (homeX - px) * spring) * damp;
    pvy = (pvy + (homeY - py) * spring) * damp;
    px += pvx * k;
    py += pvy * k;
    x[i] = px;
    y[i] = py;
    vx[i] = pvx;
    vy[i] = pvy;

    if (
      !moving &&
      (Math.abs(pvx) > 0.02 ||
        Math.abs(pvy) > 0.02 ||
        Math.abs(px - homeX) > 0.3 ||
        Math.abs(py - homeY) > 0.3)
    ) {
      moving = true;
    }
  }
  return moving;
}