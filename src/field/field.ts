import { gsap } from 'gsap';
import {
  getProject,
  getSection,
  sections,
  type Project,
  type Section,
  type SectionId,
} from '../content';
import { cancelScramble, scrambleText } from '../motion/scramble';
import { ease, MOBILE_QUERY, prefersReducedMotion } from '../motion/tokens';
import { formatRoute, onRouteChange } from '../router';
import { renderCard } from './card';
import { angleDelta, HOT_SCALE, ringLayout, ringSlot, type RingLayout } from './ring';
import './field.css';

// The orbit field (docs/interactions.md, "Orbit field"): a section's projects ride a ring around
// its name, turning clockwise all the time with their clips playing. Hovering a card lifts it and
// greys the rest, and the name in the middle scrambles into the project's. Wheel and drag spin
// the ring; it never stops turning.

const AUTO_SPEED = (Math.PI * 2) / 70; // radians per second: one lap every 70 s
const WHEEL_RAD_PER_PX = 0.0012;
const MAX_SPIN = 2.4; // extra radians per second from wheel or a flick
const FRICTION = 0.955; // spin kept per 60 fps frame
const LIFT_RATE = 0.16; // share of the way to the target per 60 fps frame
// Movement before a press counts as a drag (and stops being a click). Fingers wobble more than mice.
const DRAG_THRESHOLD = { mouse: 3, touch: 10 };
const RAIL_RESERVE = 230; // keeps the ring clear of the pill rail on desktop
const SCRAMBLE_MS = 380;
const SWITCH_S = 0.85;
const SWITCH_OVERLAP_S = 0.35;

interface CardNode {
  el: HTMLAnchorElement;
  slug: string;
  name: string;
  video: HTMLVideoElement | null;
  /** 0 resting, 1 fully lifted (hovered or focused). */
  lift: number;
}

interface Scene {
  section: SectionId;
  root: HTMLElement;
  emblem: HTMLElement;
  label: string;
  nodes: CardNode[];
  ring: RingLayout;
  hot: CardNode | null;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** One word per line, like the section names. */
const stack = (text: string) => text.split(' ').join('\n');

/** What the viewer needs from the field while a project is open over it. */
export interface Field {
  /** Screen rect of a card, for the viewer's fly-out (FLIP) start. */
  cardRect(slug: string): DOMRect | null;
  /** Hides the card that's "in" the viewer; null shows them all again. */
  setCardHidden(slug: string | null): void;
  /** Paused and inert while the viewer covers it. */
  setActive(active: boolean): void;
  /** Returns focus to a card after the viewer closes. False if it isn't on screen. */
  focusCard(slug: string): boolean;
}

export function mountField(stage: HTMLElement): Field {
  const reduce = prefersReducedMotion();
  const phone = window.matchMedia(MOBILE_QUERY);
  let current: Scene | null = null;
  let shown: SectionId | null | undefined; // undefined until the first route arrives
  let active = true;
  let turn = 0;
  let spin = 0;
  let raf = 0;
  let last = 0;
  let resizeTimer = 0;
  // Pointer: drag state, and where the mouse is for hover hit-testing as cards slide under it.
  let dragging = false;
  let dragged = false;
  let threshold = DRAG_THRESHOLD.mouse;
  let downX = 0;
  let downY = 0;
  let lastAngle = 0;
  let lastMoveAt = 0;
  let dragVelocity = 0;
  let mouse: { x: number; y: number } | null = null;

  const buildScene = (section: Section): Scene => {
    const root = document.createElement('div');
    root.className = 'field-scene';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', `${section.label} projects`);

    const label = stack(section.emblem ?? section.label);
    const emblem = document.createElement('p');
    emblem.className = 'field-emblem display';
    emblem.setAttribute('aria-hidden', 'true');
    emblem.textContent = label;
    root.append(emblem);

    const projects = section.projects
      .map((slug) => getProject(slug))
      .filter((p): p is Project => p !== undefined);
    const nodes = projects.map((project): CardNode => {
      const href = formatRoute({
        view: 'viewer',
        section: section.id,
        project: project.slug,
        slide: 0,
      });
      const el = renderCard(project, href);
      root.append(el);
      return {
        el,
        slug: project.slug,
        name: stack(project.name),
        video: el.querySelector('video'),
        lift: 0,
      };
    });

    const touch = window.matchMedia('(hover: none)').matches;
    root.insertAdjacentHTML(
      'beforeend',
      `<p class="field-hint is-left" aria-hidden="true">Scroll or drag to spin</p>
       <p class="field-hint is-right" aria-hidden="true">${touch ? 'Tap' : 'Click'} a project to open it</p>`,
    );

    return {
      section: section.id,
      root,
      emblem,
      label,
      nodes,
      ring: ringLayout(nodes.length, 1, 1),
      hot: null,
    };
  };

  // ---------- layout and placement ----------

  const layoutScene = (scene: Scene) => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const ring = ringLayout(scene.nodes.length, w, h, {
      reserveX: phone.matches ? 0 : RAIL_RESERVE,
    });
    scene.ring = ring;
    for (const node of scene.nodes) {
      node.el.style.width = `${ring.w}px`;
      node.el.style.height = `${ring.h}px`;
      node.el.style.margin = `${-ring.h / 2}px 0 0 ${-ring.w / 2}px`;
    }
    sizeEmblem(scene);
    place(scene);
  };

