import { asset } from './assets';
import { youtube, youtubePlaylist, youtubeUrl } from './embeds';
import type { Media, Project, Slide, SlideLink } from './types';

/** A silent 16:9 loop encoded by `npm run media` into public/media/<folder>/. */
const clip = (folder: string, alt: string): Media => ({
  kind: 'video',
  webm: asset(`${folder}/clip.webm`),
  mp4: asset(`${folder}/clip.mp4`),
  poster: asset(`${folder}/poster.jpg`),
  alt,
  aspect: 16 / 9,
});

// Card cover: the loop that plays on the ring (npm run media -- <clip> <slug>/cover --width 640).
const cover = (slug: string, alt: string): Media => clip(`${slug}/cover`, alt);

const todo = (title: string, meta: string[] = []): Slide => ({
  title,
  description: 'Placeholder. Real copy comes in Phase 5.',
  meta,
  media: { kind: 'placeholder' },
});

// "Watch the devlog" button for a slide whose system has its own YouTube devlog.
const devlog = (id: string): SlideLink => ({
  label: 'Watch the devlog',
  href: youtubeUrl(id),
  icon: 'youtube',
});

const STEAM_WATCH = 'https://store.steampowered.com/app/2674670/THE_WATCH/';
const PIXEL_PLAYLIST = 'PLRQFHzjPGrTD8yE31w0AuH_8ISHLlhNjJ';

