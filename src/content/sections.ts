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
      'lattice',
      'unreal-engine',
      'larrys-prophecy',
      'off-the-clock',
    ],
  },
  { id: 'experience', label: 'Experience', layout: 'viewer', projects: ['the-watch'] },
  {
    id: 'projects',
    label: 'Projects',
    layout: 'field',
    projects: ['pixel-sandbox', 'dhaba-simulator', 'lattice', 'unreal-engine'],
  },
  {
    id: 'more-work',
    label: 'More Work',
    layout: 'field',
    projects: ['star-ballz', 'stick-exe', 'larrys-prophecy', 'prototypes'],
  },
  { id: 'off-the-clock', label: 'Off the Clock', layout: 'viewer', projects: ['off-the-clock'] },
];
