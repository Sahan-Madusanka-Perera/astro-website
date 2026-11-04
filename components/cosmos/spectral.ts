/* ---------------------------------------------------------------------------
   Shared by every sky on the site: a seeded PRNG so server and client agree,
   and star colour by spectral class rather than painted white.
--------------------------------------------------------------------------- */

/** Deterministic PRNG — same field every render, no hydration mismatch. */
export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Morgan–Keenan classes, weighted the way a naked-eye field actually looks:
 *  hot stars are rare but bright, so they survive to visibility. */
export const SPECTRAL: Array<{ rgb: [number, number, number]; w: number }> = [
  { rgb: [155, 188, 255], w: 0.10 }, // O/B  blue
  { rgb: [202, 220, 255], w: 0.16 }, // A    blue-white
  { rgb: [248, 247, 255], w: 0.30 }, // F    white
  { rgb: [255, 244, 222], w: 0.24 }, // G    yellow-white
  { rgb: [255, 218, 172], w: 0.14 }, // K    orange
  { rgb: [255, 186, 150], w: 0.06 }, // M    red
];

/** Index into SPECTRAL for a uniform random draw. */
export function spectralIndex(r: number): number {
  let acc = 0;
  for (let i = 0; i < SPECTRAL.length; i++) {
    acc += SPECTRAL[i].w;
    if (r <= acc) return i;
  }
  return 2;
}

export function pickSpectral(r: number): [number, number, number] {
  return SPECTRAL[spectralIndex(r)].rgb;
}
