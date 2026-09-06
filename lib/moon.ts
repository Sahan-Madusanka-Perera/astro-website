/* ---------------------------------------------------------------------------
   Moon phase, as pure arithmetic.

   Lives outside the component tree so the observing forecast on the server and
   the glyphs on the client work from one implementation.
--------------------------------------------------------------------------- */

const SYNODIC = 29.530588853;               // mean synodic month, days
const EPOCH = Date.UTC(2000, 0, 6, 18, 14); // a known new moon

export const MOON_NAMES = [
  'New moon',
  'Waxing crescent',
  'First quarter',
  'Waxing gibbous',
  'Full moon',
  'Waning gibbous',
  'Last quarter',
  'Waning crescent',
] as const;

export type MoonPhase = {
  /** 0 new … 0.5 full … 1 new */
  p: number;
  /** 0–1 lit fraction of the disc */
  illumination: number;
  name: string;
  /** whole days until the next new moon */
  toNew: number;
};

export function phaseOf(date: Date): MoonPhase {
  const days = (date.getTime() - EPOCH) / 86_400_000;
  const p = (((days / SYNODIC) % 1) + 1) % 1;
  const illumination = (1 - Math.cos(2 * Math.PI * p)) / 2;
  const name = MOON_NAMES[Math.round(p * 8) % 8];
  const toNew = Math.round((1 - p) * SYNODIC) % Math.round(SYNODIC);
  return { p, illumination, name, toNew };
}

/** The lit limb as an SVG path. Waxing lights the right, waning the left. */
export function limbPath(p: number, r: number) {
  const waning = p > 0.5;
  const pp = waning ? 1 - p : p;
  const x = Math.cos(2 * Math.PI * pp);   // 1 new … −1 full
  const rx = Math.abs(x) * r;
  const sweep = x < 0 ? 1 : 0;            // gibbous bulges out, crescent in
  return {
    d: `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx} ${r} 0 0 ${sweep} 0 ${-r}`,
    waning,
  };
}
