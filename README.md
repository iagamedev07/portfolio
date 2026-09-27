# Hemang Chauhan, game developer

Portfolio site: projects on a draggable sphere, a slide viewer per project, About and Contact.
Vite + TypeScript + GSAP, no framework. Deployed to GitHub Pages by `.github/workflows/deploy.yml`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173/portfolio/
npm test           # unit tests (Vitest)
npm run typecheck
npm run lint
npm run build      # production build in dist/
```

Dev-only URL flags: `?gate` shows the ENTER gate again, `?cursor` shows every cursor state.

## Add or change content

Everything on the site is data in `src/content/`:

- `projects.ts`: each project and its slides (title, description, meta lines, link, media).
- `sections.ts`: which projects appear in Home, Experience, Projects and More Work.
- `pages.ts`: About and Contact.

Slides without footage yet use `media: { kind: 'placeholder' }` and get generated stand-in art;
`{ kind: 'none' }` is a text-only slide.

## Add a clip or image

Needs ffmpeg (`winget install Gyan.FFmpeg`, then a new terminal).

```bash
npm run media -- path/to/recording.mp4 pixel-sandbox/chunks --start 12 --duration 6
```

It writes a webm + mp4 loop and a poster to `public/media/pixel-sandbox/chunks/` and prints the
`media:` object to paste into `projects.ts`. Use the same object as a project's `cover:` to show
it on the sphere card.
