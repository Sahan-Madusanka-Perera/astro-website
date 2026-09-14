/* ---------------------------------------------------------------------------
   The page fold.

   Everything here is pure 2D geometry, so the flipbook can call it sixty times
   a second without touching React.

   The model is the one a sheet of paper actually obeys when you lift its
   corner and lay it flat against itself:

     · In the normalised frame the spine is the line x = 0 and the sheet being
       turned is the rect [0, W] × [0, H]. Its free corner C sits at (W, 0) or
       (W, H).
     · The reader drags that corner to P. The crease is the perpendicular
       bisector of C–P: every point of paper past it is reflected across it.
     · F is the flap — the part of the sheet on C's side of the crease. Where
       it used to be, the page underneath shows. Reflected, it becomes the back
       of the sheet lying over the page's own front.

   A turn back through the book is the same fold mirrored through the spine,
   so there is only one fold to get right.
--------------------------------------------------------------------------- */

export type Vec = { x: number; y: number };

/** CSS matrix(a, b, c, d, e, f): x' = a·x + c·y + e, y' = b·x + d·y + f. */
export type Affine = [number, number, number, number, number, number];

export const IDENTITY: Affine = [1, 0, 0, 1, 0, 0];

export const translate = (x: number, y = 0): Affine => [1, 0, 0, 1, x, y];

/** u → w − u. The back of a sheet, seen from the front. */
export const mirrorAcross = (w: number): Affine => [-1, 0, 0, 1, w, 0];

