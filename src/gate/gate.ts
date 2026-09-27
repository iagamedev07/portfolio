import { gsap } from 'gsap';
import { ease, MOBILE_QUERY, prefersReducedMotion } from '../motion/tokens';
import type { Route } from '../router';
import { buildField, PHYSICS, stepField, type Field, type Pointer } from './particles';
import './gate.css';

const SEEN_KEY = 'hc-gate-seen';
const NAME_LINES = ['HEMANG', 'CHAUHAN'];
const DISC_LABELS = ['Enter', 'Play'];
const LABEL_SWAP_MS = 1000;
const LEAVE_MS = 900;
const DISC_FOLLOW = 0.2;
const DOT_MIX = 0.14;

// Reference values converted to screen px.
const ABERRATION_MAX = 13;
const ABERRATION_FULL_AT = 24;
const GLITCH = {
  chance: 0.06,
  maxBands: 8,
  decay: 0.06,
  widthMin: 0.015,
  widthMax: 0.065,
  offsetMin: 11,
  offsetMax: 44,
};

type Rgb = [number, number, number];

interface Band {
  /** 'h' shifts a strip of rows sideways, 'v' shifts a strip of columns up or down. */
  axis: 'h' | 'v';
  from: number;
  to: number;
  offset: number;
  life: number;
}

