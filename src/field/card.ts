import type { Media, Project } from '../content';

/** A project card for the orbit field. Its clip (if any) is started and paused by the field. */
export function renderCard(project: Project, href: string): HTMLAnchorElement {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = href;
  card.draggable = false;
  card.dataset.cursor = 'word';
  card.dataset.cursorWords = 'Drag,Click';
  card.setAttribute('aria-label', project.name);

  const media: Media = project.cover ?? project.slides[0]?.media ?? { kind: 'none' };
  card.innerHTML = `<span class="card-frame">${mediaMarkup(media, project.name)}</span>`;
  return card;
}

function mediaMarkup(media: Media, name: string): string {
  switch (media.kind) {
    case 'video':
      return `
        <video class="card-media" muted loop playsinline preload="metadata" poster="${media.poster}" aria-hidden="true">
          <source src="${media.webm}" type="video/webm" />
          <source src="${media.mp4}" type="video/mp4" />
        </video>`;
    case 'image':
      return still(media.src);
    case 'embed':
      if (media.poster) return still(media.poster);
      return titleCard(name);
    default:
      return titleCard(name);
  }
}

const still = (src: string) =>
  `<img class="card-media" src="${src}" alt="" loading="lazy" decoding="async" draggable="false" />`;

// No media yet: a title card in the paper colour.
const titleCard = (name: string) => `<span class="card-title display">${escapeHtml(name)}</span>`;

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
