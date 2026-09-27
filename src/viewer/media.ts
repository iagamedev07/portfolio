import type { Project, Slide } from '../content';
import { prefersReducedMotion } from '../motion/tokens';

// Slide media for the viewer and filmstrip: real clips and images, or generated stand-in art
// for slides whose footage isn't in yet.

export const DEFAULT_ASPECT = 16 / 9;

const POSTER_W = 1600;
const POSTER_H = 900;
const posters = new Map<string, string>();

export function slideAspect(slide: Slide | undefined): number {
  const media = slide?.media;
  if (media?.kind === 'image') return media.width / media.height;
  if (media?.kind === 'video') return media.aspect ?? DEFAULT_ASPECT;
  return DEFAULT_ASPECT;
}

export const isTextOnly = (slide: Slide | undefined): boolean => slide?.media.kind === 'none';

/** A still for the slide: the poster for video, generated art for placeholders, null if text-only. */
export function slideStill(project: Project, index: number): string | null {
  const slide = project.slides[index];
  switch (slide?.media.kind) {
    case 'image':
      return slide.media.src;
    case 'video':
      return slide.media.poster;
    case 'placeholder':
      return placeholderPoster(project, index);
    default:
      return null;
  }
}

/** The element shown large in the viewer: a looping clip for video, otherwise the still. */
export function mediaElement(project: Project, index: number): HTMLElement | null {
  const slide = project.slides[index];
  if (!slide) return null;
  if (slide.media.kind === 'video') {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = !prefersReducedMotion(); // reduced motion: the poster, with controls to play
    video.controls = prefersReducedMotion();
    video.poster = slide.media.poster;
    video.setAttribute('aria-label', slide.media.alt);
    for (const [src, type] of [
      [slide.media.webm, 'video/webm'],
      [slide.media.mp4, 'video/mp4'],
    ] as const) {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      video.append(source);
    }
    return video;
  }
  const still = slideStill(project, index);
  if (!still) return null;
  const img = document.createElement('img');
  img.src = still;
  img.alt = slide.media.kind === 'image' ? slide.media.alt : ''; // stand-in art repeats the title
  img.decoding = 'async';
  img.draggable = false;
  return img;
}

/** Resolves once the image can be drawn (or has failed, in which case the sweep draws nothing). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  return img.decode().then(
    () => img,
    () => img,
  );
}

/** Stand-in art until the footage lands: the slide title on a paper card, like a held print. */
function placeholderPoster(project: Project, index: number): string {
  const key = `${project.slug}/${index}`;
  const cached = posters.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const css = getComputedStyle(document.documentElement);
  const paper = css.getPropertyValue('--paper').trim() || '#e8e6de';
  const ink = css.getPropertyValue('--ink').trim() || '#0a0a0b';
  const font = (px: number) => {
    ctx.font = `800 ${px}px "Archivo Variable", "Helvetica Neue", Arial, sans-serif`;
    if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
  };
  const margin = 96;

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, POSTER_W - 96, POSTER_H - 96);

  ctx.fillStyle = ink;
  ctx.textBaseline = 'top';
  font(30);
  ctx.fillText(project.name.toUpperCase(), margin, margin);
  ctx.textAlign = 'right';
  ctx.fillText(`${pad(index + 1)} / ${pad(project.slides.length)}`, POSTER_W - margin, margin);
  ctx.textAlign = 'left';

  // The title, as big as fits in the lower half.
  const title = (project.slides[index]?.title ?? '').toUpperCase();
  const maxWidth = POSTER_W - margin * 2;
  let size = 160;
  let lines: string[] = [];
  for (; size > 56; size -= 8) {
    font(size);
    lines = wrap(ctx, title, maxWidth);
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    if (widest <= maxWidth && lines.length * size <= POSTER_H * 0.5) break;
  }
  font(size);
  lines = wrap(ctx, title, maxWidth);
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, i) => {
    ctx.fillText(line, margin, POSTER_H - margin - (lines.length - 1 - i) * size * 0.95);
  });

  const url = canvas.toDataURL('image/jpeg', 0.86);
  posters.set(key, url);
  return url;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}
