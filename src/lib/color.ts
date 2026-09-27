export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.trim().replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbString([r, g, b]: Rgb, alpha = 1): string {
  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const h = (((hue % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const [r, g, b]: Rgb =
    h < 1
      ? [c, x, 0]
      : h < 2
        ? [x, c, 0]
        : h < 3
          ? [0, c, x]
          : h < 4
            ? [0, x, c]
            : h < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = lightness - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function channel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** A random vibrant colour, lightened until `ink` text on it reaches `minContrast` (WCAG AA). */
export function randomAccent(ink: Rgb, random: () => number = Math.random, minContrast = 4.5): Rgb {
  const hue = random() * 360;
  let lightness = 0.55;
  let colour = hslToRgb(hue, 0.85, lightness);
  while (contrastRatio(colour, ink) < minContrast && lightness < 0.95) {
    lightness += 0.02;
    colour = hslToRgb(hue, 0.85, lightness);
  }
  return colour;
}
