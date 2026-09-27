import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

// Same curves as the --ease-* tokens in tokens.css. Change both together.
export const ease = {
  out: CustomEase.create('uiOut', '0.22,1,0.36,1'),
  inOut: CustomEase.create('uiInOut', '0.65,0,0.35,1'),
  outExpo: CustomEase.create('uiOutExpo', '0.16,1,0.3,1'),
  fall: CustomEase.create('uiFall', '0.55,0,1,0.45'),
  loader: CustomEase.create('uiLoader', '0.4,0,0.2,1'),
};

// Seconds, matching the --dur-* tokens.
export const dur = { fast: 0.2, hover: 0.25, ui: 0.4, move: 0.62, panel: 0.7 };

export const MOBILE_QUERY = '(max-width: 820px)';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export const prefersReducedMotion = (): boolean => reducedMotion.matches;

export function onReducedMotionChange(listener: (reduce: boolean) => void): () => void {
  const handler = (e: MediaQueryListEvent) => listener(e.matches);
  reducedMotion.addEventListener('change', handler);
  return () => reducedMotion.removeEventListener('change', handler);
}