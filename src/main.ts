import { validateContent } from './content';
import { formatRoute, onRouteChange, startRouter } from './router';

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