  /** One font size for the section name and every project name, so hovering never jumps. */
  const sizeEmblem = (scene: Scene) => {
    const { emblem, ring } = scene;
    cancelScramble(emblem);
    emblem.style.fontSize = '100px';
    let widest = 1;
    let tallest = 1;
    for (const text of [scene.label, ...scene.nodes.map((node) => node.name)]) {
      emblem.textContent = text;
      widest = Math.max(widest, emblem.offsetWidth);
      tallest = Math.max(tallest, emblem.offsetHeight);
    }
    const size = clamp(100 * Math.min(ring.innerW / widest, ring.innerH / tallest), 14, 160);
    emblem.style.fontSize = `${Math.floor(size)}px`;
    emblem.textContent = scene.hot?.name ?? scene.label;
  };

  const place = (scene: Scene) => {
    const { nodes, ring } = scene;
    nodes.forEach((node, i) => {
      const slot = ringSlot(i, nodes.length, turn, ring.rx, ring.ry);
      const scale = slot.scale * (1 + (HOT_SCALE - 1) * node.lift);
      node.el.style.transform = `translate3d(${slot.x.toFixed(2)}px, ${slot.y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      // Front of the ring over the back; a lifted card over everything.
      node.el.style.zIndex = String(
        node.lift > 0.01 ? 1000 + Math.round(node.lift * 100) : Math.round((slot.depth + 1) * 100),
      );
    });
  };

  // ---------- hover / focus ----------

  const setHot = (scene: Scene, node: CardNode | null) => {
    if (scene.hot === node) return;
    scene.hot?.el.classList.remove('is-hot');
    scene.hot = node;
    node?.el.classList.add('is-hot');
    scene.root.classList.toggle('has-hot', node !== null);
    scrambleText(scene.emblem, node?.name ?? scene.label, SCRAMBLE_MS);
  };

  const nodeFor = (target: EventTarget | Element | null): CardNode | undefined => {
    const card = target instanceof Element ? target.closest('.card') : null;
    return card ? current?.nodes.find((node) => node.el === card) : undefined;
  };

  /** The card under a still mouse changes as the ring turns, so hit-test every frame. */
  const trackHover = (scene: Scene) => {
    const focused = scene.nodes.find((node) => node.el.matches(':focus-visible'));
    if (focused) return setHot(scene, focused);
    if (!mouse || !active) return setHot(scene, null);
    const hit = nodeFor(document.elementFromPoint(mouse.x, mouse.y));
    setHot(scene, hit ?? null);
  };

  // ---------- clips ----------

  const setPlaying = (scene: Scene, on: boolean) => {
    for (const { video } of scene.nodes) {
      if (!video) continue;
      if (on && !reduce)
        video.play().catch(() => undefined); // autoplay refused: the poster stays
      else video.pause();
    }
  };

  const shouldPlay = () => active && document.visibilityState === 'visible';

  document.addEventListener('visibilitychange', () => {
    if (current) setPlaying(current, shouldPlay());
  });

  // ---------- the loop ----------

  const tick = (now: number) => {
    raf = 0;
    const scene = current;
    if (!scene) {
      last = 0;
      return;
    }
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    const frames = dt * 60;
    last = now;
    if (active && !dragging && !reduce) {
      turn += (AUTO_SPEED + spin) * dt;
      spin *= Math.pow(FRICTION, frames);
      if (Math.abs(spin) < 0.001) spin = 0;
    }
    trackHover(scene);
    const step = reduce ? 1 : 1 - Math.pow(1 - LIFT_RATE, frames);
    for (const node of scene.nodes) {
      const target = node === scene.hot ? 1 : 0;
      node.lift += (target - node.lift) * step;
      if (Math.abs(target - node.lift) < 0.001) node.lift = target;
    }
    place(scene);
    raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  // ---------- switching sections ----------

  const order = (id: SectionId) => sections.findIndex((s) => s.id === id);

  const destroy = (scene: Scene) => {
    setPlaying(scene, false);
    cancelScramble(scene.emblem);
    gsap.killTweensOf(scene.root);
    scene.root.remove();
  };

  const show = (section: Section | null, animate: boolean) => {
    const from = current;
    const next = section ? buildScene(section) : null;
    current = next;
    if (next) {
      stage.append(next.root);
      next.root.inert = !active;
      layoutScene(next);
      setPlaying(next, shouldPlay());
      wake();
    }

    const dir = from && next && order(next.section) < order(from.section) ? -1 : 1;
    const motion = animate && !reduce;
    if (from) {
      from.root.inert = true;
      setPlaying(from, false);
      gsap.killTweensOf(from.root);
      if (!motion) destroy(from);
      else {
        gsap.to(from.root, {
          yPercent: dir * 120,
          opacity: 0,
          duration: SWITCH_S,
          ease: ease.fall,
          onComplete: () => destroy(from),
        });
      }
    }
    if (next && motion) {
      gsap.fromTo(
        next.root,
        { yPercent: -dir * 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: SWITCH_S,
          ease: ease.outExpo,
          delay: from ? SWITCH_OVERLAP_S : 0,
        },
      );
    }
  };

  onRouteChange((route) => {
    const section = route.view === 'page' ? undefined : getSection(route.section);
    const id = section?.layout === 'field' ? section.id : null;
    if (id === shown) return;
    const first = shown === undefined;
    shown = id;
    show(id && section ? section : null, !first);
  });

  // ---------- wheel and drag spin the ring ----------

  stage.addEventListener(
    'wheel',
    (e) => {
      if (!current || !active) return;
      const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      spin = clamp(spin + px * WHEEL_RAD_PER_PX, -MAX_SPIN, MAX_SPIN);
    },
    { passive: true },
  );

  /** Angle of a point around the ring's centre (clockwise-positive, since y points down). */
  const angleAt = (x: number, y: number) => {
    const box = stage.getBoundingClientRect();
    const dx = x - (box.left + box.width / 2);
    const dy = y - (box.top + box.height / 2);
    return { angle: Math.atan2(dy, dx), dist: Math.hypot(dx, dy) };
  };

  stage.addEventListener('pointerdown', (e) => {
    const scene = current;
    if (!scene || e.button !== 0 || !(e.target instanceof Node) || !scene.root.contains(e.target)) {
      return;
    }
    dragging = true;
    dragged = false;
    spin = 0;
    dragVelocity = 0;
    downX = e.clientX;
    downY = e.clientY;
    lastAngle = angleAt(e.clientX, e.clientY).angle;
    lastMoveAt = e.timeStamp;
    threshold = e.pointerType === 'mouse' ? DRAG_THRESHOLD.mouse : DRAG_THRESHOLD.touch;
    scene.root.classList.add('is-grabbing');
  });

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'mouse') {
        const box = stage.getBoundingClientRect();
        const inside =
          e.clientX >= box.left &&
          e.clientX <= box.right &&
          e.clientY >= box.top &&
          e.clientY <= box.bottom;
        mouse = inside ? { x: e.clientX, y: e.clientY } : null;
      }
      if (!dragging) return;
      if (!dragged && Math.hypot(e.clientX - downX, e.clientY - downY) > threshold) dragged = true;
      const { angle, dist } = angleAt(e.clientX, e.clientY);
      if (dist < 24) return; // too close to the middle to read a direction
      const delta = angleDelta(lastAngle, angle);
      const seconds = Math.max((e.timeStamp - lastMoveAt) / 1000, 1 / 240);
      turn += delta;
      dragVelocity = dragVelocity * 0.7 + (delta / seconds) * 0.3;
      lastAngle = angle;
      lastMoveAt = e.timeStamp;
    },
    { passive: true },
  );

  const release = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    current?.root.classList.remove('is-grabbing');
    // A flick carries on; holding still before letting go doesn't.
    const stale = e.timeStamp - lastMoveAt > 80;
    spin = reduce || stale ? 0 : clamp(dragVelocity - AUTO_SPEED, -MAX_SPIN, MAX_SPIN);
    window.setTimeout(() => {
      dragged = false;
    }, 0);
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  document.documentElement.addEventListener('pointerleave', () => {
    mouse = null;
  });

  stage.addEventListener(
    'click',
    (e) => {
      if (!dragged) return;
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );
  stage.addEventListener('dragstart', (e) => e.preventDefault());

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (current) layoutScene(current);
    }, 150);
  });

  const findNode = (slug: string) => current?.nodes.find((node) => node.slug === slug);

  return {
    cardRect: (slug) => findNode(slug)?.el.getBoundingClientRect() ?? null,
    setCardHidden(slug) {
      for (const node of current?.nodes ?? []) {
        node.el.style.visibility = node.slug === slug ? 'hidden' : '';
      }
    },
    setActive(next) {
      active = next;
      if (!current) return;
      current.root.inert = !next;
      setPlaying(current, shouldPlay());
    },
    focusCard(slug) {
      const node = findNode(slug);
      node?.el.focus({ preventScroll: true });
      return node !== undefined;
    },
  };
}
