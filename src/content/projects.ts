import type { Project, Slide } from './types';

const todo = (title: string, meta: string[] = []): Slide => ({
  title,
  description: 'Placeholder. Real copy comes in Phase 5.',
  meta,
  media: { kind: 'placeholder' },
});

// Text-only slides (no footage by design), e.g. earlier roles and education.
const textOnly = (title: string, meta: string[] = []): Slide => ({
  ...todo(title, meta),
  media: { kind: 'none' },
});

export const projects: Project[] = [
  {
    slug: 'the-watch',
    name: 'The Watch',
    slides: [
      todo('Overview', ['Unity, Photon Quantum', 'The Pyramid Watch, Dec 2023 to present']),
      todo('UI'),
      todo('Card and grid systems'),
      todo('Gameplay systems'),
      todo('Deterministic multiplayer'),
      todo('VFX'),
      todo('Debugging and optimisation'),
      textOnly('Freelance game developer', ['2023 to present']),
      textOnly('Technical Graphic Designer Intern', ['IntellectPartners, Oct 2022 to Feb 2023']),
      textOnly('B.Tech Computer Science', ['Manav Rachna University, 2019 to 2023']),
    ],
  },
  {
    slug: 'pixel-sandbox',
    name: 'Pixel Sandbox Survival',
    slides: [
      todo('Endless procedural world', ['Unity, C#']),
      todo('Runtime sprite terrain'),
      todo('Height levels and traversal'),
      todo('Async generation'),
      todo('Depth, occlusion and sorting'),
    ],
  },
  {
    slug: 'dhaba-simulator',
    name: 'Dhaba Simulator',
    slides: [
      todo('Co-op cooking', ['Unity, Netcode for GameObjects']),
      todo('Interaction and simulation systems'),
      todo('Modular characters'),
      todo('Character editor tools'),
    ],
  },
  {
    slug: 'unreal-traversal',
    name: 'Unreal Traversal',
    slides: [
      todo('Replicated traversal', ['Unreal, C++, Blueprints']),
      todo('Custom animation'),
      todo('Environment'),
    ],
  },
  {
    slug: 'lattice',
    name: 'Lattice',
    slides: [todo('Runtime modelling', ['Unity, itch.io']), todo('Solo production')],
  },
  {
    slug: 'star-ballz',
    name: 'Star Ballz',
    slides: [todo('Star Ballz', ['Unity, Google Play, 2018'])],
  },
  { slug: 'stick-exe', name: 'Stick.EXE', slides: [todo('Stick.EXE')] },
  { slug: 'larrys-prophecy', name: "Larry's Prophecy", slides: [todo("Larry's Prophecy")] },
  { slug: 'prototypes', name: 'Prototypes', slides: [todo('Prototypes')] },
  { slug: 'creative', name: 'Creative side', slides: [todo('Motion graphics and music')] },
  { slug: 'showreel', name: 'Showreel', slides: [todo('Showreel')] },
];
