export type SectionId = 'home' | 'experience' | 'projects' | 'more-work' | 'off-the-clock';

export type Media =
  | { kind: 'video'; webm: string; mp4: string; poster: string; alt: string; aspect?: number }
  | { kind: 'image'; src: string; alt: string; width: number; height: number }
  /**
   * A player from another site (YouTube, Vimeo...). Shows its poster with a play button and only
   * loads the player when clicked. Build these with the helpers in embeds.ts.
   */
  | { kind: 'embed'; src: string; title: string; poster?: string; aspect?: number }
  /** Media is coming: the viewer shows generated stand-in art. */
  | { kind: 'placeholder' }
  /** A text-only slide by design. */
  | { kind: 'none' };

export interface SlideLink {
  label: string;
  href: string;
}

export interface Slide {
  title: string;
  description: string;
  meta: string[];
  media: Media;
  link?: SlideLink;
}

export interface Project {
  slug: string;
  name: string;
  cover?: Media;
  slides: Slide[];
}

export interface Section {
  id: SectionId;
  label: string;
  /** Word(s) at the centre of the field. Defaults to `label`. */
  emblem?: string;
  layout: 'field' | 'viewer';
  projects: string[];
}
