import type { Media, Project } from '../content';
import { prefersReducedMotion } from '../motion/tokens';

let playing: HTMLVideoElement | null = null;

export function renderCard(project: Project, href: string): HTMLAnchorElement {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = href;
  card.draggable = false;
  card.dataset.cursor = 'word';
  card.dataset.cursorWords = 'Drag,Click';
  card.setAttribute('aria-label', project.name);

  const media: Media = project.cover ?? project.slides[0]?.media ?? { kind: 'none' };
  const tag =
    media.kind === 'none' || media.kind === 'placeholder'
      ? ''
      : `<span class="card-tag display" aria-hidden="true">${escapeHtml(project.name)}</span>`;
  card.innerHTML = `
    <span class="card-frame">${mediaMarkup(media, project.name)}</span>
    <span class="card-dot" aria-hidden="true"></span>${tag}`;

  const video = card.querySelector('video');
  if (video) wirePreview(card, video);
  return card;
}

function mediaMarkup(media: Media, name: string): string {
  switch (media.kind) {
    case 'video':
      return `
        <video class="card-media" muted loop playsinline preload="none" poster="${media.poster}" aria-hidden="true">
          <source src="${media.webm}" type="video/webm" />
          <source src="${media.mp4}" type="video/mp4" />
        </video>`;
    case 'image':
      return `<img class="card-media" src="${media.src}" alt="" width="${media.width}" height="${media.height}" loading="lazy" decoding="async" draggable="false" />`;
    default:
      // No media yet: a title card in the paper colour, like the reference's white-framed photos.
      return `<span class="card-title display">${escapeHtml(name)}</span>`;
  }
}

function wirePreview(card: HTMLElement, video: HTMLVideoElement): void {
  const start = () => {
    if (prefersReducedMotion()) return; // the poster stays
    if (playing && playing !== video) stop(playing);
    playing = video;
    video.play().catch(() => undefined); // autoplay can be refused; the poster stays
  };
  card.addEventListener('pointerenter', start);
  card.addEventListener('focus', start);
  card.addEventListener('pointerleave', () => stop(video));
  card.addEventListener('blur', () => stop(video));
}

function stop(video: HTMLVideoElement): void {
  video.pause();
  video.currentTime = 0;
  if (playing === video) playing = null;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
