/**
 * Deterministic PRNG for the runtime engine. Every playthrough of the same
 * scenario with the same seed and action sequence is bit-identical, which
 * is what makes the playthrough tests possible.
 */

export function hashSeed(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32: returns the next float in [0, 1) and the successor state. */
export function nextRandom(state: number): { value: number; state: number } {
  let a = (state + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: a };
}
