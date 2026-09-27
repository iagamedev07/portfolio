import { gsap } from 'gsap';
import { accentRgb } from '../cursor/accent';
import { rgbString } from '../lib/color';
import { MOBILE_QUERY, prefersReducedMotion } from '../motion/tokens';

const SIZE = 144;
const UNIT = SIZE / 500;
const REDRAW_MS = 100;

export interface Clock {
  setVisible(visible: boolean): void;
}

export function startClock(face: HTMLCanvasElement, readout: HTMLElement): Clock {
  readout.innerHTML = `
    <span class="clock-digits" data-part="h">00</span><span>:</span>
    <span class="clock-mask"><span class="clock-digits" data-part="m">00</span></span><span>:</span>
    <span class="clock-mask"><span class="clock-digits" data-part="s">00</span></span>`;
  const hours = readout.querySelector<HTMLElement>('[data-part="h"]');
  const minutes = readout.querySelector<HTMLElement>('[data-part="m"]');
  const seconds = readout.querySelector<HTMLElement>('[data-part="s"]');

  const ctx = face.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  face.width = SIZE * dpr;
  face.height = SIZE * dpr;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

  const phone = window.matchMedia(MOBILE_QUERY);
  let visible = true;
  let last = 0;
  let shownMinute = '';

  const bar = (
    c: CanvasRenderingContext2D,
    turns: number,
    w: number,
    from: number,
    length: number,
  ) => {
    c.save();
    c.translate(SIZE / 2, SIZE / 2);
    c.rotate(turns * Math.PI * 2);
    c.fillRect((-w / 2) * UNIT, from * UNIT, w * UNIT, length * UNIT);
    c.restore();
  };

  const draw = (now: Date) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = rgbString(accentRgb());
    for (let i = 0; i < 60; i++) {
      const [w, length] = i % 15 === 0 ? [6, 35] : i % 5 === 0 ? [4, 25] : [2, 20];
      bar(ctx, i / 60, w, -230, length);
    }
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    bar(ctx, (h + m / 60) / 12, 10, -150, 150);
    bar(ctx, (m + s / 60) / 60, 10, -200, 200);
    bar(ctx, s / 60, 4, -180, 180);
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, 5 * UNIT, 0, Math.PI * 2);
    ctx.fill();
  };

  const update = (now: Date) => {
    if (!hours || !minutes || !seconds) return;
    hours.textContent = pad(now.getHours());
    const minute = pad(now.getMinutes());
    const second = pad(now.getSeconds());
    if (minute === shownMinute) {
      seconds.textContent = second;
      return;
    }
    const first = shownMinute === '';
    shownMinute = minute;
    if (first || prefersReducedMotion()) {
      minutes.textContent = minute;
      seconds.textContent = second;
      return;
    }
    roll(minutes, minute);
    roll(seconds, second);
  };

  const tick = (t: number) => {
    if (visible && !phone.matches && t - last >= REDRAW_MS) {
      last = t;
      const now = new Date();
      draw(now);
      update(now);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return {
    setVisible(next) {
      visible = next;
      face.classList.toggle('is-hidden', !next);
      readout.classList.toggle('is-hidden', !next);
    },
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function roll(el: HTMLElement, text: string): void {
  gsap
    .timeline()
    .to(el, { y: -24, opacity: 0, duration: 0.2, ease: 'power1.inOut' })
    .add(() => {
      el.textContent = text;
    })
    .fromTo(el, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2, ease: 'power1.inOut' });
}
