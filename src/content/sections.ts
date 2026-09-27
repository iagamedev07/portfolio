import type { Section } from './types';

export const sections: Section[] = [
  {
    id: 'home',
    label: 'Home',
    emblem: 'Highlights',
    layout: 'field',
    projects: [
      'the-watch',
      'pixel-sandbox',
      'dhaba-simulator',
      'unreal-traversal',
      'lattice',
      'showreel',
    ],
  },
  { id: 'experience', label: 'Experience', layout: 'viewer', projects: ['the-watch'] },
  {
    id: 'projects',
    label: 'Projects',
    layout: 'field',
    projects: ['pixel-sandbox', 'dhaba-simulator', 'unreal-traversal', 'lattice'],
  },
  {
    id: 'more-work',
    label: 'More Work',
    layout: 'field',
    projects: ['star-ballz', 'stick-exe', 'larrys-prophecy', 'prototypes', 'creative'],
  },
];
