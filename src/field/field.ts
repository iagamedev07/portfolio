import { gsap } from 'gsap';
import {
  getProject,
  getSection,
  sections,
  type Project,
  type Section,
  type SectionId,
} from '../content';
import { ease, prefersReducedMotion } from '../motion/tokens';
import { formatRoute, onRouteChange } from '../router';
import { renderCard } from './card';
import {
  autoSpeed,
  cardSize,
  CUBE_WIRES,
  cubeLatLon,
  dirFromLatLon,
  faceFront,
  fibonacciLatLon,
  fieldRadius,
  lerpLatLon,
  shortestDeg,
  sphereWires,
  wireAngles,
  type LatLon,
  type Vec3,
} from './geometry';
import './field.css';

const DRAG_DEG_PER_PX = 0.25;
const TILT_LIMIT = 70;
const START_TILT = -8;
const MAX_VELOCITY = 5; // degrees per 60 fps frame
const FRICTION = 0.945; // per 60 fps frame
const DRAG_THRESHOLD = 2;
const Z_SPIN_SHARE = 0.62;
const CARD_BASE = 170;
const CARD_ASPECT = 16 / 9;
const MORPH_S = 0.9;
const FOCUS_TURN_S = 0.6;
const SWITCH_S = 0.85;
const SWITCH_OVERLAP_S = 0.35;

interface CardNode {
  el: HTMLElement;
  sphere: LatLon;
  cube: LatLon;
  now: LatLon;
  depth: number;
}

interface Scene {
  section: SectionId;
  root: HTMLElement;
  world: HTMLElement;
  emblem: HTMLElement;
  emblemChars: number;
  nodes: CardNode[];
  wires: HTMLElement[];
  grid: Array<[Vec3, Vec3]>;
  radius: number;
  shape: 'sphere' | 'cube';
  /** 0 = sphere grid, 1 = cube edges. */
  wireMix: number;
  morph: gsap.core.Tween | null;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const scale3 = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];

