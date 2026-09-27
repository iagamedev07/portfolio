import { describe, expect, it } from 'vitest';
import { scrambleFrame } from './scramble';

describe('scrambleFrame', () => {
  it('returns the final text at the end', () => {
    expect(scrambleFrame('Procedural tilemaps', 1)).toBe('Procedural tilemaps');
  });

  it('scrambles everything but spaces at the start', () => {
    expect(scrambleFrame('Hi you', 0, () => 0)).toBe('AA AAA');
  });

  it('reveals from the front on an ease-in curve', () => {
    // t = 0.5 on 10 characters: floor(0.25 * 10 * 1.15) = 2 revealed
    expect(scrambleFrame('abcdefghij', 0.5, () => 0)).toBe('abAAAAAAAA');
  });
});
