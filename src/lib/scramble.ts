export const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=-/<>[]{}▓▒░';

export function scrambleFrame(text: string, t: number, random: () => number = Math.random): string {
  if (t >= 1) return text;
  const revealed = Math.floor(t * t * text.length * 1.15);
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    out +=
      i < revealed || ch === ' ' || ch === '\n'
        ? ch
        : SCRAMBLE_CHARS.charAt(Math.floor(random() * SCRAMBLE_CHARS.length));
  }
  return out;
}
