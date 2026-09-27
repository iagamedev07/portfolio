import { getProject, getSection } from './content';
import type { SectionId } from './content';

// `slide` is 0-based here. URLs show it 1-based to match the "02 / 06" label.
export type Route =
  | { view: 'field'; section: SectionId }
  | { view: 'viewer'; section: SectionId; project: string; slide: number };

const HOME: Route = { view: 'field', section: 'home' };

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** Turns any hash into a valid route. Bad sections, projects and slides fall back. */
export function parseHash(hash: string): Route {
  const [sectionId, slug, slidePart] = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => part.toLowerCase());

  const section = sectionId ? getSection(sectionId) : undefined;
  if (!section) return HOME;

  const slugInSection = slug && section.projects.includes(slug) ? slug : undefined;
  const target = slugInSection ?? (section.layout === 'viewer' ? section.projects[0] : undefined);
  const project = target ? getProject(target) : undefined;
  if (!project) return { view: 'field', section: section.id };

  const requested = slugInSection ? Number.parseInt(slidePart ?? '1', 10) : 1;
  const slide = clamp(Number.isNaN(requested) ? 1 : requested, 1, project.slides.length) - 1;
  return { view: 'viewer', section: section.id, project: project.slug, slide };
}

export function formatRoute(route: Route): string {
  if (route.view === 'field') return route.section === 'home' ? '#/' : `#/${route.section}`;
  return `#/${route.section}/${route.project}/${route.slide + 1}`;
}

type Listener = (route: Route) => void;
const listeners = new Set<Listener>();
let current: Route = HOME;

export const currentRoute = (): Route => current;

export function onRouteChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Pushes a history entry, or replaces the current one so Back presses don't pile up. */
export function navigate(route: Route, { replace = false }: { replace?: boolean } = {}): void {
  const hash = formatRoute(route);
  if (hash === window.location.hash) return;
  if (replace) {
    history.replaceState(history.state, '', hash);
    sync();
  } else {
    window.location.hash = hash; // fires hashchange, which calls sync()
  }
}

function sync(): void {
  const route = parseHash(window.location.hash);
  const canonical = formatRoute(route);
  const bareHome = window.location.hash === '' && canonical === '#/';
  // Fix typos, stale links and out-of-range slides without adding a history entry.
  if (!bareHome && window.location.hash !== canonical) {
    history.replaceState(history.state, '', canonical);
  }
  current = route;
  for (const listener of listeners) listener(route);
}

export function startRouter(): void {
  window.addEventListener('hashchange', sync);
  sync();
}
