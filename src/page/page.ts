import { pages, type PageContent } from '../content/pages';
import { prefersReducedMotion } from '../motion/tokens';
import { navigate, onRouteChange, type PageId, type Route } from '../router';
import type { Shell } from '../shell/shell';
import { loadImage, standInArt } from '../viewer/media';
import { sweepReveal } from '../viewer/sweep';
import './page.css';

const SLIDE_MS = 700;
const START_MS = 200;
const SETTLE_MS = 800;
const SWAP_MS = 250;
const TOP_SCROLL_MS = 700;
const HOME: Route = { view: 'field', section: 'home' };

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

export function mountPages(app: HTMLElement, deps: { shell: Shell }): void {
  const { shell } = deps;
  const reduce = prefersReducedMotion();

  const root = document.createElement('section');
  root.className = 'sheet';
  root.hidden = true;
  root.setAttribute('aria-labelledby', 'sheet-title');
  root.innerHTML = `
    <button class="sheet-close display" type="button" data-cursor="close">Close</button>
    <div class="sheet-scroll">
      <div class="sheet-inner">
        <article class="sheet-hero">
          <figure class="sheet-figure">
            <img class="sheet-img" alt="" decoding="async" draggable="false" />
            <canvas class="sheet-sweep" aria-hidden="true"></canvas>
          </figure>
          <div class="sheet-text">
            <h2 class="sheet-title display" id="sheet-title" tabindex="-1"></h2>
            <div class="sheet-body"></div>
          </div>
        </article>
        <div class="sheet-foot">
          <button class="sheet-top pill display" type="button" data-cursor="pill">
            <span class="pill-fill" aria-hidden="true"></span><span class="pill-label">↑ Top</span>
          </button>
        </div>
      </div>
    </div>`;
  app.append(root);

  const $ = <T extends Element = HTMLElement>(selector: string): T => {
    const el = root.querySelector<T>(selector);
    if (!el) throw new Error(`Page sheet is missing ${selector}`);
    return el;
  };
  const scroller = $('.sheet-scroll');
  const hero = $('.sheet-hero');
  const figure = $('.sheet-figure');
  const img = $<HTMLImageElement>('.sheet-img');
  const canvas = $<HTMLCanvasElement>('.sheet-sweep');
  const title = $('.sheet-title');
  const body = $('.sheet-body');

  let current: PageId | null = null;
  let lastRoute: Route | null = null;
  let returnTo: Route = HOME;
  let canGoBack = false;
  let run = 0;
  let hideTimer = 0;

  const render = (id: PageId, page: PageContent) => {
    title.textContent = page.title;
    const paragraphs = page.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join('');
    const links = page.links
      ? `<ul class="sheet-links">${page.links
          .map(
            (link) =>
              `<li>${escapeHtml(link.label)}: <a href="${escapeHtml(link.href)}"${
                link.external ? ' target="_blank" rel="noopener"' : ''
              } data-cursor="small">${escapeHtml(link.text)}${
                link.external ? '<span class="visually-hidden"> (opens in a new tab)</span>' : ''
              }</a></li>`,
          )
          .join('')}</ul>`
      : '';
    body.innerHTML = paragraphs + links;
    [...body.children].forEach((child, i) => {
      if (child instanceof HTMLElement) child.style.setProperty('--i', String(i + 1));
    });

    figure.style.setProperty('--aspect', String(page.image.aspect));
    figure.classList.toggle('is-pixelated', page.image.pixelated === true);
    img.classList.remove('is-loaded');
    canvas.classList.remove('is-active');
    img.alt = page.image.alt;
    img.src =
      page.image.src ??
      standInArt({
        key: `page/${id}`,
        kicker: 'Hemang Chauhan',
        title: page.title,
        width: 1200,
        height: Math.round(1200 / page.image.aspect),
      });
  };

  const enter = (token: number) => {
    window.setTimeout(
      () => {
        if (token !== run) return;
        hero.classList.add('is-in');
        window.setTimeout(() => void reveal(token), reduce ? 0 : SETTLE_MS);
      },
      reduce ? 0 : START_MS,
    );
  };

  const reveal = async (token: number) => {
    if (token !== run) return;
    const image = await loadImage(img.src);
    if (token !== run) return;
    if (!reduce && image.naturalWidth) {
      canvas.classList.add('is-active');
      const tint = getComputedStyle(document.documentElement).getPropertyValue('--sweep-tint');
      await sweepReveal(canvas, image, { cell: 16, jitterX: 18, jitterY: 12, passMs: 280, tint });
      if (token !== run) return;
    }
    img.classList.add('is-loaded');
    canvas.classList.remove('is-active');
  };

  const open = (id: PageId) => {
    const token = ++run;
    window.clearTimeout(hideTimer);
    current = id;
    hero.classList.remove('is-in');
    render(id, pages[id]);
    root.hidden = false;
    scroller.scrollTop = 0;
    root.getBoundingClientRect(); // start the slide from below
    root.classList.add('is-open');
    shell.clock.setVisible(false);
    shell.retractRail();
    title.focus({ preventScroll: true });
    enter(token);
  };

  const swap = (id: PageId) => {
    const token = ++run;
    current = id;
    hero.classList.remove('is-in');
    window.setTimeout(
      () => {
        if (token !== run) return;
        render(id, pages[id]);
        scroller.scrollTop = 0;
        title.focus({ preventScroll: true });
        enter(token);
      },
      reduce ? 0 : SWAP_MS,
    );
  };

  const close = () => {
    ++run;
    current = null;
    const hadFocus = root.contains(document.activeElement);
    root.classList.remove('is-open');
    shell.clock.setVisible(true);
    shell.restoreRail();
    hideTimer = window.setTimeout(
      () => {
        root.hidden = true;
        hero.classList.remove('is-in');
      },
      reduce ? 0 : SLIDE_MS,
    );
    if (hadFocus) shell.stage.focus({ preventScroll: true });
  };

  onRouteChange((route) => {
    const from = lastRoute;
    lastRoute = route;
    if (route.view === 'page') {
      if (current === null) {
        canGoBack = from !== null && from.view !== 'page';
        returnTo = from && from.view !== 'page' ? from : HOME;
        open(route.page);
      } else if (current !== route.page) {
        canGoBack = false;
        swap(route.page);
      }
      return;
    }
    if (current !== null) close();
  });

  const requestClose = () => {
    if (current === null) return;
    if (canGoBack) history.back();
    else navigate(returnTo, { replace: true });
  };

  $('.sheet-close').addEventListener('click', requestClose);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current !== null) requestClose();
  });
  document.addEventListener('click', (e) => {
    const link = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-page]') : null;
    if (link && current !== null && link.dataset.page === current) {
      e.preventDefault();
      requestClose();
    }
  });

  $('.sheet-top').addEventListener('click', () => {
    const start = scroller.scrollTop;
    if (start <= 0) return;
    if (reduce) {
      scroller.scrollTop = 0;
      return;
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / TOP_SCROLL_MS);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      scroller.scrollTop = start * (1 - eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