export const projects: Project[] = [
  {
    slug: 'the-watch',
    // The whole Experience section: THE WATCH (1–6), then freelance and the internship.
    name: 'Job Experience',
    cover: cover(
      'the-watch',
      'Units clashing with spell effects on a forest battlefield in THE WATCH',
    ),
    slides: [
      {
        title: 'THE WATCH',
        description:
          "It started as a competitive Action-RTS in Early Access on the Epic Games Store, and it's now being rebuilt as a single-player deck-builder where you place cards onto a grid. I've worked on it as a Unity developer since December 2023, mostly on UI and gameplay systems.",
        meta: [
          'Unity · C#',
          'Role: Unity Developer, UI',
          'Focus: UI · Gameplay systems · Card gameplay',
          'Platform: PC · Studio: The Pyramid Watch',
          'Status: in production, Steam release coming',
          'Dec 2023 – present · Remote, France',
        ],
        media: youtube('PF-Blhd_Y8g', 'THE WATCH gameplay'),
        links: [
          { label: 'Steam', href: STEAM_WATCH, icon: 'steam' },
          {
            label: 'Epic Games FAQ',
            href: 'https://store.epicgames.com/p/thewatch-faq-2cf66a?lang=en-US',
            icon: 'epic',
          },
        ],
      },
      {
        title: 'What I do on it',
        description:
          'I work across gameplay and systems programming, and I have primary ownership of the production UI. Day to day that means building features, hooking VFX into gameplay, and a fair amount of debugging and optimisation in a small team.',
        meta: [
          'Primary ownership: production UI',
          'Also: gameplay, systems, VFX integration, optimisation',
        ],
        media: youtube('jzg67TVzi2w', 'THE WATCH footage'),
      },
      {
        title: 'Where it started',
        description:
          'THE WATCH first came out in Early Access on the Epic Games Store as a competitive PvP Action-RTS: real-time fights, army management and abilities. I joined for that launch and stayed on as the game changed direction.',
        meta: [],
        stats: [
          { value: '100K+', label: 'Epic Games Store installs' },
          { value: 'UBISOFT', label: 'Backed the project' },
          { value: 'GLOBANT', label: 'Co-development partner' },
        ],
        media: youtube('ixdEuUj5ww4', 'THE WATCH Early Access footage'),
      },
      {
        title: 'Building what players see',
        description:
          'The UI is the part I own. I built major parts of the menus and in-game UI: the HUD, health bars, the card interfaces, and the flows that carry you through a match.',
        meta: ['HUDs · Health bars · Card interfaces · Menus · Gameplay flows'],
        media: youtube('pj0cAPsvzNI', 'THE WATCH UI footage'),
      },
      {
        title: 'Gameplay systems',
        description:
          "Outside UI I build the systems the game runs on: attributes, progression and the card gameplay flow, along with units, weapon behaviours, state machines and projectiles. In the Early Access version that gameplay also ran inside Photon Quantum's deterministic multiplayer simulation.",
        meta: [
          'Attributes · Progression · Card gameplay flow',
          'Units · Weapons · State machines · Projectiles',
          'Earlier: Photon Quantum multiplayer',
        ],
        media: youtube('jzg67TVzi2w', 'THE WATCH gameplay systems footage'),
      },
      {
        title: 'The redesign',
        description:
          "THE WATCH is now a single-player deck-builder: you build a deck and place your cards onto a grid. It's heading for Steam. I can't show it yet, but it's what I work on every day: the card systems, placing units on the grid, the gameplay underneath and the UI around it.",
        meta: [
          'Card systems → Grid unit placement → Gameplay systems → Supporting UI',
          'Coming to Steam',
        ],
        media: { kind: 'none' },
        links: [{ label: 'Wishlist on Steam', href: STEAM_WATCH, icon: 'steam' }],
      },
      {
        title: 'Freelance game developer',
        description:
          'Alongside the job I build Unity games, prototypes and systems: gameplay programming, UI, shaders, animation integration and technical prototyping.',
        meta: ['2023 – present · Unity · C#'],
        media: { kind: 'none' },
      },
      {
        title: 'Technical graphic designer intern',
        description:
          'Before games took over, I spent five months on motion graphics, UI, editing and visual content.',
        meta: [
          'IntellectPartners · Oct 2022 – Feb 2023',
          'After Effects · Photoshop · Illustrator · Premiere Pro',
        ],
        media: { kind: 'none' },
      },
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
      {
        title: 'The game',
        description:
          'A top-down pixel-art survival RPG in Unity, where the world never ends: every step reveals terrain the game builds on the fly. There are cliffs and raised ground you can actually climb, and a character customizer. Under the pixel art, most of the work is custom systems that make a 2D world feel layered, alive and fast.',
        meta: ['Unity · C# · 2.5D', 'Solo project · still in development'],
        media: clip(
          'pixel-sandbox/game',
          'The pixel world with its cliffs, then the character customizer and a walk around',
        ),
      },
      {
        title: 'An endless world',
        description:
          "I don't hand-place the map. Perlin noise, a smooth random pattern, becomes the terrain: high values turn into cliffs and hills, low ones into flat ground. The world is split into chunks that generate as you walk, and where a new chunk meets an old one the edges are stitched, so there's no seam.",
        meta: ['Perlin noise · Chunking · Seamless stitching'],
        media: clip(
          'pixel-sandbox/world',
          'Noise maps in the Unity editor turning into terrain, and chunks loading in the profiler',
        ),
        links: [devlog('xCHVGsvyiks')],
      },
      {
        title: 'Depth sorting on the GPU',
        description:
          'In top-down games, whatever is lower on screen should be drawn in front. Instead of re-sorting sprites every frame, each object’s shader turns its position into real depth and the GPU does the sorting. Tilemaps were harder, because one tile can hold parts of a cliff that belong both in front of and behind the player. So every pixel of a tile stores its own depth in a hidden texture, and sorting works pixel by pixel, even across levels.',
        meta: ['Custom shaders · Depth = −Y · Per-pixel tile depth'],
        media: clip(
          'pixel-sandbox/depth',
          'Diagram of depth from screen Y, then the player walking behind and in front of a tree and cliffs',
        ),
        links: [devlog('TjP22d406t0')],
      },
      {
        title: 'Height levels, loaded in the background',
        description:
          'The world has real height levels stacked on top of each other. You can walk up to a ledge, grab it and pull yourself up, or jump down to the level below, and collisions know which level you’re on. The heavy work (terrain data, tile visuals, collision shapes) runs on worker threads, so the game never freezes while new land loads. If you walk away before a chunk finishes, that work is cancelled.',
        meta: ['Multi-level tilemaps · Ledge climbing · Async, cancellable chunk jobs'],
        media: clip(
          'pixel-sandbox/heights',
          'Stacked height levels in the editor, a main thread and worker thread diagram, and the player on the cliffs',
        ),
        links: [devlog('xCHVGsvyiks')],
      },
      {
        title: 'Tiles that join themselves',
        description:
          'Each tile checks its neighbours (grass above? water to the left?) and packs the answers into one number, a bitmask, which picks the right piece of art: edge, corner or middle. On top of that, a dual grid shifts the visual tiles half a tile over, so each one sits on the corners of four data tiles and checks four neighbours instead of eight. That’s fewer checks and fewer art pieces, with the same smooth coastlines and cliffs.',
        meta: ['Bitmasking · Dual grid · 4 checks instead of 8'],
        media: clip(
          'pixel-sandbox/tiles',
          'The world grid and the half-offset display grid, tiles joining into smooth shapes, then the finished cliffs',
        ),
        links: [devlog('JMbI6RDkABI')],
      },
      {
        title: 'Palette-swap characters',
        description:
          'Character sprites are drawn once in special index colours, and a small palette texture decides what each index becomes on screen. Changing hair, skin or clothes is just a palette swap, with no sprite redrawn. That’s what runs the character customizer, and it scales to endless colour combinations for almost nothing.',
        meta: ['Palette textures · Character customizer'],
        media: clip(
          'pixel-sandbox/palette',
          'Greyscale values mapped to a colour ramp, then the customizer swapping hair, skin and clothes',
        ),
        links: [devlog('xCHVGsvyiks')],
      },
      {
        title: 'The devlogs',
        description:
          "I've documented this one on YouTube as I built it. If you want the long version of any of these systems, start here.",
        meta: [],
        // Opens on the newest devlog; update startVideo when a new one goes up.
        media: youtubePlaylist(PIXEL_PLAYLIST, 'Pixel Sandbox Survival devlogs', {
          startVideo: 'TjP22d406t0',
        }),
        links: [
          {
            label: 'Open the playlist',
            href: `https://www.youtube.com/playlist?list=${PIXEL_PLAYLIST}`,
            icon: 'youtube',
          },
        ],
      },
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
