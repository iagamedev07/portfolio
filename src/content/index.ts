import { projects } from './projects';
import { sections } from './sections';
import type { Project, Section, SectionId } from './types';

export type * from './types';
export { projects, sections };

const projectBySlug = new Map(projects.map((p) => [p.slug, p]));

export function getSection(id: string): Section | undefined {
  return sections.find((s) => s.id === id);
}

export function getProject(slug: string): Project | undefined {
  return projectBySlug.get(slug);
}

export interface ProjectRef {
  section: SectionId;
  slug: string;
}

export function nextProject(sectionId: SectionId, slug: string): ProjectRef | undefined {
  const section = getSection(sectionId);
  if (!section) return undefined;
  const i = section.projects.indexOf(slug);
  if (i === -1) return undefined;

  if (section.projects.length > 1) {
    const next = section.projects[(i + 1) % section.projects.length];
    return next ? { section: section.id, slug: next } : undefined;
  }

  const following = sections[(sections.indexOf(section) + 1) % sections.length];
  const first = following?.projects[0];
  return following && first ? { section: following.id, slug: first } : undefined;
}

export function validateContent(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const p of projects) {
    if (seen.has(p.slug)) problems.push(`Duplicate project slug: ${p.slug}`);
    seen.add(p.slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) problems.push(`Slug isn't URL-safe: ${p.slug}`);
    if (p.slides.length === 0) problems.push(`${p.slug} has no slides`);
  }

  for (const s of sections) {
    if (s.projects.length === 0) problems.push(`Section ${s.id} has no projects`);
    for (const slug of s.projects) {
      if (!projectBySlug.has(slug)) problems.push(`Section ${s.id} lists unknown project ${slug}`);
    }
  }

  return problems;
}
