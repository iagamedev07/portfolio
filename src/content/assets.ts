/** URL of a file in public/media, with the site's base path (e.g. /portfolio/media/...). */
export const asset = (path: string): string => `${import.meta.env.BASE_URL}media/${path}`;
