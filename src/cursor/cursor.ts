import { cancelScramble, scrambleText } from '../motion/scramble';
import { MOBILE_QUERY } from '../motion/tokens';
import './cursor.css';

const STATES = [
  'hide',
  'idle',
  'filled',
  'pill',
  'small',
  'word',
  'prev',
  'next',
  'close',
  'xray',
] as const;
export type CursorState = (typeof STATES)[number];

const ICONS: Partial<Record<CursorState, string>> = { prev: '←', next: '→', close: '✕' };
const CLICKABLE = 'a[href], button:not(:disabled), [role="button"], label, summary, select';
const WORD = { cycleMs: 1500, scrambleMs: 380, fontPx: 19, tracking: 0.05, min: 77, padding: 36 };

const isState = (value: string): value is CursorState =>
  (STATES as readonly string[]).includes(value);

export function cursorSupported(): boolean {
  return (
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia(MOBILE_QUERY).matches
  );
}

export function startCursor(): { refresh(): void } {
  const root = document.documentElement;
  const el = document.createElement('div');
  el.className = 'cursor';
  el.dataset.state = 'hide';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<div class="cursor-disc"><span class="cursor-label"></span><span class="cursor-dot"></span></div>';
  document.body.append(el);

  const disc = el.querySelector<HTMLElement>('.cursor-disc');
  const label = el.querySelector<HTMLElement>('.cursor-label');
  if (!disc || !label) return { refresh: () => undefined };

  const measure = document.createElement('canvas').getContext('2d');
  let state: CursorState = 'hide';
  let words: string[] = [];
  let wordIndex = 0;
  let wordTimer = 0;
  let lastTarget: Element | null = null;
  let hasMouse = false;
  let x = 0;
  let y = 0;
  let raf = 0;

  const wordSize = (word: string): number => {
    if (!measure) return WORD.min;
    measure.font = `800 ${WORD.fontPx}px "Archivo Variable", sans-serif`;
    if ('fontStretch' in measure) measure.fontStretch = 'expanded';
    const text = word.toUpperCase();
    const width = measure.measureText(text).width + text.length * WORD.fontPx * WORD.tracking;
    return Math.max(WORD.min, Math.ceil(width) + WORD.padding);
  };

  const showWord = (word: string, animate: boolean) => {
    disc.style.setProperty('--size', `${wordSize(word)}px`);
    if (animate) scrambleText(label, word, WORD.scrambleMs);
    else label.textContent = word;
  };

  const setState = (next: CursorState, source: HTMLElement | null) => {
    const nextWords = next === 'word' ? readWords(source) : [];
    if (next === state && nextWords.join() === words.join()) return;

    window.clearInterval(wordTimer);
    cancelScramble(label);
    state = next;
    words = nextWords;
    el.dataset.state = next;
    root.classList.toggle('has-custom-cursor', next !== 'hide');
    disc.style.removeProperty('--size');
    label.textContent = ICONS[next] ?? '';

    if (next === 'word' && words.length > 0) {
      wordIndex = 0;
      showWord(words[0] ?? '', false);
      if (words.length > 1) {
        wordTimer = window.setInterval(() => {
          wordIndex = (wordIndex + 1) % words.length;
          showWord(words[wordIndex] ?? '', true);
        }, WORD.cycleMs);
      }
    }
  };

  const resolve = (target: Element | null) => {
    lastTarget = target;
    const tagged = target?.closest<HTMLElement>('[data-cursor]');
    const tag = tagged?.dataset.cursor;
    if (tagged && tag && isState(tag)) setState(tag, tagged);
    else setState(target?.closest(CLICKABLE) ? 'filled' : 'idle', null);
  };

  const place = () => {
    raf = 0;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const hide = () => {
    hasMouse = false;
    lastTarget = null;
    setState('hide', null);
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') {
        hide();
        return;
      }
      x = e.clientX;
      y = e.clientY;
      if (!hasMouse) {
        hasMouse = true;
        place();
      } else if (!raf) {
        raf = requestAnimationFrame(place);
      }
      const target = e.target instanceof Element ? e.target : null;
      if (target !== lastTarget || state === 'hide') resolve(target);
    },
    { passive: true },
  );
  root.addEventListener('mouseleave', hide);
  window.addEventListener('blur', hide);

  return {
    refresh() {
      if (hasMouse) resolve(document.elementFromPoint(x, y));
    },
  };
}

function readWords(source: HTMLElement | null): string[] {
  const words = source?.dataset.cursorWords
    ?.split(',')
    .map((word) => word.trim())
    .filter(Boolean);
  return words?.length ? words : ['Click'];
}
