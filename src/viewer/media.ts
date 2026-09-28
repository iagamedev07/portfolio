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
  if (media?.kind === 'video' || media?.kind === 'embed') return media.aspect ?? DEFAULT_ASPECT;
  return DEFAULT_ASPECT;
}

export const isTextOnly = (slide: Slide | undefined): boolean => slide?.media.kind === 'none';

/**
 * A still for the slide: the poster for video and embeds, generated art for placeholders (and
 * embeds without a poster), null if text-only.
 */
export function slideStill(project: Project, index: number): string | null {
  const slide = project.slides[index];
  switch (slide?.media.kind) {
    case 'image':
      return slide.media.src;
    case 'video':
      return slide.media.poster;
    case 'embed':
      return slide.media.poster ?? placeholderPoster(project, index);
    case 'placeholder':
      return placeholderPoster(project, index);
    default:
      return null;
  }
}

/** Whether the visitor has turned slide sound on. Shared across slides; the viewer resets it on close. */
export interface SoundState {
  on: boolean;
}

/** The element shown large in the viewer: a looping clip for video, otherwise the still. */
export function mediaElement(
  project: Project,
  index: number,
  sound: SoundState = { on: false },
): HTMLElement | null {
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
    // Reduced motion shows the native controls, which have their own volume.
    if (slide.media.audio && !prefersReducedMotion()) return withSoundToggle(video, sound);
    return video;
  }
  const still = slideStill(project, index);
  if (slide.media.kind === 'embed') return embedElement(slide.media, still);
  if (!still) return null;
  const img = document.createElement('img');
  img.src = still;
  img.alt = slide.media.kind === 'image' ? slide.media.alt : ''; // stand-in art repeats the title
  img.decoding = 'async';
  img.draggable = false;
  return img;
}

const SPEAKER =
  '<svg class="sound-toggle-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path class="sound-waves" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

/**
 * A clip with sound: it starts muted (browsers won't autoplay sound), with a button to turn sound
 * on. Once on, it stays on for the next slides with sound until the viewer closes.
 */
function withSoundToggle(video: HTMLVideoElement, sound: SoundState): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'viewer-sound';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sound-toggle display';
  button.dataset.cursor = 'small';
  const show = () => {
    video.muted = !sound.on;
    wrap.classList.toggle('is-on', sound.on);
    button.innerHTML = `${SPEAKER}<span>${sound.on ? 'Sound off' : 'Sound on'}</span>`;
  };
  // The frame's own click steps slides, so the button's click stops here.
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    sound.on = !sound.on;
    show();
    if (video.paused) video.play().catch(() => undefined);
  });
  // Sound already on from an earlier slide: if the browser refuses to autoplay it, fall back to muted.
  video.addEventListener(
    'loadeddata',
    () => {
      if (!video.paused) return;
      video.play().catch(() => {
        sound.on = false;
        show();
        video.play().catch(() => undefined);
      });
    },
    { once: true },
  );
  show();
  wrap.append(video, button);
  return wrap;
}

type EmbedMedia = Extract<Slide['media'], { kind: 'embed' }>;

/**
 * A player from another site, lazy: the poster and a play button until clicked, then the iframe
 * (which plays with sound, since the click allows it). Changing slide removes it, which stops it.
 */
function embedElement(media: EmbedMedia, still: string | null): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'viewer-embed';
  if (still) {
    const img = document.createElement('img');
    // Same CORS mode as the sweep and filmstrip, so the browser can share one cached copy.
    if (isRemote(still)) img.crossOrigin = 'anonymous';
    img.src = still;
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    wrap.append(img);
  }
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'embed-play display';
  play.dataset.cursor = 'word';
  play.dataset.cursorWords = 'Play';
  play.setAttribute('aria-label', `Play video: ${media.title}`);
  play.innerHTML = '<span class="embed-play-icon" aria-hidden="true"></span><span>Play</span>';
  // The frame's own click steps slides, so the play click stops here.
  play.addEventListener('click', (e) => {
    e.stopPropagation();
    const iframe = document.createElement('iframe');
    iframe.src = media.src;
    iframe.title = media.title;
    iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    wrap.classList.add('is-playing');
    wrap.replaceChildren(iframe);
    iframe.focus();
  });
  wrap.append(play);
  return wrap;
}

/** Resolves once the image can be drawn (or has failed, in which case the sweep draws nothing). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = 'async';
  if (isRemote(src)) img.crossOrigin = 'anonymous'; // the sweep reads its pixels
  img.src = src;
  return img.decode().then(
    () => img,
    () => img,
  );
}

/** Stand-in art until the footage lands: the slide title on a paper card, like a held print. */
function placeholderPoster(project: Project, index: number): string {
  return standInArt({
    key: `${project.slug}/${index}`,
    kicker: project.name,
    corner: `${pad(index + 1)} / ${pad(project.slides.length)}`,
    title: project.slides[index]?.title ?? '',
  });
}

export interface StandIn {
  /** Cache key. */
  key: string;
  /** Small line top-left. */
  kicker: string;
  /** Small line top-right. */
  corner?: string;
  /** Big title, bottom-left, sized to fit. */
  title: string;
  width?: number;
  height?: number;
}

/** A paper card with a kicker and a big title, drawn with the display font. Returns a data URL. */
export function standInArt({
  key,
  kicker,
  corner = '',
  title,
  width = POSTER_W,
  height = POSTER_H,
}: StandIn): string {
  const cached = posters.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
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
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.fillStyle = ink;
  ctx.textBaseline = 'top';
  font(30);
  ctx.fillText(kicker.toUpperCase(), margin, margin);
  ctx.textAlign = 'right';
  ctx.fillText(corner, width - margin, margin);
  ctx.textAlign = 'left';

  // The title, as big as fits in the lower half.
  const text = title.toUpperCase();
  const maxWidth = width - margin * 2;
  let size = 160;
  let lines: string[] = [];
  for (; size > 56; size -= 8) {
    font(size);
    lines = wrap(ctx, text, maxWidth);
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    if (widest <= maxWidth && lines.length * size <= height * 0.5) break;
  }
  font(size);
  lines = wrap(ctx, text, maxWidth);
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, i) => {
    ctx.fillText(line, margin, height - margin - (lines.length - 1 - i) * size * 0.95);
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

/** A poster from another site (embed thumbnails), as opposed to our own files and generated art. */
export const isRemote = (src: string): boolean => /^https?:/.test(src);

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}
