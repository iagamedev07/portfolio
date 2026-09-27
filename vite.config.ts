import { defineConfig } from 'vite';

// GitHub Pages serves this repo at /portfolio/. Change to '/' if we move to a custom domain.
export default defineConfig({
  base: '/portfolio/',
  build: { target: 'es2022' },
});
