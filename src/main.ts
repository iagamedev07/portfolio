import '@fontsource-variable/archivo/wdth.css';
import './styles/tokens.css';
import './styles/base.css';
import { validateContent } from './content';
import { currentRoute, formatRoute, onRouteChange, startRouter } from './router';
import { runGate, shouldShowGate } from './gate/gate';

if (import.meta.env.DEV) {
  const problems = validateContent();
  if (problems.length > 0) console.error(`Content problems:\n${problems.join('\n')}`);
}

// Phase 0 debug output only. The real shell replaces this in Phase 2.
const out = document.createElement('pre');
document.querySelector('#app')?.append(out);

onRouteChange((route) => {
  out.textContent = `${formatRoute(route)}\n\n${JSON.stringify(route, null, 2)}`;
});
startRouter();

// Resolves when the visitor enters; the pill intro (next task) starts from here.
if (shouldShowGate(currentRoute())) void runGate();
