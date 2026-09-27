import { getProject, getSection, sections, type SectionId } from '../content';
import { prefersReducedMotion } from '../motion/tokens';
import { formatRoute, onRouteChange, type PageId, type Route } from '../router';
import { startClock, type Clock } from './clock';
import { setupMenu } from './menu';
import { setupRail } from './pills';
import './shell.css';

// Persistent chrome around the stage: wordmark, section pills, bottom bar, clock, and the phone
// top bar, menu and pill bar (docs/interactions.md 5.2, 5.13, 5.14, 5.15).

const NAME = 'Hemang Chauhan';
const YOUTUBE_URL = 'https://www.youtube.com/c/AeroBlizz';
const CV_URL = `${import.meta.env.BASE_URL}Hemang_Chauhan_CV.pdf`;

interface BarLink {
  label: string;
  href: string;
  page?: PageId;
  external?: boolean;
  download?: boolean;
  hint?: string;
}

const BAR_LINKS: BarLink[] = [
  { label: 'About', href: formatRoute({ view: 'page', page: 'about' }), page: 'about' },
  { label: 'YouTube', href: YOUTUBE_URL, external: true, hint: '(opens in a new tab)' },
  { label: 'CV', href: CV_URL, download: true, hint: '(PDF)' },
  { label: 'Contact', href: formatRoute({ view: 'page', page: 'contact' }), page: 'contact' },
];

export interface Shell {
  /** The pill stagger. Runs once, as the gate fades or straight away without it. */
  playIntro(): void;
  /** Where the field (Phase 3) and viewer (Phase 4) mount. */
  stage: HTMLElement;
  clock: Clock;
  /** Screen rect of a section's visible pill (rail on desktop, pill bar on phone). */
  pillRect(section: SectionId): DOMRect | null;
  /** Tucks the section pills away (the viewer does this so its left arrow is clear). */
  retractRail(): void;
}

export function mountShell(app: HTMLElement): Shell {
  app.innerHTML = `
    <a class="skip-link display" href="#stage">Skip to content</a>
    <div class="atmosphere" aria-hidden="true"></div>
    <header class="topbar">
      <a class="wordmark display ants" href="#/" data-cursor="small" aria-label="${NAME}, home" translate="no">
        <span class="wordmark-text" aria-hidden="true">Hemang<br />Chauhan</span>
      </a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="menu">
        <span class="visually-hidden">Menu</span>
        <span class="burger-line is-top"></span>
        <span class="burger-line is-bottom"></span>
      </button>
    </header>
    <nav class="rail" aria-label="Sections">${pills()}</nav>
    <div class="rail-zone" aria-hidden="true"></div>
    <main class="stage" id="stage" tabindex="-1">
      <h1 class="visually-hidden" id="stage-title">${NAME}</h1>
    </main>
    <canvas class="clock-face" aria-hidden="true"></canvas>
    <p class="clock-time display" aria-hidden="true"></p>
    <footer class="bar">
      <nav aria-label="Links">${BAR_LINKS.map(rollLink).join('')}</nav>
    </footer>
    <div class="pillbar-fade" aria-hidden="true"></div>
    <nav class="pillbar" aria-label="Sections">${pills()}</nav>
    <nav class="menu" id="menu" aria-label="Menu">${BAR_LINKS.map(menuLink).join('')}</nav>`;

  const $ = <T extends Element = HTMLElement>(selector: string): T => {
    const el = app.querySelector<T>(selector);
    if (!el) throw new Error(`Shell is missing ${selector}`);
    return el;
  };

  const stage = $('.stage');
  const title = $('#stage-title');
  const rail = setupRail($('.rail'), $('.rail-zone'));
  const clock = startClock($<HTMLCanvasElement>('.clock-face'), $('.clock-time'));
  setupMenu($<HTMLButtonElement>('.burger'), $('.menu'), [stage, $('.pillbar')]);
  setupTilt($('.wordmark'), $('.wordmark-text'));

  // A plain #stage hash would be read as a route, so move focus by hand instead.
  $('.skip-link').addEventListener('click', (e) => {
    e.preventDefault();
    stage.focus();
  });

  const pillLinks = [...app.querySelectorAll<HTMLElement>('.pill')];
  const pageLinks = [...app.querySelectorAll<HTMLElement>('[data-page]')];

  onRouteChange((route) => {
    const section = route.view === 'page' ? null : route.section;
    const page = route.view === 'page' ? route.page : null;
    for (const link of pillLinks) setCurrent(link, link.dataset.section === section);
    for (const link of pageLinks) setCurrent(link, link.dataset.page === page);

    const heading = routeTitle(route);
    title.textContent = heading ?? NAME;
    document.title = heading ? `${heading} · ${NAME}` : `${NAME} · Game developer`;
  });

  const pillRect = (section: SectionId) => {
    const pill = pillLinks.find(
      (link) => link.dataset.section === section && link.getClientRects().length > 0,
    );
    return pill?.getBoundingClientRect() ?? null;
  };

  return { playIntro: rail.playIntro, retractRail: rail.retract, stage, clock, pillRect };
}

function pills(): string {
  return sections.map((s, i) => pill(s.id, s.label, i)).join('');
}

function pill(id: SectionId, label: string, index: number): string {
  const href = formatRoute({ view: 'field', section: id });
  return `
    <a class="pill display" href="${href}" data-section="${id}" data-cursor="pill" style="--i: ${index}">
      <span class="pill-fill" aria-hidden="true"></span><span class="pill-label">${label}</span>
    </a>`;
}

function rollLink(link: BarLink): string {
  return `
    <a class="bar-link display" href="${link.href}" ${linkAttrs(link)} data-cursor="small">
      <span class="bar-link-mask" aria-hidden="true">
        <span class="bar-link-track"><span>${link.label}</span><span>${link.label}</span></span>
      </span>
      <span class="visually-hidden">${link.label}${hint(link)}</span>
    </a>`;
}

function menuLink(link: BarLink): string {
  return `<a class="menu-link display" href="${link.href}" ${linkAttrs(link)}>${link.label}<span class="visually-hidden">${hint(link)}</span></a>`;
}

function linkAttrs(link: BarLink): string {
  return [
    link.page ? `data-page="${link.page}"` : '',
    link.external ? 'target="_blank" rel="noopener"' : '',
    link.download ? 'download' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function hint(link: BarLink): string {
  return link.hint ? ` ${link.hint}` : '';
}

function setCurrent(el: HTMLElement, current: boolean): void {
  if (current) el.setAttribute('aria-current', 'page');
  else el.removeAttribute('aria-current');
}

function routeTitle(route: Route): string | null {
  if (route.view === 'page') return route.page === 'about' ? 'About' : 'Contact';
  if (route.view === 'viewer') {
    const project = getProject(route.project);
    return project ? `${project.name} ${route.slide + 1}/${project.slides.length}` : null;
  }
  return route.section === 'home' ? null : (getSection(route.section)?.label ?? null);
}

/** Wordmark hover: tilts toward the pointer like the viewer image (±20°, perspective 760). */
function setupTilt(target: HTMLElement, inner: HTMLElement): void {
  if (prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }
  const MAX = 20;
  target.addEventListener('pointermove', (e) => {
    const r = target.getBoundingClientRect();
    const rx = (0.5 - (e.clientY - r.top) / r.height) * 2 * MAX;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 2 * MAX;
    inner.style.transform = `perspective(760px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  });
  target.addEventListener('pointerleave', () => {
    inner.style.transform = '';
  });
}
