import '@fontsource-variable/archivo/wdth.css';
import './styles/tokens.css';
import './styles/base.css';
import { validateContent } from './content';
import { startAccentCycle } from './cursor/accent';
import { cursorSupported, startCursor } from './cursor/cursor';
import { startTrail } from './cursor/trail';
import { mountField } from './field/field';
import { runGate, shouldShowGate } from './gate/gate';
import { prefersReducedMotion } from './motion/tokens';
import { currentRoute, startRouter } from './router';
import { mountShell } from './shell/shell';
import { mountViewer } from './viewer/viewer';

if (import.meta.env.DEV) {
  const problems = validateContent();
  if (problems.length > 0) console.error(`Content problems:\n${problems.join('\n')}`);
  // ?cursor shows one target per cursor state.
  if (new URLSearchParams(location.search).has('cursor')) void import('./dev/cursor-harness');
}

const app = document.getElementById('app');
if (!app) throw new Error('#app is missing from index.html');

startAccentCycle();
const cursor = cursorSupported() ? startCursor() : null;
const trail = cursor && !prefersReducedMotion() ? startTrail() : null;

const shell = mountShell(app);
const field = mountField(shell.stage);
mountViewer(app, {
  field,
  shell,
  onScreenChange: () => cursor?.refresh(),
  setTrail: (on) => trail?.setEnabled(on),
});
startRouter();

// One orchestrated load moment: the pills stagger in as the gate fades (or straight away without it).
if (shouldShowGate(currentRoute())) {
  void runGate().then(() => {
    cursor?.refresh();
    shell.playIntro();
  });
} else {
  shell.playIntro();
}
