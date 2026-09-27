import { MOBILE_QUERY } from '../motion/tokens';

export function setupMenu(
  burger: HTMLButtonElement,
  menu: HTMLElement,
  behind: HTMLElement[],
): void {
  const setOpen = (open: boolean, returnFocus = false) => {
    burger.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    for (const el of behind) el.inert = open;
    if (open) menu.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
    else if (returnFocus) burger.focus({ preventScroll: true });
  };

  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => {
    if (e.target instanceof Element && e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false, true);
  });
  // Leaving the phone layout with the menu open would strand it half-hidden.
  window.matchMedia(MOBILE_QUERY).addEventListener('change', () => setOpen(false));
}
