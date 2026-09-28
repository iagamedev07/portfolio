import type { Media } from './types';

// Slide media from other sites. The viewer shows the poster with a play button and only loads the
// player (with sound) when it's clicked, so slides stay light and swipeable.

interface EmbedOptions {
  /** Your own still instead of the site's thumbnail, e.g. asset('lattice/trailer.webp'). */
  poster?: string;
  /** Width / height of the video. Defaults to 16:9. */
  aspect?: number;
}

interface YouTubeOptions extends EmbedOptions {
  /** Start this many seconds in. */
  start?: number;
  /** Use the 1280px thumbnail. Only some videos have one, so check it exists first. */
  hd?: boolean;
}

/** A YouTube video by id (the part after `v=` or `youtu.be/`). Uses youtube-nocookie.com. */
export function youtube(id: string, title: string, options: YouTubeOptions = {}): Media {
  const params = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' });
  if (options.start) params.set('start', String(Math.floor(options.start)));
  return {
    kind: 'embed',
    src: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
    title,
    poster:
      options.poster ??
      `https://i.ytimg.com/vi/${id}/${options.hd ? 'maxresdefault' : 'hqdefault'}.jpg`,
    aspect: options.aspect,
  };
}

/**
 * A YouTube playlist by id (the part after `list=`). `startVideo` is the video it opens on (e.g.
 * the newest; YouTube can't pick that by itself) and gives the poster. Without it the playlist
 * starts at its first video and needs a `poster` for a still.
 */
export function youtubePlaylist(
  listId: string,
  title: string,
  options: EmbedOptions & { startVideo?: string } = {},
): Media {
  const params = new URLSearchParams({ list: listId, autoplay: '1', rel: '0', playsinline: '1' });
  const video = options.startVideo ?? 'videoseries';
  return {
    kind: 'embed',
    src: `https://www.youtube-nocookie.com/embed/${video}?${params.toString()}`,
    title,
    poster:
      options.poster ??
      (options.startVideo
        ? `https://i.ytimg.com/vi/${options.startVideo}/hqdefault.jpg`
        : undefined),
    aspect: options.aspect,
  };
}

/** A link to a YouTube video, for "Watch the devlog" style buttons. */
export const youtubeUrl = (id: string): string => `https://www.youtube.com/watch?v=${id}`;

/** A Vimeo video by id. Vimeo has no fixed thumbnail URL, so pass a `poster` for a still. */
export function vimeo(id: string, title: string, options: EmbedOptions = {}): Media {
  return {
    kind: 'embed',
    src: `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`,
    title,
    poster: options.poster,
    aspect: options.aspect,
  };
}

/** Any other player: pass its embed URL (what goes in the iframe's src), not the page URL. */
export function embed(src: string, title: string, options: EmbedOptions = {}): Media {
  return { kind: 'embed', src, title, poster: options.poster, aspect: options.aspect };
}
