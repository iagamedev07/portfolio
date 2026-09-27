// Turns a gameplay recording (or an image) into web-ready media for the site: a short muted
// loop as webm + mp4 with a poster, aiming for under 3 MB (CLAUDE.md, Media).
//
//   npm run media -- <input> <name> [--start 12.5] [--duration 6] [--width 1280] [--fps 30]
//
// <name> is the folder under public/media, e.g. pixel-sandbox/chunks. The script prints the
// `media:` object to paste into src/content/projects.ts. Needs ffmpeg and ffprobe on PATH
// (Windows: `winget install Gyan.FFmpeg`, then open a new terminal).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const MAX_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']);
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    start: { type: 'string', default: '0' },
    duration: { type: 'string', default: '6' },
    width: { type: 'string', default: '1280' },
    fps: { type: 'string', default: '30' },
    help: { type: 'boolean', short: 'h' },
  },
});

const [input, name] = positionals;
if (values.help || !input || !name) {
  console.log(`Usage: npm run media -- <input> <name> [--start s] [--duration s] [--width px] [--fps n]

  <input>   a video (mp4, mov, mkv...) or an image
  <name>    output folder under public/media, lowercase with dashes, e.g. pixel-sandbox/chunks

  Video: --start and --duration pick the loop (defaults 0 and 6 s), --width caps the size
  (default 1280, never upscales), --fps defaults to 30.`);
  process.exit(values.help ? 0 : 1);
}
if (!existsSync(input)) fail(`Can't find ${input}`);
if (!NAME.test(name))
  fail(`"${name}" should be lowercase letters, numbers and dashes, e.g. lattice/editor`);
for (const tool of ['ffmpeg', 'ffprobe']) {
  if (spawnSync(tool, ['-version']).error) {
    fail(
      `${tool} isn't installed. On Windows: winget install Gyan.FFmpeg (then open a new terminal).`,
    );
  }
}

const outDir = resolve('public/media', name);
mkdirSync(outDir, { recursive: true });
const width = Number(values.width);
// Never upscale; -2 keeps the height even, which the video encoders need.
const scale = `scale='min(${width},iw)':-2`;

if (IMAGE_TYPES.has(extname(input).toLowerCase())) {
  const out = join(outDir, 'image.webp');
  ffmpeg(['-i', input, '-vf', scale, '-quality', '85', out]);
  const size = dimensions(out);
  report([out]);
  printSnippet(`{
  kind: 'image',
  src: asset('${name}/image.webp'),
  alt: 'TODO: what the image shows',
  width: ${size.width},
  height: ${size.height},
}`);
} else {
  const trim = ['-ss', values.start, '-t', values.duration, '-i', input, '-an'];
  const filters = ['-vf', `${scale},fps=${values.fps}`];
  const webm = join(outDir, 'clip.webm');
  const mp4 = join(outDir, 'clip.mp4');
  const poster = join(outDir, 'poster.jpg');

  console.log('Encoding webm (VP9)...');
  ffmpeg([
    ...trim,
    ...filters,
    ...args('-c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -deadline good -cpu-used 2'),
    webm,
  ]);
  console.log('Encoding mp4 (H.264)...');
  ffmpeg([
    ...trim,
    ...filters,
    ...args('-c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart'),
    mp4,
  ]);
  console.log('Grabbing the poster...');
  ffmpeg(['-ss', values.start, '-i', input, '-frames:v', '1', '-vf', scale, '-q:v', '3', poster]);

  const size = dimensions(mp4);
  report([webm, mp4, poster]);
  printSnippet(`{
  kind: 'video',
  webm: asset('${name}/clip.webm'),
  mp4: asset('${name}/clip.mp4'),
  poster: asset('${name}/poster.jpg'),
  alt: 'TODO: what the clip shows',
  aspect: ${size.width} / ${size.height},
}`);
}

/** Splits a flag string into ffmpeg arguments (none of these contain spaces). */
function args(flags) {
  return flags.split(' ');
}

function ffmpeg(list) {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...list], {
    stdio: 'inherit',
  });
  if (result.status !== 0) fail('ffmpeg failed (see the message above).');
}

function dimensions(file) {
  const result = spawnSync(
    'ffprobe',
    [...args('-v error -select_streams v:0 -show_entries stream=width,height -of json'), file],
    { encoding: 'utf8' },
  );
  const stream = JSON.parse(result.stdout || '{}').streams?.[0];
  if (!stream) fail(`Couldn't read the size of ${file}`);
  return { width: stream.width, height: stream.height };
}

function report(files) {
  for (const file of files) {
    const bytes = statSync(file).size;
    const mb = (bytes / 1024 / 1024).toFixed(2);
    const warning =
      bytes > MAX_BYTES ? '  <- over 3 MB: try a shorter --duration or smaller --width' : '';
    console.log(`  ${file}  ${mb} MB${warning}`);
  }
}

function printSnippet(media) {
  console.log(`
Paste into src/content/projects.ts (add \`import { asset } from './assets';\` at the top once):

  media: ${media.replace(/\n/g, '\n  ')},

Use the same object as \`cover:\` on a project to put it on the field card.`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
