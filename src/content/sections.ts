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
    label: 'Notable Projects',
    layout: 'field',
    projects: ['pixel-sandbox', 'dhaba-simulator', 'lattice', 'unreal-engine'],
  },
  {
    id: 'more-work',
    label: 'More Projects',
    layout: 'field',
    projects: [
      'stick-exe',
      'bully-us',
      'star-ballz',
      'monke-together-strong',
      'endless-runner',
      'larrys-prophecy',
      'mechanics',
    ],
  },
  { id: 'off-the-clock', label: 'Off the Clock', layout: 'viewer', projects: ['off-the-clock'] },
];
