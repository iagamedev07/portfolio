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
      'I’m Hemang, a game developer. I started making games at 16, when I put my first one, Star Ballz, on the Play Store, and I haven’t really stopped since.',
      'Since December 2023 I’ve been a Unity developer at The Pyramid Watch, working on THE WATCH. I look after most of its UI and a good chunk of the gameplay systems.',
      'Outside work I make my own games, mostly in Unity and sometimes in Unreal with C++. I also run a YouTube channel, AeroBlizz, where I post devlogs, animations, video essays about game design, and now and then some music.',
      'And I just like making things look and feel good, whether it’s a game or not. Editing videos, motion graphics, animation, art: I’ll happily lose a weekend to any of them.',
    ],
  },
  contact: {
    title: 'Contact',
    image: { alt: '', aspect: 4 / 5 },
    paragraphs: [
      'Email’s the best way to reach me. If you just want to see what I’m up to, YouTube and itch.io are where new stuff shows up first.',
    ],
    links: [
      { label: 'Email', text: 'iagamedev07@gmail.com', href: 'mailto:iagamedev07@gmail.com' },
      {
        label: 'YouTube',
        text: 'AeroBlizz',
        href: 'https://www.youtube.com/@AeroBlizz',
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
    ],
  },
};
