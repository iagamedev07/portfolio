import { asset } from './assets';
import { youtube, youtubePlaylist, youtubeUrl } from './embeds';
import type { Media, Project, Slide, SlideLink } from './types';

/**
 * A 16:9 loop encoded by `npm run media` into public/media/<folder>/. Silent unless it was
 * encoded with --audio and marked `{ audio: true }` here.
 */
const clip = (folder: string, alt: string, { audio = false, aspect = 16 / 9 } = {}): Media => ({
  kind: 'video',
  webm: asset(`${folder}/clip.webm`),
  mp4: asset(`${folder}/clip.mp4`),
  poster: asset(`${folder}/poster.jpg`),
  alt,
  aspect,
  audio,
});

// Card cover: the loop that plays on the ring (npm run media -- <clip> <slug>/cover --width 640).
const cover = (slug: string, alt: string): Media => clip(`${slug}/cover`, alt);

// One Off the Clock slide: a single YouTube video with a short line about it.
const piece = (title: string, id: string, kind: string, description: string): Slide => ({
  title,
  description,
  meta: [kind],
  media: youtube(id, title),
});

// A still image converted by `npm run media` (1280x720 webp).
const still = (folder: string, alt: string): Media => ({
  kind: 'image',
  src: asset(`${folder}/image.webp`),
  alt,
  width: 1280,
  height: 720,
});

// "Watch the devlog" button for a slide whose system has its own YouTube devlog.
const devlog = (id: string): SlideLink => ({
  label: 'Watch the devlog',
  href: youtubeUrl(id),
  icon: 'youtube',
});

