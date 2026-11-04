import { mulberry32 } from '@/components/cosmos/spectral';

/* ---------------------------------------------------------------------------
   The ground the exposure is taken from: three ridges of hill country seen
   at night, an observatory on the middle ridge directly under the pole, and
   the club's own telescope in the foreground — the refractor on its tripod
   from the seal.

   The ridges are generated, not drawn: a few incommensurate sine waves from a
   seeded PRNG, computed once at module load so the server and the client
   emit the same path. They stretch to any width (preserveAspectRatio="none"),
   which smooth hills survive and buildings would not — so the observatory
   and the telescope are separate, true-aspect drawings, stood on a saddle and
   a plateau that the ridge functions keep at fixed fractions of the width.

   Depth is atmospheric: the far ridge is the palest and carries the
   hairline; each nearer ridge is darker; the nearest is the void itself, so
   the hero's foreground runs straight into the next section without a seam.
--------------------------------------------------------------------------- */

/** Where the pole — and so the observatory — sits, as a fraction of width. */
export const POLE_X = 0.74;
/** Where the telescope stands on the near ridge's plateau. */
export const SCOPE_X = 0.87;

type Wave = [amplitude: number, cycles: number];

const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const bump = (t: number, at: number, width: number) =>
  Math.exp(-(((t - at) / width) ** 2));

/** A ridge across a 1000 × 100 box, closed along the bottom. */
function ridge(seed: number, base: number, waves: Wave[], shape: (t: number, y: number) => number) {
  const rnd = mulberry32(seed);
  const phase = waves.map(() => rnd() * Math.PI * 2);
  const pts: string[] = [];
  const N = 140;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    let y = base;
    waves.forEach(([a, c], k) => {
      y += a * Math.sin(t * c * Math.PI * 2 + phase[k]);
    });
    y = shape(t, y);
    pts.push(`${(t * 1000).toFixed(1)},${y.toFixed(1)}`);
  }
  return `M0,100L${pts.join('L')}L1000,100Z`;
}

// Both back ridges dip under the pole, so Polaris sits in a notch in the
// hills with the observatory at the bottom of it.
const FAR = ridge(11, 22, [[9, 1.1], [6, 2.3], [3, 4.7], [1.3, 9.3], [0.5, 19]], (t, y) =>
  y - 8 * bump(t, 0.12, 0.13) - 6 * bump(t, 0.95, 0.08) + 30 * bump(t, POLE_X, 0.075)
);

const MID = ridge(23, 34, [[8, 1.4], [5, 3.1], [2.2, 6.3], [0.8, 12.7]], (t, y) =>
  y + 34 * bump(t, POLE_X, 0.07)
);

// High on the left, where it will rise over the wordmark; a level plateau on
// the right for the telescope.
const NEAR = ridge(37, 60, [[4, 1.7], [2.2, 3.9], [0.9, 8.1]], (t, y) => {
  const shoulder = y - 50 * (1 - smooth(0, 0.44, t));
  const flat = smooth(SCOPE_X - 0.12, SCOPE_X - 0.08, t) * (1 - smooth(SCOPE_X + 0.08, SCOPE_X + 0.12, t));
  return shoulder * (1 - flat) + 70 * flat;
});

/** Height of the near ridge's plateau, as a fraction of its box from the bottom. */
export const PLATEAU = 0.3;

function Ridge({ d, className, stroke }: { d: string; className?: string; stroke?: string }) {
  return (
    <svg
      viewBox="0 0 1000 100"
      preserveAspectRatio="none"
      className={`absolute inset-0 h-full w-full ${className ?? ''}`}
      aria-hidden
      focusable="false"
    >
      <path
        d={d}
        fill="currentColor"
        stroke={stroke}
        strokeWidth={stroke ? 1 : undefined}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function FarRidge({ className }: { className?: string }) {
  return <Ridge d={FAR} className={className} stroke="rgba(111,208,247,0.34)" />;
}

export function MidRidge({ className }: { className?: string }) {
  return <Ridge d={MID} className={className} />;
}

export function NearRidge({ className }: { className?: string }) {
  return <Ridge d={NEAR} className={className} />;
}

/** The dome's roof, as a fraction of the observatory drawing's height. */
export const DOME_TOP = 43 / 170;

/** A small observatory on its knoll. The knoll's slopes run down past the
 *  ridge's crest and merge into it, so the two read as one hill. */
export function Observatory({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 170" className={className} aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M0,170C70,166 90,92 108,87L152,87C170,92 190,166 260,170Z"
      />
      <path fill="currentColor" d="M110,88V64H150V88Z" />
      <path fill="currentColor" d="M109,64A21,21 0 0 1 151,64Z" />
      {/* Airglow catching the dome's curve, and the shutter's seam. */}
      <path
        d="M110.5,63A19.5,19.5 0 0 1 149.5,63"
        fill="none"
        stroke="rgba(111,208,247,0.34)"
        strokeWidth="0.9"
      />
      <path d="M130,44V64" stroke="rgba(111,208,247,0.24)" strokeWidth="0.9" />
    </svg>
  );
}

/** The refractor from the seal, on its tripod. Its tube slews up off the
 *  horizontal on load, turning about the mount head. */
export function Telescope({ className }: { className?: string }) {
  const rim = 'rgba(111,208,247,0.2)';
  return (
    <svg viewBox="0 0 140 170" className={className} aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        {/* far leg, then the near two */}
        <path d="M80,84L95,169" strokeWidth="2.6" />
        <path d="M76,84L40,169M80,84L118,169" strokeWidth="3.4" />
        {/* the accessory tray between them */}
        <path d="M59,127L99,127" strokeWidth="2" />
      </g>
      <path fill="currentColor" d="M71,76H87V90H71Z" />
      <g
        className="hero-aim"
        style={{ transformBox: 'view-box', transformOrigin: '78px 74px' }}
      >
        <g fill="currentColor" stroke={rim} strokeWidth="0.8" vectorEffect="non-scaling-stroke">
          {/* dew shield, tube, focuser, diagonal and eyepiece */}
          <path d="M0,66.5H27V81.5H0Z" />
          <path d="M26,68.5H104V79.5H26Z" />
          <path d="M103,70.5H116V77.5H103Z" />
          <path d="M113,62H120V72H113Z" />
          {/* finder on its brackets */}
          <path d="M46,61H73V65.5H46Z" />
          <path d="M52,65H55V69H52ZM65,65H68V69H65Z" />
          {/* tube rings on the mount */}
          <path d="M62,66H67V82H62ZM87,66H92V82H87Z" />
        </g>
      </g>
    </svg>
  );
}