export function mountField(stage: HTMLElement): void {
  const reduce = prefersReducedMotion();
  const touch = window.matchMedia('(hover: none)').matches;
  const rot = { x: START_TILT, y: 0, z: 0 };
  let vx = 0;
  let vy = 0;
  let current: Scene | null = null;
  let shown: SectionId | null | undefined; // undefined until the first route arrives
  let dragging = false;
  let dragged = false;
  let focusLock = false;
  let downX = 0;
  let downY = 0;
  let lastX = 0;
  let lastY = 0;
  let raf = 0;
  let last = 0;
  let resizeTimer = 0;

  const buildScene = (section: Section): Scene => {
    const root = document.createElement('div');
    root.className = 'field-scene';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', `${section.label} projects`);

    const world = document.createElement('div');
    world.className = 'field-world';
    const emblem = document.createElement('p');
    emblem.className = 'field-emblem display';
    emblem.setAttribute('aria-hidden', 'true');
    const words = (section.emblem ?? section.label).split(' ');
    emblem.textContent = words.join('\n');
    world.append(emblem);

    const projects = section.projects
      .map((slug) => getProject(slug))
      .filter((p): p is Project => p !== undefined);
    const nodes = projects.map((project, i): CardNode => {
      const href = formatRoute({
        view: 'viewer',
        section: section.id,
        project: project.slug,
        slide: 0,
      });
      const el = renderCard(project, href);
      world.append(el);
      const sphere = fibonacciLatLon(i, projects.length);
      return { el, sphere, cube: cubeLatLon(i), now: sphere, depth: 1 };
    });

    const grid = sphereWires(projects.length);
    const wires = Array.from({ length: Math.max(grid.length, CUBE_WIRES.length) }, () => {
      const wire = document.createElement('div');
      wire.className = 'field-wire';
      world.prepend(wire);
      return wire;
    });

    root.append(world);
    root.insertAdjacentHTML(
      'beforeend',
      `<p class="field-hint is-left" aria-hidden="true">Drag to rotate</p>
       <p class="field-hint is-right" aria-hidden="true">${touch ? 'Tap' : 'Click'} a project to open it</p>`,
    );

    return {
      section: section.id,
      root,
      world,
      emblem,
      emblemChars: Math.max(...words.map((word) => word.length)),
      nodes,
      wires,
      grid,
      radius: 0,
      shape: 'sphere',
      wireMix: 0,
      morph: null,
    };
  };

  const placeNodes = (scene: Scene) => {
    for (const node of scene.nodes) {
      node.el.style.transform = `rotateY(${node.now.lon}rad) rotateX(${-node.now.lat}rad) translateZ(${scene.radius * node.depth}px)`;
    }
  };

  const placeWires = (scene: Scene) => {
    const { grid, wireMix: mix, radius: r } = scene;
    scene.wires.forEach((wire, i) => {
      // Mid-morph every grid line converges on a cube edge; the extras fade as they stack up.
      const edge = CUBE_WIRES[i % CUBE_WIRES.length]!;
      const line = grid[i] ?? edge;
      const a = scale3(lerp3(line[0], edge[0], mix), r);
      const b = scale3(lerp3(line[1], edge[1], mix), r);
      const { length, yaw, roll } = wireAngles(a, b);
      wire.style.width = `${length}px`;
      wire.style.transform = `translate3d(${a[0]}px, ${a[1]}px, ${a[2]}px) rotateY(${yaw}deg) rotateZ(${roll}deg)`;
      wire.style.opacity = i < CUBE_WIRES.length ? '1' : String(1 - mix);
    });
  };

  const layoutScene = (scene: Scene) => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const n = scene.nodes.length;
    scene.radius = fieldRadius(n, w, h);
    const base = CARD_BASE * clamp(Math.min(w, h) / 900, 0.55, 1);
    scene.nodes.forEach((node, i) => {
      const size = cardSize(i, n, base, CARD_ASPECT);
      node.depth = size.depth;
      node.el.style.width = `${size.w}px`;
      node.el.style.height = `${size.h}px`;
      node.el.style.margin = `${-size.h / 2}px 0 0 ${-size.w / 2}px`;
    });
    const emblemSize = Math.min(
      scene.radius * 0.3,
      (scene.radius * 1.8) / (scene.emblemChars * 0.9),
    );
    scene.emblem.style.fontSize = `${Math.round(emblemSize)}px`;
    placeNodes(scene);
    placeWires(scene);
  };

  const render = (scene: Scene) => {
    scene.world.style.transform = `rotateX(${rot.x}deg) rotateY(${rot.y}deg) rotateZ(${rot.z}deg)`;
    scene.emblem.style.transform = `translate(-50%, -50%) rotateZ(${-rot.z}deg) rotateY(${-rot.y}deg) rotateX(${-rot.x}deg)`;
  };

  const tick = (now: number) => {
    raf = 0;
    const scene = current;
    if (!scene) {
      last = 0;
      return;
    }
    const k = last ? Math.min((now - last) * 0.06, 3) : 1; // elapsed time in 60 fps frames
    last = now;
    if (!dragging && !focusLock && !reduce) {
      const auto = autoSpeed(scene.nodes.length);
      rot.y += (auto + vy) * k;
      rot.z += auto * Z_SPIN_SHARE * k;
      rot.x = clamp(rot.x + vx * k, -TILT_LIMIT, TILT_LIMIT);
      const decay = Math.pow(FRICTION, k);
      vx = Math.abs(vx * decay) < 0.002 ? 0 : vx * decay;
      vy = Math.abs(vy * decay) < 0.002 ? 0 : vy * decay;
    }
    render(scene);
    raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const morph = (scene: Scene) => {
    if (reduce || scene.morph) return;
    const to = scene.shape === 'sphere' ? 'cube' : 'sphere';
    const from = scene.nodes.map((node) => node.now);
    const progress = { t: 0 };
    scene.morph = gsap.to(progress, {
      t: 1,
      duration: MORPH_S,
      ease: 'power2.inOut', // easeInOutCubic
      onUpdate: () => {
        scene.nodes.forEach((node, i) => {
          node.now = lerpLatLon(from[i]!, to === 'cube' ? node.cube : node.sphere, progress.t);
        });
        scene.wireMix = to === 'cube' ? progress.t : 1 - progress.t;
        placeNodes(scene);
        placeWires(scene);
      },
      onComplete: () => {
        scene.shape = to;
        scene.morph = null;
      },
    });
  };

  const turnToFront = (node: CardNode) => {
    focusLock = true;
    vx = 0;
    vy = 0;
    const target = faceFront(dirFromLatLon(node.now), rot.z);
    const x = clamp(target.rx, -TILT_LIMIT, TILT_LIMIT);
    const y = rot.y + shortestDeg(target.ry - rot.y);
    gsap.killTweensOf(rot);
    if (reduce) Object.assign(rot, { x, y });
    else gsap.to(rot, { x, y, duration: FOCUS_TURN_S, ease: ease.out });
  };

  const order = (id: SectionId) => sections.findIndex((s) => s.id === id);

  const destroy = (scene: Scene) => {
    scene.morph?.kill();
    gsap.killTweensOf(scene.root);
    scene.root.remove();
  };

  const show = (section: Section | null, animate: boolean) => {
    const from = current;
    const next = section ? buildScene(section) : null;
    current = next;
    focusLock = false;
    if (next) {
      stage.append(next.root);
      layoutScene(next);
      render(next);
      wake();
    }

    const dir = from && next && order(next.section) < order(from.section) ? -1 : 1;
    const motion = animate && !reduce;
    if (from) {
      from.root.inert = true;
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

  // ---------- drag with inertia ----------

  stage.addEventListener('pointerdown', (e) => {
    const scene = current;
    if (!scene || e.button !== 0 || !(e.target instanceof Node) || !scene.root.contains(e.target)) {
      return;
    }
    dragging = true;
    dragged = false;
    focusLock = false;
    vx = 0;
    vy = 0;
    gsap.killTweensOf(rot);
    downX = lastX = e.clientX;
    downY = lastY = e.clientY;
    scene.root.classList.add('is-grabbing');
  });

  window.addEventListener(
    'pointermove',
    (e) => {
      if (!dragging) return;
      if (!dragged && Math.hypot(e.clientX - downX, e.clientY - downY) > DRAG_THRESHOLD) {
        dragged = true;
      }
      const stepY = (e.clientX - lastX) * DRAG_DEG_PER_PX;
      const stepX = -(e.clientY - lastY) * DRAG_DEG_PER_PX;
      rot.y += stepY;
      rot.x = clamp(rot.x + stepX, -TILT_LIMIT, TILT_LIMIT);
      vy = vy * 0.7 + stepY * 0.3;
      vx = vx * 0.7 + stepX * 0.3;
      lastX = e.clientX;
      lastY = e.clientY;
    },
    { passive: true },
  );

  const release = () => {
    if (!dragging) return;
    dragging = false;
    current?.root.classList.remove('is-grabbing');
    vx = reduce ? 0 : clamp(vx, -MAX_VELOCITY, MAX_VELOCITY);
    vy = reduce ? 0 : clamp(vy, -MAX_VELOCITY, MAX_VELOCITY);
    if (dragged && current) morph(current);
    window.setTimeout(() => {
      dragged = false;
    }, 0);
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

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

  stage.addEventListener('focusin', (e) => {
    const card = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>('.card') : null;
    const node = card ? current?.nodes.find((n) => n.el === card) : undefined;
    if (node && card?.matches(':focus-visible')) turnToFront(node);
  });
  stage.addEventListener('focusout', (e) => {
    const next = e.relatedTarget;
    if (!(next instanceof Element && next.closest('.card'))) focusLock = false;
  });

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (current) layoutScene(current);
    }, 150);
  });
}