/** m1 ∘ m2 — apply m2 first. */
export function compose(m1: Affine, m2: Affine): Affine {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

export const apply = (m: Affine, p: Vec): Vec => ({
  x: m[0] * p.x + m[2] * p.y + m[4],
  y: m[1] * p.x + m[3] * p.y + m[5],
});

/** The linear part only — for directions, not points. */
const applyLinear = (m: Affine, v: Vec): Vec => ({
  x: m[0] * v.x + m[2] * v.y,
  y: m[1] * v.x + m[3] * v.y,
});

/** Reflection across the line through `mid` with unit normal `n`. */
function reflection(mid: Vec, n: Vec): Affine {
  const k = 2 * (mid.x * n.x + mid.y * n.y);
  return [
    1 - 2 * n.x * n.x,
    -2 * n.x * n.y,
    -2 * n.x * n.y,
    1 - 2 * n.y * n.y,
    k * n.x,
    k * n.y,
  ];
}

export const cssMatrix = (m: Affine) =>
  `matrix(${m[0]},${m[1]},${m[2]},${m[3]},${m[4]},${m[5]})`;

export function cssPolygon(poly: Vec[]): string {
  if (poly.length < 3) return 'polygon(0 0,0 0,0 0)';
  return `polygon(${poly.map((p) => `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`).join(',')})`;
}

/** Sutherland–Hodgman against one half-plane: keeps (X − mid)·n ≥ 0,
 *  or ≤ 0 when `positive` is false. */
function clipHalfPlane(poly: Vec[], mid: Vec, n: Vec, positive: boolean): Vec[] {
  const s = positive ? 1 : -1;
  const side = (p: Vec) => s * ((p.x - mid.x) * n.x + (p.y - mid.y) * n.y);
  const out: Vec[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = side(a);
    const db = side(b);
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return out;
}

const mapPoly = (m: Affine, poly: Vec[]) => poly.map((p) => apply(m, p));

export type Corner = 'top' | 'bottom';

/** Keep the corner where a real sheet can reach without tearing off the
 *  spine: no closer to the far spine end than the diagonal allows, and no
 *  further from the near spine end than the page is wide. */
export function clampCorner(P: Vec, W: number, H: number, corner: Corner): Vec {
  const near = { x: 0, y: corner === 'bottom' ? H : 0 };
  const far = { x: 0, y: corner === 'bottom' ? 0 : H };
  const diag = Math.hypot(W, H);
  let p = { ...P };
  const limit = (o: Vec, r: number) => {
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d > r) p = { x: o.x + (dx * r) / d, y: o.y + (dy * r) / d };
  };
  for (let i = 0; i < 3; i++) {
    limit(near, W);
    limit(far, diag);
  }
  return p;
}

export interface FoldStyle {
  transform: string;
  clip: string;
}

export interface ShadowStyle {
  transform: string;
  width: number;
  height: number;
  opacity: number;
}

export interface FlipFrame {
  /** 0 when flat, 1 when the sheet has landed on the other side. */
  progress: number;
  front: FoldStyle;
  under: FoldStyle & { shadow: ShadowStyle };
  flap: FoldStyle & { shadow: ShadowStyle };
}

/**
 * One frame of a turn.
 *
 * @param spread  two pages side by side (spine in the middle) or one page
 *                (spine at its left edge).
 * @param dir     1 turns forward (right sheet moves left); -1 turns back.
 *                A single page only ever folds forward — a turn back there is
 *                the forward fold played in reverse.
 * @param P       corner position in the normalised frame.
 */
export function flipFrame(
  W: number,
  H: number,
  spread: boolean,
  dir: 1 | -1,
  corner: Corner,
  rawP: Vec
): FlipFrame {
  const C = { x: W, y: corner === 'bottom' ? H : 0 };
  const P = clampCorner(rawP, W, H, corner);
  const rect: Vec[] = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];

  const dx = C.x - P.x;
  const dy = C.y - P.y;
  const len = Math.hypot(dx, dy);
  const progress = Math.min(1, Math.max(0, (W - P.x) / (2 * W)));

  const backward = spread && dir === -1;
  const M = mirrorAcross(W);
  // Normalised frame → book coordinates.
  const toBook: Affine = spread
    ? backward
      ? compose(translate(W), [-1, 0, 0, 1, 0, 0])
      : translate(W)
    : IDENTITY;
  // Paper → local coordinates of each element that shows it.
  const frontLocal = backward ? M : IDENTITY;
  const flapLocal = backward ? IDENTITY : M;
  const frontSlot = spread && !backward ? W : 0;

  const emptyShadow: ShadowStyle = { transform: 'none', width: 0, height: 0, opacity: 0 };

  if (len < 0.5) {
    return {
      progress,
      front: { transform: `translate3d(${frontSlot}px,0,0)`, clip: 'none' },
      under: { transform: `translate3d(${frontSlot}px,0,0)`, clip: cssPolygon([]), shadow: emptyShadow },
      flap: { transform: 'none', clip: cssPolygon([]), shadow: emptyShadow },
    };
  }

  const n = { x: dx / len, y: dy / len };
  const mid = { x: (C.x + P.x) / 2, y: (C.y + P.y) / 2 };
  const F = clipHalfPlane(rect, mid, n, true);
  const rest = clipHalfPlane(rect, mid, n, false);
  const R = reflection(mid, n);

  // Shadows fade in as the fold opens and out as the sheet lands.
  const strength = Math.min(1, len / (W * 0.18)) * Math.min(1, (1 - progress) * 3.5);
  const reach = Math.hypot(W, H) * 2.2;

  const shadowAlong = (local: Affine, depth: number): ShadowStyle => {
    const m = apply(local, mid);
    const nl = applyLinear(local, n);
    const theta = Math.atan2(-nl.x, nl.y);
    return {
      transform: `translate(${m.x}px,${m.y}px) rotate(${theta}rad) translate(${-reach / 2}px,0)`,
      width: reach,
      height: depth,
      opacity: strength,
    };
  };

  const depth = Math.max(10, Math.min(len * 0.42, W * 0.45));

  return {
    progress,
    front: {
      transform: `translate3d(${frontSlot}px,0,0)`,
      clip: cssPolygon(mapPoly(frontLocal, rest)),
    },
    under: {
      transform: `translate3d(${frontSlot}px,0,0)`,
      clip: cssPolygon(mapPoly(frontLocal, F)),
      shadow: shadowAlong(frontLocal, depth),
    },
    flap: {
      transform: cssMatrix(compose(toBook, compose(R, flapLocal))),
      clip: cssPolygon(mapPoly(flapLocal, F)),
      shadow: shadowAlong(flapLocal, depth * 0.7),
    },
  };
}
