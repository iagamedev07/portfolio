import { asset } from './assets';
import type { Media, Project, Slide } from './types';

// Card cover: a silent 16:9 loop that plays on hover (npm run media -- <clip> <slug>/cover --width 640).
const cover = (slug: string, alt: string): Media => ({
  kind: 'video',
  webm: asset(`${slug}/cover/clip.webm`),
  mp4: asset(`${slug}/cover/clip.mp4`),
  poster: asset(`${slug}/cover/poster.jpg`),
  alt,
  aspect: 16 / 9,
});

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
    name: 'The Pyramid Watch',
    cover: cover(
      'the-watch',
      'Units clashing with spell effects on a forest battlefield in THE WATCH',
    ),
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
    cover: cover(
      'pixel-sandbox',
      'Pixel character running across the grass and up onto a raised cliff',
    ),
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
    cover: cover(
      'dhaba-simulator',
      'First-person walk from the kitchen out to customers eating at the dhaba',
    ),
    slides: [
      todo('Co-op cooking', ['Unity, Netcode for GameObjects']),
      todo('Interaction and simulation systems'),
      todo('Modular characters'),
      todo('Character editor tools'),
    ],
  },
  {
    slug: 'unreal-engine',
    name: 'Unreal Engine',
    cover: cover(
      'unreal-engine',
      'A traversal test, an open grass hill and an overgrown abandoned room in Unreal',
    ),
    slides: [
      todo('Replicated traversal', ['Unreal, C++, Blueprints']),
      todo('Custom animation'),
      todo('Environment'),
    ],
  },
  {
    slug: 'lattice',
    name: 'Project LATTICE',
    cover: cover(
      'lattice',
      'Shapes built from points and triangles, ending on a small island scene',
    ),
    slides: [todo('Runtime modelling', ['Unity, itch.io']), todo('Solo production')],
  },
  {
    slug: 'star-ballz',
    name: 'Star Ballz',
    slides: [todo('Star Ballz', ['Unity, Google Play, 2018'])],
  },
  { slug: 'stick-exe', name: 'Stick.EXE', slides: [todo('Stick.EXE')] },
  {
    slug: 'larrys-prophecy',
    name: "Larry's Prophecy",
    cover: cover(
      'larrys-prophecy',
      'Larry running through a torch-lit dungeon as a Mementor closes in',
    ),
    slides: [todo("Larry's Prophecy")],
  },
  { slug: 'prototypes', name: 'Prototypes', slides: [todo('Prototypes')] },
  {
    slug: 'off-the-clock',
    name: 'Off the Clock',
    cover: cover(
      'off-the-clock',
      'A stickman animation running and tumbling around the Unity editor',
    ),
    slides: [todo('Animation'), todo('Editing'), todo('Motion graphics'), todo('Music')],
  },
];
