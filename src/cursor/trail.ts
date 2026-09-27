import { rgbString } from '../lib/color';
import { accentRgb } from './accent';

const LENGTH = 1800;
const GAP = 6;
const ORTHO_GAP = 30;
const FOLLOW = 0.35;
const MODE_MS = 8000;
const MAX_ALPHA = 0.55;

interface Point {
  x: number;
  y: number;
}

export interface Trail {
  setEnabled(enabled: boolean): void;
}

export function startTrail(): Trail {
  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { setEnabled: () => undefined };

  let points: Point[] = [];
  let lastRecorded: Point | null = null;
  let mouse: Point | null = null;
  let follow: Point | null = null;
  let orthogonal = false;
  let enabled = true;
  let dirty = false;
  let width = 0;
  let height = 0;
  let last = 0;

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const record = (p: Point) => {
    const prev = lastRecorded;
    if (!prev) {
      lastRecorded = p;
      points.push(p);
      return;
    }
    if (Math.hypot(p.x - prev.x, p.y - prev.y) < (orthogonal ? ORTHO_GAP : GAP)) return;
    if (orthogonal) points.push({ x: p.x, y: prev.y }); // horizontal first, then vertical
    points.push(p);
    lastRecorded = p;

    let total = 0;
    for (let i = points.length - 1; i > 0; i--) {
      const a = points[i]!;
      const b = points[i - 1]!;
      total += Math.hypot(a.x - b.x, a.y - b.y);
      if (total > LENGTH) {
        points = points.slice(i - 1);
        break;
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    const colour = accentRgb();
    ctx.lineWidth = 3;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    const runs = 24;
    let distance = 0;
    let run = -1;
    for (let i = points.length - 1; i > 0; i--) {
      const a = points[i]!;
      const b = points[i - 1]!;
      const segment = Math.hypot(a.x - b.x, a.y - b.y);
      const along = (distance + segment / 2) / LENGTH;
      distance += segment;
      if (along >= 1) break;
      const next = Math.floor(along * runs);
      if (next !== run) {
        if (run >= 0) ctx.stroke();
        run = next;
        ctx.strokeStyle = rgbString(colour, (1 - (run + 0.5) / runs) * MAX_ALPHA);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
      }
      ctx.lineTo(b.x, b.y);
    }
    if (run >= 0) ctx.stroke();
  };

  const frame = (now: number) => {
    const k = last ? Math.min((now - last) * 0.06, 3) : 1; // elapsed time in 60 fps frames
    last = now;
    const m = mouse;
    const f = follow;
    if (m && f && enabled && root.classList.contains('has-custom-cursor')) {
      const t = 1 - Math.pow(1 - FOLLOW, k);
      f.x += (m.x - f.x) * t;
      f.y += (m.y - f.y) * t;
      record({ x: f.x, y: f.y });
      draw();
      dirty = true;
    } else {
      if (dirty) ctx.clearRect(0, 0, width, height);
      dirty = false;
      follow = null;
      points = [];
      lastRecorded = null;
    }
    requestAnimationFrame(frame);
  };

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      mouse = { x: e.clientX, y: e.clientY };
      follow ??= { ...mouse };
    },
    { passive: true },
  );
  root.addEventListener('mouseleave', () => {
    mouse = null;
  });
  window.setInterval(() => {
    orthogonal = !orthogonal;
  }, MODE_MS);
  requestAnimationFrame(frame);

  return {
    setEnabled(next) {
      enabled = next;
    },
  };
}
