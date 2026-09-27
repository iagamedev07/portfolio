const STAGGER_MS = 140;
const ENTER_MS = 550;
const SETTLE_MS = 300;
const IDLE_MS = 4000;
const LEAVE_DELAY_MS = 180; // debounces jitter at the sliver edge

export function setupRail(
  rail: HTMLElement,
  zone: HTMLElement,
): { playIntro(): void; retract(): void } {
  let leaveTimer = 0;
  let played = false;

  const open = () => {
    window.clearTimeout(leaveTimer);
    rail.classList.add('is-open');
  };
  const close = () => {
    window.clearTimeout(leaveTimer);
    leaveTimer = window.setTimeout(() => rail.classList.remove('is-open'), LEAVE_DELAY_MS);
  };
  for (const el of [rail, zone]) {
    el.addEventListener('pointerenter', open);
    el.addEventListener('pointerleave', close);
  }

  return {
    playIntro() {
      if (played) return;
      played = true;
      const count = rail.querySelectorAll('.pill').length;
      const introMs = (count - 1) * STAGGER_MS + ENTER_MS;
      rail.classList.add('is-intro');
      requestAnimationFrame(() => rail.classList.add('is-in'));
      window.setTimeout(() => rail.classList.remove('is-intro'), introMs);
      window.setTimeout(() => rail.classList.add('is-retracted'), introMs + SETTLE_MS + IDLE_MS);
    },
    /** Tuck the pills away now, e.g. so the viewer's arrow has room. Hover still brings them back. */
    retract() {
      rail.classList.add('is-retracted');
    },
  };
}