export function shouldShowGate(route: Route): boolean {
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('gate')) return true;
  if (window.matchMedia(MOBILE_QUERY).matches) return false;
  // Shared deep links go straight to the work.
  if (route.view !== 'field' || route.section !== 'home') return false;
  try {
    return localStorage.getItem(SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

/** Shows the gate over the page. Resolves the moment the visitor enters, as the fade starts. */
export function runGate(): Promise<void> {
  return new Promise((resolve) => {
    const app = document.getElementById('app');
    const root = document.createElement('div');
    root.className = 'gate';
    root.innerHTML = `
      <h1 class="visually-hidden">Hemang Chauhan</h1>
      <canvas class="gate-canvas" aria-hidden="true"></canvas>
      <p class="gate-role display">Game developer</p>
      <button class="gate-enter display" type="button">Enter</button>
      <div class="gate-disc display" aria-hidden="true">
        ${DISC_LABELS.map((label) => `<span class="gate-disc-label"><span>${label}</span></span>`).join('')}
      </div>`;
    document.body.append(root);
    if (app) app.inert = true;

    const canvas = root.querySelector('canvas');
    const button = root.querySelector('button');
    const disc = root.querySelector<HTMLElement>('.gate-disc');
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !button || !disc || !ctx) {
      root.remove();
      if (app) app.inert = false;
      resolve();
      return;
    }

    const labels = [...disc.querySelectorAll<HTMLElement>('.gate-disc-label')];
    const reduce = prefersReducedMotion();
    const colours = readColours();
    const pointer: Pointer = { x: -9999, y: -9999, active: false };
    const discPos = { x: 0, y: 0, placed: false };
    const controller = new AbortController();
    const { signal } = controller;
    const split: number[] = [];
    let field: Field | null = null;
    let width = 0;
    let height = 0;
    let bands: Band[] = [];
    let raf = 0;
    let last = 0;
    let labelIndex = 0;
    let swapTimer = 0;
    let resizeTimer = 0;
    let leaving = false;

    if (reduce) root.classList.add('is-static');

    const layout = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      field = buildField(nameMask(width, height), width, height);
      draw();
    };

    const draw = () => {
      const f = field;
      if (!f) return;
      const size = PHYSICS.size;
      const half = size / 2;

      // Glitch bands only move where particles are drawn, never their physics.
      const rowShift = new Float32Array(f.rows);
      const colShift = new Float32Array(f.cols);
      for (const b of bands) {
        const shift = b.axis === 'h' ? rowShift : colShift;
        for (let j = Math.max(0, b.from); j < Math.min(b.to, shift.length); j++) {
          shift[j] = (shift[j] ?? 0) + b.offset * b.life;
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = rgb(colours.bg);
      ctx.fillRect(0, 0, width, height);

      // Particles at rest, batched by colour.
      split.length = 0;
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = rgb(pass ? colours.paper : colours.dot);
        for (let i = 0; i < f.count; i++) {
          if (f.lit[i] !== pass) continue;
          const row = Math.floor(i / f.cols);
          const px = f.x[i]! + (rowShift[row] ?? 0);
          const py = f.y[i]! + (colShift[i - row * f.cols] ?? 0);
          if (Math.abs(px - f.hx[i]!) + Math.abs(py - f.hy[i]!) > 1) {
            split.push(i);
            continue;
          }
          ctx.fillRect(px - half, py - half, size, size);
        }
      }

      // Displaced particles split into offset R, G and B squares that add back up where they overlap.
      ctx.globalCompositeOperation = 'lighter';
      for (const i of split) {
        const row = Math.floor(i / f.cols);
        const px = f.x[i]! + (rowShift[row] ?? 0);
        const py = f.y[i]! + (colShift[i - row * f.cols] ?? 0);
        const distance = Math.hypot(px - f.hx[i]!, py - f.hy[i]!);
        const shift = Math.min(1, distance / ABERRATION_FULL_AT) * ABERRATION_MAX;
        const [r, g, b] = f.lit[i] ? colours.paper : colours.dot;
        ctx.fillStyle = `rgb(${r}, 0, 0)`;
        ctx.fillRect(px - shift - half, py - half, size, size);
        ctx.fillStyle = `rgb(0, ${g}, 0)`;
        ctx.fillRect(px - half, py - half, size, size);
        ctx.fillStyle = `rgb(0, 0, ${b})`;
        ctx.fillRect(px + shift - half, py - half, size, size);
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const spawnBands = (f: Field, k: number) => {
      if (bands.length >= GLITCH.maxBands) return;
      if (Math.random() >= 1 - Math.pow(1 - GLITCH.chance, k)) return;
      const axis: Band['axis'] = Math.random() < 0.5 ? 'h' : 'v';
      const span = axis === 'h' ? f.rows : f.cols;
      const widthShare = GLITCH.widthMin + Math.random() * (GLITCH.widthMax - GLITCH.widthMin);
      const bandSize = Math.max(1, Math.round(span * widthShare));
      const start = Math.floor(Math.random() * span);
      const offset = GLITCH.offsetMin + Math.random() * (GLITCH.offsetMax - GLITCH.offsetMin);
      const group = Math.min(Math.random() < 0.5 ? 2 : 3, GLITCH.maxBands - bands.length);
      // Adjacent strips shift in alternating directions, so a group reads as one zigzag.
      for (let n = 0; n < group; n++) {
        bands.push({
          axis,
          from: start + n * bandSize,
          to: start + (n + 1) * bandSize,
          offset: n % 2 ? -offset : offset,
          life: 1,
        });
      }
    };

    const followDisc = (k: number): boolean => {
      if (!discPos.placed) return false;
      const t = 1 - Math.pow(1 - DISC_FOLLOW, k);
      discPos.x += (pointer.x - discPos.x) * t;
      discPos.y += (pointer.y - discPos.y) * t;
      disc.style.transform = `translate3d(${discPos.x}px, ${discPos.y}px, 0)`;
      return Math.abs(pointer.x - discPos.x) > 0.3 || Math.abs(pointer.y - discPos.y) > 0.3;
    };

    const tick = (now: number) => {
      raf = 0;
      const f = field;
      if (!f || leaving) return;
      const dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      const k = Math.min(dt * 60, 3);

      if (pointer.active) spawnBands(f, k);
      for (const b of bands) b.life -= GLITCH.decay * k;
      bands = bands.filter((b) => b.life > 0);

      const moving = stepField(f, pointer, dt);
      const discMoving = followDisc(k);
      draw();

      if (moving || discMoving || pointer.active || bands.length > 0) wake();
      else last = 0; // asleep: the next wake starts from a fresh frame time
    };

    const wake = () => {
      if (!raf && !reduce && !leaving) raf = requestAnimationFrame(tick);
    };

    const sizeDisc = () => {
      // Wide enough that the circle never clips the longest label's corners.
      const diagonal = Math.max(
        ...labels.map((label) => {
          const text = label.firstElementChild as HTMLElement | null;
          return text ? Math.hypot(text.offsetWidth, text.offsetHeight) : 0;
        }),
      );
      disc.style.setProperty('--disc', `${Math.ceil(diagonal + 16)}px`);
    };

    const swapLabel = () => {
      if (!disc.classList.contains('is-visible')) return;
      const outgoing = labels[labelIndex];
      labelIndex = (labelIndex + 1) % labels.length;
      const incoming = labels[labelIndex];
      if (!outgoing || !incoming) return;
      const move = { duration: 0.48, ease: ease.inOut };
      gsap.fromTo(outgoing, { yPercent: 0, opacity: 1 }, { yPercent: -100, opacity: 0, ...move });
      gsap.fromTo(incoming, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, ...move });
    };

    const enter = () => {
      if (leaving) return;
      leaving = true;
      try {
        localStorage.setItem(SEEN_KEY, '1');
      } catch {
        // Storage blocked: the gate simply shows again next visit.
      }
      root.classList.add('is-leaving');
      if (app) app.inert = false;
      resolve();
      window.setTimeout(destroy, LEAVE_MS + 50);
    };

    const destroy = () => {
      controller.abort();
      window.clearInterval(swapTimer);
      window.clearTimeout(resizeTimer);
      if (raf) cancelAnimationFrame(raf);
      gsap.killTweensOf(labels);
      root.remove();
    };

    root.addEventListener('click', enter, { signal });
    window.addEventListener(
      'resize',
      () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(layout, 150);
      },
      { signal },
    );

    if (!reduce) {
      root.addEventListener(
        'pointermove',
        (e) => {
          pointer.x = e.clientX;
          pointer.y = e.clientY;
          pointer.active = true;
          if (e.pointerType === 'mouse') {
            if (!discPos.placed) {
              // First move: snap into place instead of streaking in from the corner.
              discPos.x = e.clientX;
              discPos.y = e.clientY;
              discPos.placed = true;
            }
            disc.classList.add('is-visible');
          }
          wake();
        },
        { signal },
      );
      root.addEventListener(
        'pointerleave',
        () => {
          pointer.active = false;
          disc.classList.remove('is-visible');
          wake();
        },
        { signal },
      );
      swapTimer = window.setInterval(swapLabel, LABEL_SWAP_MS);
    }

    gsap.set(labels.slice(1), { yPercent: 100, opacity: 0 });
    button.focus({ preventScroll: true });

    // Draw once the display font is ready, or the name would rasterise in the fallback font.
    void document.fonts
      .load('800 100px "Archivo Variable"')
      .catch(() => undefined)
      .then(() => {
        if (leaving) return;
        layout();
        sizeDisc();
      });
  });
}

/** Alpha mask of the name, bottom-left like a poster, drawn at CSS-pixel size. */
function nameMask(width: number, height: number): Uint8ClampedArray {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const c = off.getContext('2d', { willReadFrequently: true });
  if (!c) return new Uint8ClampedArray(width * height * 4);

  const gutter =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 32;
  const setFont = (size: number) => {
    c.font = `800 ${size}px "Archivo Variable", "Helvetica Neue", Arial, sans-serif`;
    // Setting font resets stretch, so this must come after. Browsers without support get normal width.
    if ('fontStretch' in c) c.fontStretch = 'expanded';
  };

  setFont(100);
  const widest = Math.max(...NAME_LINES.map((line) => c.measureText(line).width));
  const size = Math.min(((width - gutter * 2) / widest) * 100, height * 0.3);
  setFont(size);
  c.fillStyle = '#fff';

  const lineHeight = size * 0.9;
  NAME_LINES.forEach((line, i) => {
    const baseline = height - gutter - (NAME_LINES.length - 1 - i) * lineHeight;
    c.fillText(line, gutter, baseline);
  });
  return c.getImageData(0, 0, width, height).data;
}

function readColours() {
  const css = getComputedStyle(document.documentElement);
  const bg = hexToRgb(css.getPropertyValue('--bg'));
  const paper = hexToRgb(css.getPropertyValue('--paper'));
  const dot: Rgb = [
    Math.round(bg[0] + (paper[0] - bg[0]) * DOT_MIX),
    Math.round(bg[1] + (paper[1] - bg[1]) * DOT_MIX),
    Math.round(bg[2] + (paper[2] - bg[2]) * DOT_MIX),
  ];
  return { bg, paper, dot };
}

function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.trim().replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgb([r, g, b]: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}