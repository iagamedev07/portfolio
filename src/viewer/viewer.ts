import { gsap } from 'gsap';
import { getProject, getSection, nextProject, type Project, type SectionId } from '../content';
import { cursorSupported } from '../cursor/cursor';
import type { Field } from '../field/field';
import { scrambleText } from '../motion/scramble';
import { ease, MOBILE_QUERY, prefersReducedMotion } from '../motion/tokens';
import { formatRoute, navigate, onRouteChange, type Route } from '../router';
import type { Shell } from '../shell/shell';
import { isTextOnly, loadImage, mediaElement, pad, slideAspect, slideStill } from './media';
import { createStrip } from './strip';
import { sweepReveal } from './sweep';
import './viewer.css';

// The project viewer (docs/interactions.md 5.5 to 5.11). It follows the router: a viewer route
// opens it (flying out of the card or pill that was clicked), slide routes sweep between slides,
// and leaving the route closes it back into the filmstrip.

type ViewerRoute = Extract<Route, { view: 'viewer' }>;

export interface ViewerDeps {
  field: Field;
  shell: Shell;
  /** Called when what's under the mouse changed without it moving (cursor refresh). */
  onScreenChange?: () => void;
  setTrail?: (on: boolean) => void;
}

const OPEN_MOVE_S = 0.62;
const READY_MS = 350;
const SHRINK_S = 0.28;
const MAX_TILT = 20;
const SWIPE_PX = 40;
const SCRAMBLE_MS = { label: 420, title: 600, body: 780 };

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

