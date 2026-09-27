import { gsap } from 'gsap';
import type { Project } from '../content';
import { ease, prefersReducedMotion } from '../motion/tokens';
import { drawDithered } from './dither';
import { isTextOnly, pad, slideAspect, slideStill } from './media';

// The filmstrip (docs/interactions.md 5.8): one thumbnail per slide of the open project,
// bottom-aligned above the bar. Hover grows a cell 1.2x (its neighbours shift to make room)
// and fades in a colour-dithered copy; the current slide wears the marching ants.

const HOVER_WIDTH = 115; // 1.2x the 96px cell

export interface Strip {
  el: HTMLElement;
  setProject(project: Project, active: number): void;
  setActive(index: number): void;
  activeCell(): HTMLElement | null;
  /** Close: every other cell vanishes at once, leaving the one the image shrinks into. */
  hideOthers(): void;
  reset(): void;
}

export function createStrip(onSelect: (index: number) => void): Strip {
  const el = document.createElement('nav');
  el.className = 'viewer-strip';
  el.setAttribute('aria-label', 'Slides');
  let cells: HTMLButtonElement[] = [];

  const setActive = (index: number) => {
    cells.forEach((cell, i) => {
      const current = i === index;
      cell.classList.toggle('ants', current);
      if (current) cell.setAttribute('aria-current', 'true');
      else cell.removeAttribute('aria-current');
    });
    // Phones scroll the strip sideways: keep the current slide in the middle.
    cells[index]?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const showDither = (cell: HTMLButtonElement) => {
    const img = cell.querySelector('img');
    if (!img?.complete || !img.naturalWidth || prefersReducedMotion()) return;
    let canvas = cell.querySelector<HTMLCanvasElement>('.strip-dither');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'strip-dither';
      canvas.setAttribute('aria-hidden', 'true');
      // Drawn at the grown size straight away, so it doesn't wait for the width transition.
      const aspect = Number(cell.style.getPropertyValue('--aspect')) || 16 / 9;
      canvas.width = HOVER_WIDTH;
      canvas.height = Math.round(HOVER_WIDTH / aspect);
      const ctx = canvas.getContext('2d');
      if (ctx) drawDithered(ctx, img, canvas.width, canvas.height, 'color');
      cell.append(canvas);
    }
  };

  return {
    el,
    setProject(project, active) {
      el.replaceChildren();
      cells = project.slides.map((slide, i) => {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'strip-cell';
        cell.dataset.cursor = 'xray';
        cell.style.setProperty('--aspect', String(slideAspect(slide)));
        cell.setAttribute('aria-label', `Slide ${i + 1}: ${slide.title}`);
        const still = isTextOnly(slide) ? null : slideStill(project, i);
        if (still) {
          const img = document.createElement('img');
          img.src = still;
          img.alt = '';
          img.draggable = false;
          img.decoding = 'async';
          cell.append(img);
        } else {
          cell.classList.add('is-text');
          cell.insertAdjacentHTML(
            'beforeend',
            `<span class="strip-index display">${pad(i + 1)}</span>`,
          );
        }
        cell.addEventListener('pointerenter', () => showDither(cell));
        cell.addEventListener('focus', () => showDither(cell));
        cell.addEventListener('click', () => onSelect(i));
        el.append(cell);
        return cell;
      });
      setActive(active);
      if (!prefersReducedMotion()) {
        gsap.fromTo(
          cells,
          { yPercent: 100, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.4,
            ease: ease.out,
            stagger: 0.03,
          },
        );
      }
    },
    setActive,
    activeCell: () => el.querySelector<HTMLElement>('.strip-cell[aria-current]'),
    hideOthers() {
      for (const cell of cells) {
        if (!cell.hasAttribute('aria-current')) cell.style.opacity = '0';
      }
    },
    reset() {
      gsap.killTweensOf(cells);
      cells = [];
      el.replaceChildren();
    },
  };
}