const STEAM_WATCH = 'https://store.steampowered.com/app/2674670/THE_WATCH/';
const PIXEL_PLAYLIST = 'PLRQFHzjPGrTD8yE31w0AuH_8ISHLlhNjJ';
const PLAY_LARRY: SlideLink = {
  label: 'Play on itch.io',
  href: 'https://aeroblizz.itch.io/larrys-prophecy',
  icon: 'itch',
};
const RUNNER_PLAYLIST = 'PLRQFHzjPGrTCZjfx0CYOPxUO2bjKa_NkI';
const PLAY_STICK: SlideLink = {
  label: 'Play on itch.io',
  href: 'https://aeroblizz.itch.io/stickexe',
  icon: 'itch',
};
const PLAY_MONKE: SlideLink = {
  label: 'Play on itch.io',
  href: 'https://aeroblizz.itch.io/monke-together-strong',
  icon: 'itch',
};
const PLAY_LATTICE: SlideLink = {
  label: 'Play on itch.io',
  href: 'https://aeroblizz.itch.io/lattice',
  icon: 'itch',
};

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
          "It started as a competitive Action-RTS in Early Access on the Epic Games Store, and it's now being rebuilt as a single-player deck-builder where you place cards onto a grid.\n\nI've worked on it as a Unity developer since December 2023, mostly on UI and gameplay systems.",
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
          'I work across gameplay and systems programming, and I have primary ownership of the production UI.\n\nDay to day that means building features, hooking VFX into gameplay, and a fair amount of debugging and optimisation in a small team.',
        meta: [
          'Primary ownership: production UI',
          'Also: gameplay, systems, VFX integration, optimisation',
        ],
        media: youtube('jzg67TVzi2w', 'THE WATCH footage'),
      },
      {
        title: 'Where it started',
        description:
          'THE WATCH first came out in Early Access on the Epic Games Store as a competitive PvP Action-RTS: real-time fights, army management and abilities.\n\nI joined for that launch and stayed on as the game changed direction.',
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
          'The UI is the part I own.\n\nI built major parts of the menus and in-game UI: the HUD, health bars, the card interfaces, and the flows that carry you through a match.',
        meta: ['HUDs · Health bars · Card interfaces · Menus · Gameplay flows'],
        media: youtube('pj0cAPsvzNI', 'THE WATCH UI footage'),
      },
      {
        title: 'Gameplay systems',
        description:
          "Outside UI I build the systems the game runs on: attributes, progression and the card gameplay flow, along with units, weapon behaviours, state machines and projectiles.\n\nIn the Early Access version that gameplay also ran inside Photon Quantum's deterministic multiplayer simulation.",
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
          "THE WATCH is now a single-player deck-builder: you build a deck and place your cards onto a grid. It's heading for Steam.\n\nI can't show it yet, but it's what I work on every day: the card systems, placing units on the grid, the gameplay underneath and the UI around it.",
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
          'A top-down pixel-art survival RPG in Unity, where the world never ends: every step reveals terrain the game builds on the fly. There are cliffs and raised ground you can actually climb, and a character customizer.\n\nUnder the pixel art, most of the work is custom systems that make a 2D world feel layered, alive and fast.',
        meta: ['Unity · C# · 2.5D', 'Solo project · still in development'],
        media: clip(
          'pixel-sandbox/game',
          'The pixel world with its cliffs, then the character customizer and a walk around',
        ),
      },
      {
        title: 'An endless world',
        description:
          "I don't hand-place the map. Perlin noise, a smooth random pattern, becomes the terrain: high values turn into cliffs and hills, low ones into flat ground.\n\nThe world is split into chunks that generate as you walk, and where a new chunk meets an old one the edges are stitched, so there's no seam.",
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
          'In top-down games, whatever is lower on screen should be drawn in front. Instead of re-sorting sprites every frame, each object’s shader turns its position into real depth and the GPU does the sorting.\n\nTilemaps were harder, because one tile can hold parts of a cliff that belong both in front of and behind the player. So every pixel of a tile stores its own depth in a hidden texture, and sorting works pixel by pixel, even across levels.',
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
          'The world has real height levels stacked on top of each other. You can walk up to a ledge, grab it and pull yourself up, or jump down to the level below, and collisions know which level you’re on.\n\nThe heavy work (terrain data, tile visuals, collision shapes) runs on worker threads, so the game never freezes while new land loads. If you walk away before a chunk finishes, that work is cancelled.',
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
          'Each tile checks its neighbours (grass above? water to the left?) and packs the answers into one number, a bitmask, which picks the right piece of art: edge, corner or middle.\n\nOn top of that, a dual grid shifts the visual tiles half a tile over, so each one sits on the corners of four data tiles and checks four neighbours instead of eight. That’s fewer checks and fewer art pieces, with the same smooth coastlines and cliffs.',
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
          'Character sprites are drawn once in special index colours, and a small palette texture decides what each index becomes on screen. Changing hair, skin or clothes is just a palette swap, with no sprite redrawn.\n\nThat’s what runs the character customizer, and it scales to endless colour combinations for almost nothing.',
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
      {
        title: 'Dhaba Sim: The Game',
        description:
          'Dhaba Sim is a restaurant tycoon game set in a roadside dhaba on an Indian highway.\n\nYou start with a tiny kitchen. You figure out dishes by experimenting with ingredients, decide what goes on the menu and what to charge, and try to keep different types of NPCs happy enough to come back. As the money comes in, you can buy the land next door, rearrange the place and open small side businesses.\n\nThere’s also a shady side. The black market sells some very questionable ingredients. They keep customers coming back and paying more, but they also draw police attention. Do you stay honest, or take the shortcut?',
        meta: ['First-person · PC · Solo or 1–4 player online co-op · Unity (C#)'],
        media: clip(
          'dhaba-simulator/game',
          'The dhaba by the highway, customers eating inside, and the kitchen being built in the editor',
        ),
      },
      {
        title: 'Multiplayer Co-op',
        description:
          'Online co-op where friends run one restaurant together.\n\nOne player cooks, another serves, and someone else heads out for supplies. The host runs the game and checks every action, so players can’t cheat, duplicate items or get out of sync. The game is designed solo-first, so it plays just as well alone.',
        meta: [
          'Built with Unity Netcode for GameObjects',
          'Every player action is checked by the host',
        ],
        media: clip(
          'dhaba-simulator/coop',
          'Two players side by side in the editor, then joining a session and spawning at the dhaba',
        ),
      },
      {
        title: 'The Prototype',
        description:
          'A quick playable version built first to test whether the idea was fun.\n\nCustomers arrived in waves that got busier over time, from a warm-up to a lunch rush to peak hour. They waited with limited patience, ordered, ate and paid. Each shift ended with a 1–5 star rating. It was playable online from the start.\n\nWhat I learned from it shaped the real game. I then rebuilt everything properly instead of patching the prototype.',
        meta: [],
        media: clip(
          'dhaba-simulator/prototype',
          'A customer orders, the dish cooks at the station, and it gets served to the table',
        ),
      },
      {
        title: 'Procedural Facial Animation',
        description:
          'Living faces for every customer, animated by code instead of hand-made clips.\n\nCustomers blink, change mood and make small natural movements. They turn their heads to look at you as you walk past. Faces far from the camera update less often, so 20+ characters stay smooth on screen.',
        meta: [
          'Works with both blend shapes and facial bones',
          'Custom editor tools for setting up and tuning face rigs',
          'Built for performance, with no memory allocations each frame',
        ],
        media: clip(
          'dhaba-simulator/faces',
          'A character face blinking and changing expression as settings change, then a customer in the game',
        ),
      },
      {
        title: 'Recipe Discovery & Cooking',
        description:
          'Players invent their own dishes instead of following a fixed recipe list.\n\nEach cooking station, like a tawa, patila or kadhai, has rows for different kinds of ingredients. Combine them and taste the result. If you’ve found a real dish, it’s added to your recipe book and can go on your menu.\n\nCooking is more than pressing a button. Every dish gets a quality score from the choices below, so better planning and cooking always shows.',
        meta: [
          'Batch size: cook more to save time, but risk waste',
          'Flavour tweaks: add a little extra spice or sweetness to suit your customers',
          'Timing: stir at the right moment for better quality, or let it burn',
          'Ingredient freshness: stale ingredients lower the final quality',
        ],
        media: clip(
          'dhaba-simulator/recipes',
          'Picking ingredients in a station menu and cooking them, shown in the editor',
        ),
      },
      {
        title: 'Editor Tools',
        description:
          'I’m a solo dev, so any task I repeat more than a few times gets turned into a tool.\n\nFaces were the biggest time sink. Making one expression used to mean changing numbers, pressing play and checking. Now I move sliders on a live character and save the pose when it looks right. A new expression takes a couple of minutes, and the tool warns me if anything in the face setup isn’t connected, before I ever press play.\n\nClothing was the other one. Outfits used to need fitting to each body by hand. Now they snap onto any character in one click, so adding a new outfit is quick and doesn’t break the characters I’ve already made.\n\nThese tools aren’t flashy, but they’re why I can keep adding content on my own without slowing to a crawl.',
        meta: [],
        media: clip(
          'dhaba-simulator/tools',
          'The expression editor posing a face with sliders, then an outfit fitted onto a character',
        ),
      },
      {
        title: 'Customer Simulation',
        description:
          'Every customer has their own taste, budget and patience.\n\nCustomers come in types, like truckers, students and families, and each person varies a little within their type. They read your menu and pick what they think they’ll enjoy. If nothing suits them, they leave.\n\nAfter eating, they rate the meal on how close it was to their taste, how well it was cooked, how long they waited, and whether it was worth the price.\n\nThe fun is in slowly figuring out your regulars. At first you’re guessing. Learning your audience is the way to make money.',
        meta: [],
        media: clip(
          'dhaba-simulator/customers',
          'Customers arriving, choosing from the menu, eating at the tables and leaving ratings',
        ),
      },
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
      {
        title: 'Locomotion System',
        description:
          'A third-person movement system in Unreal, inspired by the Advanced Locomotion System (ALS). It covers the gameplay side of moving a character: walking, running and the transitions between them.\n\nI made the animations myself in Cascadeur, so the whole thing is built around my own animation set.',
        meta: [
          'Unreal Engine · C++ · Blueprints',
          'Inspired by ALS · Animations made in Cascadeur',
        ],
        media: clip(
          'unreal-engine/locomotion',
          'A mannequin running in eight directions, taking stairs and leaning into turns, plus the animation in Cascadeur',
          { aspect: 1 },
        ),
      },
      {
        title: 'Replicated C++ Movement',
        description:
          'The movement is written in C++ and replicated, so it works in multiplayer and every player sees the same thing.',
        meta: ['C++ · Replication · Multiplayer'],
        media: clip(
          'unreal-engine/replication',
          'Two game windows side by side, each player seeing the other move up the stairs in sync',
        ),
      },
      {
        title: 'Abandoned Area',
        description:
          'An environment piece in Unreal Engine 5: an abandoned area, a few old buildings that nature has taken over. I built the scene and then made a short cinematic of it.',
        meta: ['UE5 · Environment design · Cinematic'],
        media: youtube('L5nFDdSvATw', 'Abandoned Area, Unreal Engine 5 cinematic'),
        links: [
          { label: 'Watch the whole process', href: youtubeUrl('ImUWV6kq5TI'), icon: 'youtube' },
        ],
      },
      {
        title: 'Windows XP Wallpaper',
        description:
          'I remade Bliss, the famous Windows XP wallpaper, as a 3D scene in Unreal Engine 5: the green hill, the grass and flowers, and that blue sky.',
        meta: ['UE5 · Landscape · Foliage'],
        media: clip(
          'unreal-engine/xp-wallpaper',
          'The Bliss hill recreated in Unreal: grass and small flowers moving in the wind under a pale sky',
        ),
        links: [
          { label: 'Watch the whole process', href: youtubeUrl('VGdvLz9FX_4'), icon: 'youtube' },
        ],
      },
      {
        title: 'Diwali Home',
        description:
          'A one-day challenge: a home lit up for Diwali, the festival of lights, built in Unreal Engine in a single day.',
        meta: ['UE5 · 1-day challenge · Lighting'],
        media: clip(
          'unreal-engine/diwali',
          'A veranda strung with fairy lights and plants at night, with fireworks going off behind',
          { audio: true },
        ),
        links: [
          { label: 'Watch the whole process', href: youtubeUrl('DUIjnRCucqE'), icon: 'youtube' },
        ],
      },
    ],
  },
  {
    slug: 'lattice',
    name: 'Project LATTICE',
    cover: cover(
      'lattice',
      'Shapes built from points and triangles, ending on a small island scene',
    ),
    slides: [
      {
        title: 'The Game',
        description:
          'LATTICE is a small sandbox game where you build 3D models out of points. You place points, connect them into triangles and quads, and colour each face.\n\nIt’s half game, half creative tool. I made it solo and put it out on itch.io.',
        meta: ['Unity · C# · Runtime geometry', 'Solo project · Released on itch.io · Windows'],
        media: youtube('Z3LCcbLtMuQ', 'Project LATTICE, official trailer'),
        links: [PLAY_LATTICE],
      },
      {
        title: 'Building Geometry',
        description:
          'You click to place points, and when you close a shape it becomes a face. Pick a colour for it and carry on. That’s the whole loop.\n\nThere are no ready-made models in the game. The mesh is generated at runtime from the points you place, so everything on screen is something you built.',
        meta: ['Place points → Close a face → Colour it → Repeat', 'Runtime mesh generation'],
        media: clip(
          'lattice/building',
          'Low-poly models built from points: an island, an impossible triangle and pixel characters',
        ),
      },
      {
        title: 'Tools & Accessibility',
        description:
          'When you build something point by point, you’re going to make mistakes, so undo was a must. There’s also a colour palette, so you’re not hunting for the same colours again and again.\n\nI kept the UI grey and simple, so it’s easy to pick up even if you’ve never touched a 3D tool.',
        meta: ['Undo · Colour palette · Simple UI'],
        media: clip(
          'lattice/tools',
          'Picking colours from the picker and palettes, then the settings menus',
        ),
      },
      {
        title: 'Feel & Sound',
        description:
          'I wanted it to feel calm to play. The sound effects are soft and glassy, a bit psychedelic, and I made all of them myself, along with the music.\n\nThe UI is grey on purpose, so the only colourful thing on screen is what you’re making.',
        meta: ['Sound design · Original music', 'Audio built in FMOD'],
        media: clip(
          'lattice/feel',
          'The audio settings menu, the FMOD Studio session for the game’s sounds, then a calm build',
          { audio: true },
        ),
        links: [
          { label: 'Listen to the soundtrack', href: youtubeUrl('1MyziwwPkHA'), icon: 'youtube' },
        ],
      },
      {
        title: 'See It in Action',
        description:
          'The devlog shows the full game and how I made it. If you want to try it yourself, it’s on itch.io.',
        meta: [],
        media: youtube('D2bgSBmaRpk', 'Project LATTICE devlog'),
        links: [PLAY_LATTICE],
      },
    ],
  },
  {
    slug: 'stick-exe',
    name: 'Stick.EXE',
    cover: cover('stick-exe', 'A fake Windows desktop where things start going wrong'),
    slides: [
      {
        title: 'The Game',
        description:
          'It started as an animation. I made a parody of Alan Becker’s Animation vs. Animator (which I loved as a kid), with a developer fighting a stickman inside Unity. Someone in the comments dared me to make it into a game, so I did.\n\nYou’re using Windows, something goes wrong, and it ends in a fight with a stickman. It was my first game with a proper storyline. There’s more lore to it, but I’ll let you find that yourself.',
        meta: ['Unity · C# · Story game · PC, Mac', 'Solo'],
        media: clip('stick-exe/game', 'A fake Windows desktop where things start going wrong'),
        links: [PLAY_STICK],
      },
      {
        title: 'Faking Windows',
        description:
          'The hardest part was rebuilding the Windows interface inside Unity and making it look believable. It took a lot of time. For the bits I couldn’t get quite right, I added custom error popups that fit the story. Not slacking, I promise.',
        meta: [],
        media: clip(
          'stick-exe/windows',
          'The fake Windows interface: start menu, apps and error popups',
        ),
      },
      {
        title: 'The Stickman',
        description:
          'The stickman isn’t just a boss waiting at the end. There are different ways to interact with him as the story goes on.',
        meta: [],
        media: still(
          'stick-exe/stickman',
          'The stickman loose on the desktop, throwing things around',
        ),
      },
      {
        title: 'More Info',
        description:
          'The devlog shows the whole game and how I made it. You can play it on itch.io.',
        meta: [],
        media: youtube('_bORyERX-04', 'Stick.EXE devlog'),
        links: [PLAY_STICK],
      },
    ],
  },
  {
    slug: 'bully-us',
    name: 'Bully Us',
    cover: cover('bully-us', 'Students running around the school in Bully Us'),
    slides: [
      {
        title: 'The Game',
        description:
          'Among Us, but at school. I used to love playing Mafia, and Among Us felt like Mafia in space, so I wanted to make my own version.',
        meta: ['Unity · C# · Online multiplayer', 'Solo · made in 3 weeks'],
        media: clip('bully-us/game', 'Students running around the school in Bully Us'),
      },
      {
        title: 'How It Plays',
        description:
          'Instead of impostors there are bullies. Their job is to sabotage the school by wrecking property and picking on other students. Everyone else does tasks and cleans up the mess, and the tasks are school stuff like playing the drums or solving maths problems.\n\nAt night a security guard patrols the school, and nobody wants to get caught. If he spots something, a meeting gets called and someone has to leave (don’t ask where).',
        meta: ['Bullies · Sabotage · School tasks · Night guard'],
        media: youtube('44R71AAqa0E', 'Bully Us devlog'),
      },
      {
        title: 'Multiplayer & Art',
        description:
          'This was my first multiplayer game. I learnt the networking side from YouTube, mostly Tom Weiland’s tutorials. I made every asset from scratch in three weeks. The art style is a nod to Innersloth, because I was a big fan of their Henry Stickmin games.',
        meta: [],
        media: still('bully-us/art', 'The Bully Us lobby with several players in the school dorm'),
      },
      {
        title: 'More Info',
        description: 'The devlog goes through how it was made.',
        meta: [],
        media: youtube('44R71AAqa0E', 'Bully Us devlog'),
      },
    ],
  },
  {
    slug: 'star-ballz',
    name: 'Star Ballz',
    slides: [
      {
        title: 'My First Game',
        description:
          'The first game I ever released, on the Google Play Store. I was 16 and still in school, and I’d only just started learning Unity. Making this game was how I learnt it.',
        meta: ['Unity · C# · Android', 'Solo · 2018'],
        media: youtube('N2rRCgfKkOg', 'Star Ballz trailer'),
      },
      {
        title: 'The Game',
        description:
          'It’s a physics puzzle game. You draw lines, the ball rolls along them, and you have to get it to smash into the star to finish the level. There are a few game modes and some odd levels and mechanics mixed in.\n\nSince it was going on the Play Store, I also did the store side of things. It has ads for monetisation, and it’s hooked up to Google Play Games, so there are achievements you can unlock.',
        meta: ['Physics puzzles · Multiple game modes', 'Ads · Google Play Games achievements'],
        media: youtube('N2rRCgfKkOg', 'Star Ballz trailer'),
      },
    ],
  },
  {
    slug: 'monke-together-strong',
    name: 'Monke Together Strong',
    cover: cover('monke-together-strong', 'The monkeys working together through a jungle level'),
    slides: [
      {
        title: 'The Game',
        description:
          'My entry for Brackeys Game Jam 2021. The theme was “Stronger Together”, and I kept thinking about monkeys, so it’s about monkeys.\n\nIt’s a 2D puzzle platformer with five monkeys, and each one has its own ability. None of them can finish a level alone, so you have to use them together to get through.',
        meta: ['Unity · C# · 2D puzzle platformer · PC', 'Game jam · 5 days'],
        media: clip(
          'monke-together-strong/game',
          'The monkeys working together through a jungle level',
        ),
        links: [PLAY_MONKE],
      },
      {
        title: 'The Jam',
        description:
          'The jam lasted a week, but I missed the first two days, so I had five. It came out better than I expected. That’s how jams go: you push yourself, you don’t sleep much, and you learn a lot. (I might think twice before doing another one.)',
        meta: [],
        media: still('monke-together-strong/jam', 'The Monke Together Strong title screen'),
      },
      {
        title: 'More Info',
        description: 'The devlog covers the whole jam. You can play it on itch.io.',
        meta: [],
        media: youtube('7jGZLXDfrSs', 'Monke Together Strong devlog'),
        links: [PLAY_MONKE],
      },
    ],
  },
  {
    slug: 'endless-runner',
    name: '2D Endless Runner',
    cover: cover('endless-runner', 'A stickman runner vaulting and jumping over black platforms'),
    slides: [
      {
        title: 'The Game',
        description:
          'A story-driven runner. You play as someone who’s a bit more than human, running and fighting your way across the world.',
        meta: ['Unity · C# · Story runner', 'Solo · in development'],
        media: clip(
          'endless-runner/game',
          'A stickman runner vaulting and jumping over black platforms',
        ),
      },
      {
        title: 'How It Plays',
        description:
          'It isn’t just running and dodging. You get parkour moves like vaults, slides and wall runs, and there are different enemy types and traps along the way, so every stretch plays a bit differently.',
        meta: ['Parkour · Enemy types · Traps'],
        media: youtube('jVF017WJEXM', '2D Endless Runner gameplay'),
      },
      {
        title: 'More Info',
        description: 'The devlogs show how it came together.',
        meta: [],
        media: youtubePlaylist(RUNNER_PLAYLIST, '2D Endless Runner devlogs', {
          poster: asset('endless-runner/game/poster.jpg'),
        }),
      },
    ],
  },
  {
    slug: 'larrys-prophecy',
    name: "Larry's Prophecy",
    cover: cover(
      'larrys-prophecy',
      'Larry running through a torch-lit dungeon as a Mementor closes in',
    ),
    slides: [
      {
        title: 'The Game',
        description:
          'A small 2D platformer I made in about three weeks, a retro take on Hogwarts Legacy. You play as Larry, a wizard making his way through a dungeon with a handful of spells.\n\nIt’s a small project, but everything in it is mine: the code, the art, the animation and the sound.',
        meta: ['Unity · C# · 2D platformer', 'Solo · made in about 3 weeks'],
        media: clip(
          'larrys-prophecy/cover',
          'Larry running through a torch-lit dungeon as a Mementor closes in',
        ),
        links: [PLAY_LARRY],
      },
      {
        title: 'Mechanics',
        description:
          'You fight your way through with four spells: a fire shot, an explosion, an instant kill with a long cooldown, and a heal.\n\nThere are goblins up close, wizards shooting from range, and Mementors that chase you across the map and kill you in one hit. And when you need to get somewhere fast, you can hop on a broom and fly.',
        meta: ['4 spells · 3 enemy types · Broom flying'],
        media: clip(
          'larrys-prophecy/mechanics',
          'Jumping, flying on a broom, casting fire and healing outside the castle, then the dungeon',
          { audio: true },
        ),
      },
      {
        title: 'Game Feel, Art & Sound',
        description:
          'I spent a lot of time on how it feels to play. Jumps are variable, so holding the button takes you higher. There’s coyote time, so you can still jump a moment after running off a ledge. And the screen shakes on impacts.\n\nI drew the pixel art and animated it myself, and the sound runs through FMOD, same as LATTICE.',
        meta: ['Variable jump · Coyote time · Screen shake', 'Pixel art · Animation · FMOD audio'],
        media: clip(
          'larrys-prophecy/art',
          'Jump and impact tests, the FMOD session for the game’s sounds, and pixel-art tiles being painted',
          { audio: true },
        ),
      },
      {
        title: 'More Info',
        description:
          'The devlog shows the whole game and how I made it. You can also play it on itch.io.',
        meta: [],
        media: youtube('Xtd3IvLmQ74', "Larry's Prophecy devlog"),
        links: [PLAY_LARRY],
      },
    ],
  },
  {
    slug: 'mechanics',
    name: 'Gameplay Mechanics',
    cover: cover('mechanics', 'Red cubes flying back into place as time rewinds'),
    slides: [
      {
        title: 'Time Manipulation',
        description:
          'I wanted time travel you can actually see happening, not just a new scene. So I built a system where everything around the player rewinds back in time while you watch. I made it as something to use in future games. The devlog shows how it works.',
        meta: ['Unity · C#'],
        media: clip(
          'mechanics/time-manipulation',
          'Red cubes flying back into place as time rewinds around the player',
        ),
        links: [devlog('iNM7rWTR-hY')],
      },
      {
        title: 'Control Anyone',
        description:
          'One generic player controller that works on every character in the game. You aim at someone and you take them over, like a ghost possessing the people around it. I tried to make the switch as smooth as I could. The plan is to build a multiplayer game around it one day.',
        meta: ['Unity · C#'],
        media: clip(
          'mechanics/control-anyone',
          'Jumping from one character to another and taking control',
        ),
        links: [devlog('XYYF0bE3WGw')],
      },
    ],
  },
  {
    slug: 'off-the-clock',
    name: 'Off the Clock',
    cover: cover(
      'off-the-clock',
      'A stickman animation running and tumbling around the Unity editor',
    ),
    slides: [
      piece(
        'Game Dev vs Stickman',
        'VJKVjeoOIvM',
        'Animation',
        'A game dev fighting a stickman that’s got loose inside Unity. It’s my take on Alan Becker’s Animation vs. Animator, and it’s the video that ended up turning into Stick.EXE.',
      ),
      piece(
        '67 Game Dev Tips',
        '_34TsHdcKqg',
        'Video',
        'Stuff I learnt the hard way over years of making games, all in one video so you don’t have to learn it the same way.',
      ),
      piece(
        'Why Jumping Feels So Good',
        'gJzA0rGWPuA',
        'Video essay',
        'You jump more than you do almost anything else in a lot of games, so it has to feel good. This one’s about what goes into making a jump feel right.',
      ),
      piece(
        'How People Think Games Are Made',
        'y1Lgae19q4k',
        'Animation',
        'A short animation about what people imagine making games looks like, and what it’s actually like.',
      ),
      piece(
        'Why We Love Doing Boring Jobs',
        '1FmNKpAp-Xw',
        'Video essay',
        'Farming, cooking, delivering stuff. Jobs we’d never want in real life, but we’ll happily do them for hours in a game. This one’s about why.',
      ),
      piece(
        'Why Moving Right Feels Right',
        'bpXJuyxQsFo',
        'Video essay',
        'In almost every side-scroller you head from left to right. I look at where that comes from and why it just feels natural.',
      ),
      piece(
        'The Sound of Silence',
        'dM2_FWta2hc',
        'Video essay',
        'About the quiet moments in games, and how much they can do when the music and noise drop away.',
      ),
      piece(
        'Making Music in FL Studio',
        'dHK_MszbL98',
        'Music · FL Studio',
        'How I made the theme music for Star Ballz, my first game, in FL Studio.',
      ),
      piece(
        'LATTICE OST',
        '1MyziwwPkHA',
        'Music',
        'The soundtrack I made for Project LATTICE. Slow, calm music to build to.',
      ),
      piece(
        'Epic Boss Theme',
        'QfQO4plVDmo',
        'Music',
        'The main boss theme for my 2D endless runner. I actually made the music before the game even had a boss.',
      ),
      piece(
        'How Long It Took Me to Learn Unity',
        'IIty5c4VV8g',
        'Animation',
        'A short animated look back at how long it really took me to get the hang of Unity.',
      ),
    ],
  },
];