export function mountViewer(app: HTMLElement, deps: ViewerDeps): void {
  const { field, shell } = deps;
  const reduce = prefersReducedMotion();
  const phone = window.matchMedia(MOBILE_QUERY);

  const root = document.createElement('section');
  root.className = 'viewer';
  root.hidden = true;
  root.setAttribute('aria-label', 'Project viewer');
  root.innerHTML = `
    <div class="viewer-backdrop"></div>
    <div class="viewer-body">
      <div class="viewer-media">
        <div class="viewer-back" aria-hidden="true"></div>
        <p class="viewer-hint display" aria-hidden="true">Scroll for info</p>
        <div class="viewer-frame ants" data-cursor="hide">
          <div class="viewer-shot"></div>
          <canvas class="viewer-sweep" aria-hidden="true"></canvas>
        </div>
      </div>
      <div class="viewer-text">
        <p class="viewer-label"><span class="viewer-project" translate="no"></span><span class="viewer-count"></span></p>
        <h2 class="viewer-title display" tabindex="-1"></h2>
        <p class="viewer-desc"></p>
        <div class="viewer-meta"></div>
        <div class="viewer-actions"></div>
      </div>
    </div>
    <button class="viewer-close display" type="button" data-cursor="close">Close</button>
    <button class="viewer-arrow is-prev" type="button" data-cursor="prev" aria-label="Previous slide">←</button>
    <button class="viewer-arrow is-next" type="button" data-cursor="next" aria-label="Next slide">→</button>
    <div class="viewer-navdisc display" aria-hidden="true">
      <span class="navdisc-mask is-arrow"><span></span></span>
      <span class="navdisc-mask is-num"><span></span></span>
    </div>
    <p class="viewer-live visually-hidden" aria-live="polite"></p>`;
  app.append(root);

  const $ = <T extends Element = HTMLElement>(selector: string): T => {
    const el = root.querySelector<T>(selector);
    if (!el) throw new Error(`Viewer is missing ${selector}`);
    return el;
  };
  const backdrop = $('.viewer-backdrop');
  const body = $('.viewer-body');
  const media = $('.viewer-media');
  const back = $('.viewer-back');
  const frame = $('.viewer-frame');
  const shot = $('.viewer-shot');
  const sweepCanvas = $<HTMLCanvasElement>('.viewer-sweep');
  const text = $('.viewer-text');
  const projectLabel = $('.viewer-project');
  const count = $('.viewer-count');
  const title = $('.viewer-title');
  const desc = $('.viewer-desc');
  const meta = $('.viewer-meta');
  const actions = $('.viewer-actions');
  const closeButton = $('.viewer-close');
  const prevButton = $('.viewer-arrow.is-prev');
  const nextButton = $('.viewer-arrow.is-next');
  const disc = $('.viewer-navdisc');
  const live = $('.viewer-live');
  const hint = $('.viewer-hint');
  const swapArrow = swapper($('.navdisc-mask.is-arrow > span'));
  const swapNumber = swapper($('.navdisc-mask.is-num > span'));

  let project: Project | null = null;
  let section: SectionId = 'home';
  let slide = 0;
  let openedFromField = false;
  let busy = false;
  let pending: Route | null = null;
  let lastRoute: Route | null = null;

  const strip = createStrip((index) => go(index));
  root.insertBefore(strip.el, closeButton);

  // ---------- content ----------

  const setMedia = (p: Project, i: number) => {
    const s = p.slides[i];
    root.classList.toggle('is-text-only', isTextOnly(s));
    root.classList.toggle('is-single', p.slides.length < 2);
    media.style.setProperty('--aspect', String(slideAspect(s)));
    const element = mediaElement(p, i);
    shot.replaceChildren(...(element ? [element] : []));
    // The offset card behind is the next slide, like a stack of prints.
    const behind = slideStill(p, (i + 1) % p.slides.length);
    back.innerHTML = behind ? `<img src="${behind}" alt="" draggable="false" />` : '';
  };

  const fillText = (p: Project, i: number) => {
    const s = p.slides[i];
    if (!s) return;
    count.textContent = `${pad(i + 1)} / ${pad(p.slides.length)}`;
    title.dataset.full = s.title;
    desc.dataset.full = s.description;
    meta.innerHTML = s.meta.length
      ? `<span class="viewer-rule"></span>${s.meta.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}`
      : '';

    const buttons: string[] = [];
    if (s.link) {
      buttons.push(
        `<a class="viewer-button display" href="${escapeHtml(s.link.href)}" target="_blank" rel="noopener" data-cursor="small">${escapeHtml(s.link.label)}<span class="visually-hidden"> (opens in a new tab)</span></a>`,
      );
    }
    const next = i === p.slides.length - 1 ? nextProject(section, p.slug) : undefined;
    const nextName = next ? getProject(next.slug)?.name : undefined;
    if (next && nextName) {
      const href = formatRoute({
        view: 'viewer',
        section: next.section,
        project: next.slug,
        slide: 0,
      });
      buttons.push(
        `<a class="viewer-button is-primary display" href="${href}" data-cursor="small">Next project<span class="visually-hidden">: ${escapeHtml(nextName)}</span></a>`,
      );
    }
    actions.innerHTML = buttons.join('');
    live.textContent = `${p.name}, slide ${i + 1} of ${p.slides.length}: ${s.title}`;
  };

  const showText = (p: Project) => {
    text.classList.add('is-shown');
    scrambleText(projectLabel, p.name, SCRAMBLE_MS.label);
    scrambleText(title, title.dataset.full ?? '', SCRAMBLE_MS.title);
    scrambleText(desc, desc.dataset.full ?? '', SCRAMBLE_MS.body);
  };

  /** Arrows sit either side of the content, level with the image (or the text on text-only slides). */
  const placeArrows = () => {
    if (phone.matches) {
      prevButton.style.removeProperty('left');
      prevButton.style.removeProperty('top');
      nextButton.style.removeProperty('left');
      nextButton.style.removeProperty('top');
      return;
    }
    const textRect = text.getBoundingClientRect();
    const anchor = root.classList.contains('is-text-only')
      ? textRect
      : media.getBoundingClientRect();
    const centre = anchor.top + anchor.height / 2;
    prevButton.style.left = `${Math.max(64, anchor.left - 68)}px`; // clear of the 56px pill slivers
    nextButton.style.left = `${Math.min(window.innerWidth - 52, textRect.right + 24)}px`;
    prevButton.style.top = `${centre}px`;
    nextButton.style.top = `${centre}px`;
  };

  // ---------- open / change / close ----------

  const open = async (route: ViewerRoute, from: Route | null) => {
    const p = getProject(route.project);
    if (!p) return;
    busy = true;
    project = p;
    section = route.section;
    slide = route.slide;
    openedFromField = from?.view === 'field' && from.section === route.section;
    // Fly out of the card that was clicked, or the Experience pill.
    const source = openedFromField
      ? field.cardRect(p.slug)
      : route.section === 'experience'
        ? shell.pillRect('experience')
        : null;

    await document.fonts.ready; // the stand-in art is drawn with the display font
    setMedia(p, slide);
    fillText(p, slide);
    strip.setProject(p, slide);
    root.hidden = false;
    field.setActive(false);
    field.setCardHidden(openedFromField ? p.slug : null);
    shell.retractRail();
    shell.clock.setVisible(false);
    deps.setTrail?.(false);
    root.getBoundingClientRect(); // lay out before measuring
    root.classList.add('is-open');
    strip.setActive(slide); // now it's visible, scroll the current slide into the middle
    placeArrows();

    const end = media.getBoundingClientRect();
    if (!reduce && source && !isTextOnly(p.slides[slide]) && end.width > 0) {
      gsap.fromTo(
        media,
        {
          x: source.left - end.left,
          y: source.top - end.top,
          scaleX: source.width / end.width,
          scaleY: source.height / end.height,
          transformOrigin: '0 0',
        },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: OPEN_MOVE_S, ease: ease.out },
      );
      gsap.fromTo(shot, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    } else if (!reduce) {
      gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    }

    await wait(reduce ? 0 : READY_MS);
    root.classList.add('is-ready');
    showText(p);
    title.focus({ preventScroll: true });
    maybeShowHint();
    deps.onScreenChange?.();
    finish();
  };

  const change = async (i: number) => {
    const p = project;
    if (!p) return;
    busy = true;
    const plain = reduce || isTextOnly(p.slides[slide]) || isTextOnly(p.slides[i]);
    slide = i;
    text.classList.remove('is-shown');
    strip.setActive(i);
    const still = slideStill(p, i);

    if (!plain && still) {
      media.style.setProperty('--aspect', String(slideAspect(p.slides[i])));
      placeArrows();
      const image = await loadImage(still);
      sweepCanvas.classList.add('is-active');
      await sweepReveal(sweepCanvas, image, sweepOptions());
      setMedia(p, i);
      sweepCanvas.classList.remove('is-active');
    } else {
      setMedia(p, i);
      placeArrows();
      if (!reduce) await wait(200); // let the text finish leaving
    }
    fillText(p, i);
    showText(p);
    finish();
  };

  /** "Next project" (or Back into another project) while open: same sweep, new strip. */
  const switchProject = async (route: ViewerRoute) => {
    const p = getProject(route.project);
    if (!p) return;
    project = p;
    section = route.section;
    openedFromField = false;
    field.setCardHidden(null);
    strip.setProject(p, route.slide);
    slide = -1; // force the sweep path in change()
    await change(route.slide);
  };

  const close = async () => {
    const p = project;
    if (!p) return;
    busy = true;
    const returnFocus =
      root.contains(document.activeElement) || document.activeElement === document.body;
    text.classList.remove('is-shown');
    root.classList.remove('is-ready');
    hint.classList.remove('is-visible');
    hideDisc();
    frame.style.transform = '';
    gsap.to(back, { opacity: 0, duration: 0.15 });
    strip.hideOthers();

    const cell = strip.activeCell();
    const target = cell?.getBoundingClientRect();
    const start = media.getBoundingClientRect();
    const textOnly = root.classList.contains('is-text-only');

    if (!reduce && target && !textOnly && start.width > 0) {
      // Shrink into the filmstrip cell, then drop away behind the bar.
      gsap.to(media, {
        x: target.left - start.left,
        y: target.top - start.top,
        scaleX: target.width / start.width,
        scaleY: target.height / start.height,
        transformOrigin: '0 0',
        duration: SHRINK_S,
        ease: ease.outExpo,
      });
      await wait(100);
      root.classList.remove('is-open');
      await wait(300);
      gsap.to([media, cell], { y: '+=80', opacity: 0, duration: 0.22, ease: ease.fall });
      await wait(230);
    } else {
      root.classList.remove('is-open');
      if (!reduce) {
        gsap.to(body, { opacity: 0, duration: 0.2 });
        await wait(300);
      }
    }

    field.setActive(true);
    field.setCardHidden(null);
    shell.clock.setVisible(true);
    shell.restoreRail();
    deps.setTrail?.(true);
    if (!reduce) await wait(90); // the backdrop is nearly down

    root.hidden = true;
    gsap.set([media, back, shot, body], { clearProps: 'all' });
    shot.replaceChildren();
    back.replaceChildren();
    strip.reset();
    project = null;
    if (returnFocus && !field.focusCard(p.slug)) shell.stage.focus({ preventScroll: true });
    deps.onScreenChange?.();
    finish();
  };

  // ---------- routing ----------

  const apply = (route: Route) => {
    if (busy) {
      pending = route; // catch up with the latest route once the current animation is done
      return;
    }
    const from = lastRoute;
    lastRoute = route;
    if (route.view !== 'viewer') {
      if (project) void close();
      return;
    }
    if (!project) void open(route, from);
    else if (project.slug === route.project && section === route.section) {
      if (route.slide !== slide) void change(route.slide);
    } else void switchProject(route);
  };

  function finish() {
    busy = false;
    const next = pending;
    pending = null;
    if (next) apply(next);
  }

  onRouteChange(apply);

  function go(index: number) {
    if (!project) return;
    navigate({ view: 'viewer', section, project: project.slug, slide: index }, { replace: true });
  }

  const step = (delta: number) => {
    if (!project || project.slides.length < 2) return;
    const n = project.slides.length;
    go((slide + delta + n) % n); // wraps round, like the reference
  };

  /** Back to the field the viewer came from; otherwise the section's field (or Home). */
  const requestClose = () => {
    if (!project) return;
    if (openedFromField) {
      history.back();
      return;
    }
    const s = getSection(section);
    navigate({ view: 'field', section: s?.layout === 'field' ? s.id : 'home' }, { replace: true });
  };

  // ---------- input ----------

  closeButton.addEventListener('click', requestClose);
  backdrop.addEventListener('click', requestClose);
  prevButton.addEventListener('click', () => step(-1));
  nextButton.addEventListener('click', () => step(1));

  document.addEventListener('keydown', (e) => {
    if (!project || root.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape') requestClose();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else return;
    e.preventDefault();
  });

  const mediaHalf = (clientX: number) => {
    const rect = media.getBoundingClientRect();
    return clientX - rect.left < rect.width / 2 ? -1 : 1;
  };

  // Mouse: the image tilts toward the pointer and a disc shows where a click will go.
  const showDisc = (x: number, y: number, dir: number) => {
    if (!project || project.slides.length < 2 || !cursorSupported()) return;
    const n = project.slides.length;
    swapArrow(dir < 0 ? '←' : '→', true);
    swapNumber(String(((slide + dir + n) % n) + 1), false);
    disc.classList.toggle('is-prev', dir < 0);
    disc.classList.add('is-visible');
    disc.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  };
  function hideDisc() {
    disc.classList.remove('is-visible');
  }

  frame.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !root.classList.contains('is-ready')) return;
    const rect = media.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    if (!reduce) {
      frame.style.transform = `perspective(760px) rotateX(${((0.5 - py) * 2 * MAX_TILT).toFixed(2)}deg) rotateY(${((px - 0.5) * 2 * MAX_TILT).toFixed(2)}deg) scale(1.04)`;
    }
    showDisc(e.clientX, e.clientY, px < 0.5 ? -1 : 1);
  });
  frame.addEventListener('pointerleave', () => {
    frame.style.transform = '';
    hideDisc();
  });

  // Touch: swipe sideways on the image; a tap on either half steps too.
  let swipeX = 0;
  let swipeY = 0;
  let swiped = false;
  frame.addEventListener('pointerdown', (e) => {
    swipeX = e.clientX;
    swipeY = e.clientY;
    swiped = false;
  });
  frame.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    const dx = e.clientX - swipeX;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - swipeY)) {
      swiped = true;
      step(dx < 0 ? 1 : -1);
    }
  });
  frame.addEventListener('click', (e) => {
    if (swiped || !root.classList.contains('is-ready')) return;
    step(mediaHalf(e.clientX));
  });

  window.addEventListener('resize', () => {
    if (project) placeArrows();
  });

  /** Phones: once per visit, point out that the text is below the image. Gone on the first scroll. */
  function maybeShowHint() {
    if (!phone.matches || body.scrollHeight <= body.clientHeight + 8) return;
    try {
      if (sessionStorage.getItem('hc-scroll-hint')) return;
      sessionStorage.setItem('hc-scroll-hint', '1');
    } catch {
      // Storage blocked: show it anyway.
    }
    hint.classList.add('is-visible');
  }
  body.addEventListener('scroll', () => hint.classList.remove('is-visible'), { passive: true });

  function sweepOptions() {
    const tint = getComputedStyle(document.documentElement).getPropertyValue('--sweep-tint').trim();
    return phone.matches
      ? { cell: 16, jitterX: 18, jitterY: 12, passMs: 280, tint }
      : { cell: 20, jitterX: 34, jitterY: 22, passMs: 320, tint };
  }
}

/** Text that rolls out and back in when it changes (0.2 s each way), for the nav disc. */
function swapper(el: HTMLElement): (value: string, up: boolean) => void {
  let current = '';
  return (value, up) => {
    if (value === current) return;
    const first = current === '';
    current = value;
    gsap.killTweensOf(el);
    if (first || prefersReducedMotion()) {
      el.textContent = value;
      gsap.set(el, { y: 0, opacity: 1 });
      return;
    }
    const out = up ? -20 : 20;
    gsap
      .timeline()
      .to(el, { y: out, opacity: 0, duration: 0.2, ease: 'power1.inOut' })
      .add(() => {
        el.textContent = value;
      })
      .fromTo(
        el,
        { y: -out, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.2, ease: 'power1.inOut' },
      );
  };
}
