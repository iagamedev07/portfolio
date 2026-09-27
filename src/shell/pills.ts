const STAGGER_MS = 140;
const ENTER_MS = 550;
const SETTLE_MS = 300;
const IDLE_MS = 4000;
const LEAVE_DELAY_MS = 180; // debounces jitter at the sliver edge

export function setupRail(
  rail: HTMLElement,
  zone: HTMLElement,
): { playIntro(): void; retract(): void; restore(): void } {
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
  const hover = window.matchMedia('(hover: hover)');
  for (const el of [rail, zone]) {
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') open();
    });
    el.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') close();
    });
  }

  // Touch screens can't hover the sliver: the first tap slides the pills out, the next picks one.
  rail.addEventListener(
    'click',
    (e) => {
      if (hover.matches || !rail.classList.contains('is-retracted')) return;
      if (rail.classList.contains('is-open')) return;
      e.preventDefault();
      open();
    },
    true,
  );
  document.addEventListener('pointerdown', (e) => {
    if (!hover.matches && e.target instanceof Node && !rail.contains(e.target)) close();
  });

  return {
    playIntro() {
      if (played) return;
      played = true;
      const count = rail.querySelectorAll('.pill').length;
      const introMs = (count - 1) * STAGGER_MS + ENTER_MS;
      rail.classList.add('is-intro');
      requestAnimationFrame(() => rail.classList.add('is-in'));
      window.setTimeout(() => rail.classList.remove('is-intro'), introMs);
      // Touch screens keep the pills out; the viewer and pages still tuck them away via retract().
      if (hover.matches) {
        window.setTimeout(() => rail.classList.add('is-retracted'), introMs + SETTLE_MS + IDLE_MS);
      }
    },
    /** Tuck the pills away now, e.g. so the viewer's arrow has room. Hover still brings them back. */
    retract() {
      rail.classList.add('is-retracted');
    },
    /** After the viewer or a page closes: touch screens get their pills back out. */
    restore() {
      if (!hover.matches) rail.classList.remove('is-retracted', 'is-open');
    },
  };
}
