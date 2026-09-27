import { asset } from './assets';

export interface PageLink {
  label: string;
  text: string;
  href: string;
  external?: boolean;
}

export interface PageImage {
  src?: string;
  alt: string;
  aspect: number;
  pixelated?: boolean;
}

export interface PageContent {
  title: string;
  image: PageImage;
  paragraphs: string[];
  links?: PageLink[];
}

export const pages: Record<'about' | 'contact', PageContent> = {
  about: {
    title: 'About',
    image: {
      src: asset('about/avatar.png'),
      alt: 'Pixel-art portrait of Hemang',
      aspect: 1,
      pixelated: true,
    },
    paragraphs: [
      "I'm Hemang, a Unity developer. I've been making games for over seven years, the last three of them commercially with a remote, international team.",
      'Most of my work is gameplay programming and production UI, with multiplayer, VFX, rendering, shaders and tools along the way. I also build in Unreal with C++, and do 3D, animation, motion graphics and music on the side.',
      "Right now I'm at The Pyramid Watch, working on THE WATCH. I own most of its UI and a good share of its gameplay systems.",
    ],
  },
  contact: {
    title: 'Contact',
    image: { alt: '', aspect: 4 / 5 },
    paragraphs: ['Email works best. Everything else is below.'],
    links: [
      { label: 'Email', text: 'iagamedev07@gmail.com', href: 'mailto:iagamedev07@gmail.com' },
      {
        label: 'YouTube',
        text: 'AeroBlizz',
        href: 'https://www.youtube.com/c/AeroBlizz',
        external: true,
      },
      {
        label: 'itch.io',
        text: 'aeroblizz.itch.io',
        href: 'https://aeroblizz.itch.io/',
        external: true,
      },
      {
        label: 'LinkedIn',
        text: 'Hemang Chauhan',
        href: 'https://www.linkedin.com/in/hemang-chauhan-219a50235/',
        external: true,
      },
      {
        label: 'Google Play',
        text: 'NeoSparX',
        href: 'https://play.google.com/store/apps/developer?id=NeoSparX',
        external: true,
      },
    ],
  },
};
