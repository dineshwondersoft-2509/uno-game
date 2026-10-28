export function nextRng(seed: number): { value: number; nextSeed: number } {
  const nextSeed = (seed + 0x6d2b79f5) >>> 0;
  let t = nextSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, nextSeed: nextSeed || 1 };
}

export function randomInt(
  seed: number,
  maxExclusive: number,
): { value: number; nextSeed: number } {
  const r = nextRng(seed);
  const safeMax = Math.max(1, maxExclusive);
  return {
    value: Math.min(safeMax - 1, Math.floor(r.value * safeMax)),
    nextSeed: r.nextSeed,
  };
}
