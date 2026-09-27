import { describe, expect, it } from 'vitest';
import { getProject, nextProject, projects, sections, validateContent } from './content';
import { formatRoute, parseHash, type Route } from './router';

describe('content', () => {
  it('has no broken references', () => {
    expect(validateContent()).toEqual([]);
  });

  it('wraps "Next project" within a section', () => {
    expect(nextProject('projects', 'unreal-engine')).toEqual({
      section: 'projects',
      slug: 'pixel-sandbox',
    });
  });

  it('carries on from Experience into Projects', () => {
    expect(nextProject('experience', 'the-watch')).toEqual({
      section: 'projects',
      slug: 'pixel-sandbox',
    });
  });
});

describe('parseHash', () => {
  const lastPixel = (getProject('pixel-sandbox')?.slides.length ?? 0) - 1;
  const pixel = (slide: number): Route => ({
    view: 'viewer',
    section: 'projects',
    project: 'pixel-sandbox',
    slide,
  });
  const watch: Route = { view: 'viewer', section: 'experience', project: 'the-watch', slide: 0 };

  const cases: Array<[string, Route]> = [
    ['', { view: 'field', section: 'home' }],
    ['#/', { view: 'field', section: 'home' }],
    ['#/nope', { view: 'field', section: 'home' }],
    ['#/projects', { view: 'field', section: 'projects' }],
    ['#/projects/pixel-sandbox/2', pixel(1)],
    ['#/Projects/Pixel-Sandbox/2/', pixel(1)],
    ['#/projects/pixel-sandbox', pixel(0)],
    ['#/projects/pixel-sandbox/0', pixel(0)],
    ['#/projects/pixel-sandbox/abc', pixel(0)],
    ['#/projects/pixel-sandbox/99', pixel(lastPixel)],
    ['#/projects/star-ballz/1', { view: 'field', section: 'projects' }],
    ['#/experience', watch],
    ['#/experience/nope/3', watch],
    [
      '#/off-the-clock',
      { view: 'viewer', section: 'off-the-clock', project: 'off-the-clock', slide: 0 },
    ],
    ['#/about', { view: 'page', page: 'about' }],
    ['#/Contact/', { view: 'page', page: 'contact' }],
  ];

  it.each(cases)('%s', (hash, expected) => {
    expect(parseHash(hash)).toEqual(expected);
  });

  it('round-trips every slide of every project in every section', () => {
    for (const section of sections) {
      for (const slug of section.projects) {
        const project = projects.find((p) => p.slug === slug);
        project?.slides.forEach((_, slide) => {
          const route: Route = { view: 'viewer', section: section.id, project: slug, slide };
          expect(parseHash(formatRoute(route))).toEqual(route);
        });
      }
    }
  });

  it('round-trips the about and contact pages', () => {
    for (const page of ['about', 'contact'] as const) {
      expect(parseHash(formatRoute({ view: 'page', page }))).toEqual({ view: 'page', page });
    }
  });
});
