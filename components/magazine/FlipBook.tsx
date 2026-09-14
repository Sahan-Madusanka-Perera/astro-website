'use client';

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react';
import { flipFrame, type Corner, type ShadowStyle, type Vec } from '@/lib/magazine/geometry';
import { playPageTurn } from '@/lib/magazine/sound';
import type { MagazinePage, PageImages } from '@/types/magazine';

/* ---------------------------------------------------------------------------
   The flipbook.

   Pages are real DOM nodes, keyed by page number, that are never re-created
   while they stay near the reader. A turn doesn't swap image sources — it
   gives four of those nodes roles for a moment:

       still  the page that doesn't move (the other half of the spread)
       front  the face of the sheet being lifted, clipped at the crease
       flap   the back of that sheet, reflected over the front
       under  the page the lifted corner reveals

   and writes a transform and a clip-path to each, every frame, straight to
   the node. React renders only when the reader lands on a new page.
--------------------------------------------------------------------------- */

export interface FlipBookHandle {
  next(): void;
  prev(): void;
  goTo(page: number): void;
  zoomBy(factor: number): void;
  resetZoom(): void;
}

export interface FlipBookState {
  /** Zero-based pages now open. */
  pages: number[];
  spread: boolean;
  canPrev: boolean;
  canNext: boolean;
  zoom: number;
}

interface FlipBookProps {
  pages: MagazinePage[];
  images: PageImages[];
  initialPage?: number;
  sound?: boolean;
  onChange?: (state: FlipBookState) => void;
  ref?: Ref<FlipBookHandle>;
}

type Role = number | 'paper' | null;

interface Flip {
  from: number;
  to: number;
  dir: 1 | -1;
  /** One page at a time, going back: the forward fold played in reverse. */
  reverse: boolean;
  corner: Corner;
  P: Vec;
  still: number | null;
  front: number | null;
  flap: Role;
  under: number | null;
  offFrom: number;
  offTo: number;
  mode: 'peel' | 'drag' | 'anim';
  peelTarget?: Vec;
  goal?: 'turned' | 'flat';
  anim?: { from: Vec; to: Vec; start: number; dur: number; arc: number; ease: (t: number) => number };
  grab?: { cornerGrab: boolean; start: Vec };
  samples: { t: number; x: number }[];
}

interface PageNode {
  root: HTMLDivElement;
  shadow: HTMLDivElement;
  gutter: HTMLDivElement;
}

/* ── Motion ──────────────────────────────────────────────────────────────── */

/** cubic-bezier solver, so the curves can be tuned by eye like CSS ones. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dsx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dsx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}

/* A turn lifts quickly, travels, and settles: most of the sheet's motion
   happens in the first half, the way a hand actually throws a page. */
const EASE_TURN = bezier(0.3, 0.1, 0.18, 1);
/* Letting go of a dragged page: already moving, so no ease-in at all. */
const EASE_RELEASE = bezier(0.2, 0.7, 0.3, 1);

const TURN_MS = 860;
const TURN_MS_SINGLE = 720;

const GUTTER = {
  l: 'linear-gradient(to right, rgba(0,0,0,.24), rgba(0,0,0,.08) 2.5%, rgba(255,255,255,.05) 4%, rgba(0,0,0,0) 9%)',
  r: 'linear-gradient(to left, rgba(0,0,0,.26), rgba(0,0,0,.09) 2.5%, rgba(255,255,255,.04) 4%, rgba(0,0,0,0) 10%)',
  single: 'linear-gradient(to right, rgba(0,0,0,.14), rgba(0,0,0,0) 4%)',
  none: 'none',
} as const;

const SHADOW_UNDER = 'linear-gradient(to bottom, rgba(0,0,0,.46), rgba(0,0,0,.16) 30%, rgba(0,0,0,0))';
const SHADOW_FLAP =
  'linear-gradient(to bottom, rgba(0,0,0,.26), rgba(255,255,255,.12) 18%, rgba(0,0,0,.05) 55%, rgba(0,0,0,0))';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* Style writers. Module-level: they touch only the nodes they are handed. */

function hideShadow(el: HTMLDivElement) {
  el.style.opacity = '0';
}

function showShadow(el: HTMLDivElement, s: ShadowStyle, background: string) {
  el.style.width = `${s.width}px`;
  el.style.height = `${s.height}px`;
  el.style.transform = s.transform;
  el.style.opacity = String(s.opacity);
  el.style.background = background;
}

function place(
  node: PageNode,
  opts: { x?: number; transform?: string; clip?: string; z: number; gutter: keyof typeof GUTTER }
) {
  const st = node.root.style;
  st.visibility = 'visible';
  st.transform = opts.transform ?? `translate3d(${opts.x ?? 0}px,0,0)`;
  st.clipPath = opts.clip ?? 'none';
  st.zIndex = String(opts.z);
  node.gutter.style.background = GUTTER[opts.gutter];
  node.root.removeAttribute('aria-hidden');
}

function hide(node: PageNode) {
  node.root.style.visibility = 'hidden';
  node.root.style.clipPath = 'none';
  node.root.style.willChange = '';
  node.root.setAttribute('aria-hidden', 'true');
  hideShadow(node.shadow);
}

function setPeelTarget(f: Flip, target: Vec) {
  f.peelTarget = target;
}

export function FlipBook({ pages, images, initialPage = 0, sound = true, onChange, ref }: FlipBookProps) {
  const n = pages.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const paperImgRef = useRef<HTMLImageElement>(null);
  const paperShadowRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<number, PageNode>());

  const [box, setBox] = useState({ w: 0, h: 0 });
  const [anchor, setAnchor] = useState(() => clamp(initialPage, 0, Math.max(0, n - 1)));
  const [pendingView, setPendingView] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  /* ── Layout ─────────────────────────────────────────────────────────────
     Two pages side by side only when each page stays reasonably large;
     a phone held upright reads one page at a time. */
  const layout = useMemo(() => {
    const aspect = pages[0] ? pages[0].w / pages[0].h : 0.707;
    const padX = box.w >= 900 ? 88 : box.w >= 600 ? 28 : 10;
    const padY = box.h >= 700 ? 28 : 12;
    const availW = Math.max(0, box.w - padX * 2);
    const availH = Math.max(0, box.h - padY * 2);
    const hSpread = Math.min(availH, availW / (2 * aspect));
    const hSingle = Math.min(availH, availW / aspect);
    const spread = n > 1 && availW >= 640 && hSpread >= hSingle * 0.66;
    const H = Math.max(1, Math.floor(spread ? hSpread : hSingle));
    const W = Math.max(1, Math.floor(H * aspect));
    const bookW = spread ? W * 2 : W;
    return {
      spread,
      W,
      H,
      bookW,
      left: Math.round((box.w - bookW) / 2),
      top: Math.round((box.h - H) / 2),
    };
  }, [box, pages, n]);

  const { spread, W, H } = layout;
  const numViews = spread ? Math.floor(n / 2) + 1 : n;

  const viewPages = useCallback(
    (v: number): [number | null, number | null] => {
      if (!spread) return [v >= 0 && v < n ? v : null, null];
      const L = v === 0 ? null : 2 * v - 1;
      const R = 2 * v;
      return [L !== null && L >= 0 && L < n ? L : null, R >= 0 && R < n ? R : null];
    },
    [spread, n]
  );
  const viewOf = useCallback(
    (p: number) => (spread ? (p === 0 ? 0 : Math.floor((p + 1) / 2)) : p),
    [spread]
  );
  const offsetOf = useCallback(
    (v: number) => {
      if (!spread) return 0;
      const [L, R] = viewPages(v);
      if (L === null) return -W / 2;
      if (R === null) return W / 2;
      return 0;
    },
    [spread, viewPages, W]
  );

  const view = clamp(viewOf(anchor), 0, Math.max(0, numViews - 1));

  /* Mutable mirrors of the above, for handlers and the animation loop. */
  const live = useRef({ layout, view, numViews, viewPages, offsetOf, sound, reduced: false });
  // Declared before every other effect so they all read this commit's values.
  useLayoutEffect(() => {
    Object.assign(live.current, { layout, numViews, viewPages, offsetOf, sound });
  }, [layout, numViews, viewPages, offsetOf, sound]);

  const flipRef = useRef<Flip | null>(null);
  const rafRef = useRef(0);
  const loopRef = useRef<(now: number) => void>(() => {});
  const queued = useRef(0);
  const zoom = useRef({ s: 1, x: 0, y: 0 });

  /* Pages kept mounted: two views either side, plus a jump target. */
  const mounted = useMemo(() => {
    const set = new Set<number>();
    const add = (v: number) => viewPages(v).forEach((p) => p !== null && set.add(p));
    for (let d = -2; d <= 2; d++) add(view + d);
    if (pendingView !== null) add(pendingView);
    return [...set].sort((a, b) => a - b);
  }, [view, pendingView, viewPages]);

  const visible = useMemo(() => viewPages(view).filter((p): p is number => p !== null), [view, viewPages]);

  /* ── Placement ─────────────────────────────────────────────────────────── */

  const applyIdle = useCallback(() => {
    const { layout: lo, view: v, viewPages: vp, offsetOf: off } = live.current;
    const [L, R] = vp(v);
    nodes.current.forEach((node, i) => {
      if (i === L || i === R) {
        hideShadow(node.shadow);
        node.root.style.willChange = '';
        place(node, {
          x: lo.spread && i === R ? lo.W : 0,
          z: 1,
          gutter: lo.spread ? (i === L ? 'r' : 'l') : 'single',
        });
      } else hide(node);
    });
    if (paperRef.current) paperRef.current.style.visibility = 'hidden';
    if (bookRef.current) {
      bookRef.current.style.transform = `translate3d(${off(v)}px,0,0)`;
      delete bookRef.current.dataset.flipping;
    }
  }, []);

  const applyFrame = useCallback((f: Flip) => {
    const { layout: lo } = live.current;
    const geomDir = lo.spread ? f.dir : 1;
    const fr = flipFrame(lo.W, lo.H, lo.spread, geomDir, f.corner, f.P);
    const roles = new Set<number>();

    const get = (i: Role) => (typeof i === 'number' ? nodes.current.get(i) : undefined);
    const frontSide: keyof typeof GUTTER = !lo.spread ? 'single' : f.dir === 1 ? 'l' : 'r';
    const flapSide: keyof typeof GUTTER = !lo.spread ? 'single' : f.dir === 1 ? 'r' : 'l';

    const still = get(f.still);
    if (still && f.still !== null) {
      roles.add(f.still);
      hideShadow(still.shadow);
      place(still, { x: lo.spread && f.dir === -1 ? lo.W : 0, z: 1, gutter: f.dir === 1 ? 'r' : 'l' });
    }

    const under = get(f.under);
    if (under && f.under !== null) {
      roles.add(f.under);
      place(under, { transform: fr.under.transform, clip: fr.under.clip, z: 2, gutter: frontSide });
      showShadow(under.shadow, fr.under.shadow, SHADOW_UNDER);
    }

    const front = get(f.front);
    if (front && f.front !== null) {
      roles.add(f.front);
      front.root.style.willChange = 'clip-path';
      place(front, { transform: fr.front.transform, clip: fr.front.clip, z: 3, gutter: frontSide });
      hideShadow(front.shadow);
    }

    if (f.flap === 'paper') {
      const paper = paperRef.current;
      if (paper) {
        paper.style.visibility = 'visible';
        paper.style.transform = fr.flap.transform;
        paper.style.clipPath = fr.flap.clip;
        // A turned single page has nowhere to lie but past the page's left
        // edge. On a phone the page fills the screen, so the sheet just slides
        // off it — fading it there read as the page vanishing. Only where the
        // stage has real empty room beside the page would the sheet come to
        // rest in view, so only there does it fade over the last stretch.
        const roomBeside = lo.left > lo.W * 0.25;
        paper.style.opacity = roomBeside ? String(clamp((f.P.x + lo.W) / (lo.W * 0.35), 0, 1)) : '1';
        if (paperShadowRef.current) showShadow(paperShadowRef.current, fr.flap.shadow, SHADOW_FLAP);
      }
    } else {
      if (paperRef.current) paperRef.current.style.visibility = 'hidden';
      const flap = get(f.flap);
      if (flap && typeof f.flap === 'number') {
        roles.add(f.flap);
        flap.root.style.willChange = 'transform, clip-path';
        place(flap, { transform: fr.flap.transform, clip: fr.flap.clip, z: 4, gutter: flapSide });
        showShadow(flap.shadow, fr.flap.shadow, SHADOW_FLAP);
      }
    }

    nodes.current.forEach((node, i) => {
      if (!roles.has(i)) hide(node);
    });

    if (bookRef.current) {
      const off = f.offFrom + (f.offTo - f.offFrom) * fr.progress;
      bookRef.current.style.transform = `translate3d(${off}px,0,0)`;
      bookRef.current.dataset.flipping = '1';
    }
  }, []);

  /* ── Turning ───────────────────────────────────────────────────────────── */

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const turnRef = useRef<(to: number, fromQueue?: boolean) => void>(() => {});

  const emit = useCallback(() => {
    const { view: v, viewPages: vp, numViews: nv, layout: lo } = live.current;
    onChangeRef.current?.({
      pages: vp(v).filter((p): p is number => p !== null),
      spread: lo.spread,
      canPrev: v > 0,
      canNext: v < nv - 1,
      zoom: zoom.current.s,
    });
  }, []);

  const createFlip = useCallback((to: number, mode: Flip['mode'], corner: Corner): Flip => {
    const { layout: lo, view: from, viewPages: vp, offsetOf: off } = live.current;
    const dir: 1 | -1 = to > from ? 1 : -1;
    const reverse = !lo.spread && dir === -1;
    const [L, R] = vp(from);
    const [L2, R2] = vp(to);
    const cy = corner === 'bottom' ? lo.H : 0;
    const f: Flip = {
      from,
      to,
      dir,
      reverse,
      corner,
      P: { x: reverse ? -lo.W : lo.W, y: cy },
      still: null,
      front: null,
      flap: null,
      under: null,
      offFrom: off(from),
      offTo: off(to),
      mode,
      samples: [],
    };
    if (lo.spread) {
      if (dir === 1) Object.assign(f, { still: L, front: R, flap: L2, under: R2 });
      else Object.assign(f, { still: R, front: L, flap: R2, under: L2 });
    } else {
      f.flap = 'paper';
      f.front = reverse ? to : from;
      f.under = reverse ? from : to;
      if (paperImgRef.current && f.front !== null) paperImgRef.current.src = images[f.front].m;
    }
    return f;
  }, [images]);

  const finish = useCallback(
    (f: Flip) => {
      const committed = f.reverse ? f.goal === 'flat' : f.goal === 'turned';
      const nextView = committed ? f.to : f.from;
      flipRef.current = null;
      cancelAnimationFrame(rafRef.current);
      live.current.view = nextView;
      applyIdle();
      const [L, R] = live.current.viewPages(nextView);
      setAnchor((L ?? R ?? 0) as number);
      setPendingView(null);
      if (committed) emit();

      if (committed && queued.current !== 0) {
        const dir = Math.sign(queued.current);
        queued.current -= dir;
        requestAnimationFrame(() => turnRef.current(nextView + dir, true));
      } else queued.current = 0;
    },
    [applyIdle, emit]
  );

  const loop = useCallback(
    (now: number) => {
      const f = flipRef.current;
      if (!f) return;
      const { layout: lo } = live.current;

      if (f.mode === 'anim' && f.anim) {
        const a = f.anim;
        const t = clamp((now - a.start) / a.dur, 0, 1);
        const e = a.ease(t);
        const lift = a.arc * Math.sin(Math.PI * e) * (f.corner === 'bottom' ? -1 : 1);
        f.P = { x: a.from.x + (a.to.x - a.from.x) * e, y: a.from.y + (a.to.y - a.from.y) * e + lift };
        applyFrame(f);
        if (t >= 1) {
          finish(f);
          return;
        }
      } else if (f.mode === 'peel' && f.peelTarget) {
        const tx = f.peelTarget.x;
        const ty = f.peelTarget.y;
        f.P = { x: f.P.x + (tx - f.P.x) * 0.24, y: f.P.y + (ty - f.P.y) * 0.24 };
        const cornerX = lo.W;
        const cornerY = f.corner === 'bottom' ? lo.H : 0;
        if (tx === cornerX && ty === cornerY && Math.hypot(f.P.x - tx, f.P.y - ty) < 0.6) {
          f.goal = 'flat';
          finish(f);
          return;
        }
        applyFrame(f);
      } else return;

      rafRef.current = requestAnimationFrame((t) => loopRef.current(t));
    },
    [applyFrame, finish]
  );

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const animate = useCallback(
    (f: Flip, goal: 'turned' | 'flat', programmatic: boolean) => {
      const { layout: lo, sound: snd, reduced } = live.current;
      const cy = f.corner === 'bottom' ? lo.H : 0;
      const to = { x: goal === 'turned' ? -lo.W : lo.W, y: cy };
      const dist = Math.hypot(to.x - f.P.x, to.y - f.P.y);
      const full = lo.spread ? TURN_MS : TURN_MS_SINGLE;
      f.mode = 'anim';
      f.goal = goal;
      f.anim = {
        from: { ...f.P },
        to,
        start: performance.now(),
        dur: reduced ? 1 : programmatic ? full * clamp(dist / (2 * lo.W), 0.35, 1) : clamp((dist / (2 * lo.W)) * 640, 170, 560),
        arc: programmatic && !reduced ? lo.H * 0.09 * clamp(dist / (2 * lo.W), 0, 1) : 0,
        ease: programmatic ? EASE_TURN : EASE_RELEASE,
      };
      const committing = f.reverse ? goal === 'flat' : goal === 'turned';
      if (committing && snd && !reduced) playPageTurn(programmatic ? 0.8 : clamp(dist / lo.W, 0.4, 1));
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);
    },
    [loop]
  );

  const startTurn = useCallback(
    (to: number) => {
      const f = createFlip(to, 'anim', 'bottom');
      flipRef.current = f;
      applyFrame(f);
      const commitGoal = f.reverse ? 'flat' : 'turned';
      animate(f, commitGoal, true);
    },
    [createFlip, applyFrame, animate]
  );

  /** Turn to a view — queueing, hurrying, or taking over a peel as needed. */
  const turn = useCallback(
    (to: number, fromQueue = false) => {
      const { numViews: nv, view: v, layout: lo } = live.current;
      if (zoom.current.s > 1.01 || lo.W < 2) return;
      const target = clamp(to, 0, nv - 1);
      const f = flipRef.current;

      if (f) {
        if (f.mode === 'peel' && f.to === target) {
          animate(f, f.reverse ? 'flat' : 'turned', true);
          return;
        }
        if (f.mode === 'anim' && !fromQueue) {
          const dir = Math.sign(target - (f.to + queued.current));
          if (dir !== 0 && Math.abs(queued.current) < 6) {
            queued.current += dir;
            // Hurry the sheet already in the air.
            if (f.anim) {
              const left = f.anim.dur - (performance.now() - f.anim.start);
              if (left > 180) {
                f.anim = { ...f.anim, from: { ...f.P }, start: performance.now(), dur: 180, arc: 0, ease: EASE_RELEASE };
              }
            }
          }
          return;
        }
        if (f.mode === 'drag') return;
        finish({ ...f, goal: f.reverse ? 'turned' : 'flat' });
      }

      if (target === v) return;
      if (live.current.reduced) {
        live.current.view = target;
        applyIdle();
        const [L, R] = live.current.viewPages(target);
        setAnchor((L ?? R ?? 0) as number);
        emit();
        return;
      }

      const needed = [...live.current.viewPages(target), ...live.current.viewPages(v)].filter(
        (p): p is number => p !== null
      );
      if (needed.every((p) => nodes.current.has(p))) startTurn(target);
      else setPendingView(target);
    },
    [animate, applyIdle, emit, finish, startTurn]
  );
  useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  /** One view on from wherever the book is heading — so presses made while a
   *  sheet is still in the air stack up instead of repeating that same turn. */
  const step = useCallback(
    (d: 1 | -1) => {
      const f = flipRef.current;
      const heading =
        f && f.mode === 'anim'
          ? (f.goal === (f.reverse ? 'flat' : 'turned') ? f.to : f.from) + queued.current
          : live.current.view;
      const target = heading + d;
      if (target < 0 || target > live.current.numViews - 1) return;
      turn(target);
    },
    [turn]
  );

  /* A jump to a page that wasn't mounted: render it, let its placeholder
     decode, then turn. */
  useEffect(() => {
    if (pendingView === null || flipRef.current) return;
    const target = pendingView;
    const pagesNeeded = live.current.viewPages(target).filter((p): p is number => p !== null);
    const imgs = pagesNeeded
      .map((p) => nodes.current.get(p)?.root.querySelector('img'))
      .filter((i): i is HTMLImageElement => !!i);
    let cancelled = false;
    Promise.race([
      Promise.all(imgs.map((i) => i.decode().catch(() => undefined))),
      new Promise((r) => setTimeout(r, 450)),
    ]).then(() => {
      if (!cancelled && !flipRef.current) startTurn(target);
    });
    return () => {
      cancelled = true;
    };
  }, [pendingView, startTurn]);

  /* ── Zoom ──────────────────────────────────────────────────────────────── */

  const applyZoom = useCallback((animated: boolean) => {
    const el = zoomRef.current;
    if (!el) return;
    const z = zoom.current;
    el.style.transition = animated ? 'transform 520ms var(--ease-out-expo)' : 'none';
    el.style.transform = `translate3d(${z.x}px,${z.y}px,0) scale(${z.s})`;
  }, []);

  const clampPan = useCallback(() => {
    const z = zoom.current;
    const { w, h } = { w: stageRef.current?.clientWidth ?? 0, h: stageRef.current?.clientHeight ?? 0 };
    if (z.s <= 1.001) {
      z.s = 1;
      z.x = 0;
      z.y = 0;
      return;
    }
    const { layout: lo } = live.current;
    // Keep the book, not the empty stage around it, under the reader's eye.
    const bl = (lo.left + live.current.offsetOf(live.current.view)) * z.s;
    const br = bl + lo.bookW * z.s;
    const bt = lo.top * z.s;
    const bb = bt + lo.H * z.s;
    const minX = Math.min(w - br, (w - (br - bl)) / 2 - bl);
    const maxX = Math.max(-bl, (w - (br - bl)) / 2 - bl);
    const minY = Math.min(h - bb, (h - (bb - bt)) / 2 - bt);
    const maxY = Math.max(-bt, (h - (bb - bt)) / 2 - bt);
    z.x = clamp(z.x, minX, maxX);
    z.y = clamp(z.y, minY, maxY);
  }, []);

  const zoomTo = useCallback(
    (s: number, cx?: number, cy?: number, animated = true) => {
      const el = stageRef.current;
      if (!el) return;
      const f = flipRef.current;
      if (f && f.mode !== 'anim') finish({ ...f, goal: f.reverse ? 'turned' : 'flat' });
      const z = zoom.current;
      const px = cx ?? el.clientWidth / 2;
      const py = cy ?? el.clientHeight / 2;
      const next = clamp(s, 1, 4);
      const lx = (px - z.x) / z.s;
      const ly = (py - z.y) / z.s;
      z.s = next;
      z.x = px - next * lx;
      z.y = py - next * ly;
      clampPan();
      applyZoom(animated);
      setZoomLevel(z.s);
    },
    [applyZoom, clampPan, finish]
  );

  useImperativeHandle(
    ref,
    () => ({
      next: () => step(1),
      prev: () => step(-1),
      goTo: (page: number) => {
        if (zoom.current.s > 1.01) zoomTo(1);
        turn(viewOf(clamp(page, 0, n - 1)));
      },
      zoomBy: (factor: number) => zoomTo(zoom.current.s * factor),
      resetZoom: () => zoomTo(1),
    }),
    [step, turn, zoomTo, viewOf, n]
  );

  /* ── Lifecycle ─────────────────────────────────────────────────────────── */

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((b) => (Math.abs(b.w - width) < 1 && Math.abs(b.h - height) < 1 ? b : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const set = () => (live.current.reduced = mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  // Every render that changes what is open or how big it is: land cleanly.
  useLayoutEffect(() => {
    live.current.view = view;
    if (flipRef.current && flipRef.current.from !== view) {
      cancelAnimationFrame(rafRef.current);
      flipRef.current = null;
    }
    if (!flipRef.current) applyIdle();
  }, [view, layout, mounted, applyIdle]);

  useLayoutEffect(() => {
    // A resize mid-zoom would leave the pan pointing at nothing.
    zoom.current = { s: 1, x: 0, y: 0 };
    applyZoom(false);
    const raf = requestAnimationFrame(() => setZoomLevel(1));
    return () => cancelAnimationFrame(raf);
  }, [layout.spread, layout.W, applyZoom]);

  useEffect(() => {
    emit();
  }, [view, layout.spread, zoomLevel, emit]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  /* ── Pointer ───────────────────────────────────────────────────────────── */

  const gesture = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    down?: { x: number; y: number; t: number; lx: number; ly: number; offset: number; type: string; moved: boolean };
    pan?: { x: number; y: number; zx: number; zy: number };
    pinch?: { d0: number; s0: number; ax: number; ay: number };
    lastTap?: { t: number; x: number; y: number };
    tapTimer?: ReturnType<typeof setTimeout>;
    hover: boolean;
  }>({ pointers: new Map(), hover: false });

  const stagePoint = (e: { clientX: number; clientY: number }) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /** Stage point → book coordinates, ignoring the cover-centring offset
   *  except the one the book had when the gesture began. */
  const bookPoint = (sx: number, sy: number, offset: number) => {
    const { layout: lo } = live.current;
    return { x: sx - lo.left - offset, y: sy - lo.top };
  };

  const toNorm = (f: Flip, p: Vec): Vec => {
    const { layout: lo } = live.current;
    if (!lo.spread) return p;
    return f.dir === 1 ? { x: p.x - lo.W, y: p.y } : { x: lo.W - p.x, y: p.y };
  };

  const cornerZone = () => clamp(Math.min(live.current.layout.W, live.current.layout.H) * 0.16, 44, 120);

  /** Which corner, if any, a book point is close enough to lift. */
  const hotCorner = (p: Vec): { to: number; corner: Corner } | null => {
    const { layout: lo, view: v, numViews: nv } = live.current;
    const zone = cornerZone();
    const [L] = live.current.viewPages(v);
    const near = (cx: number, cy: number) => Math.hypot(p.x - cx, p.y - cy) < zone;
    const rightEdge = lo.spread ? lo.W * 2 : lo.W;
    if (v < nv - 1) {
      if (near(rightEdge, lo.H)) return { to: v + 1, corner: 'bottom' };
      if (near(rightEdge, 0)) return { to: v + 1, corner: 'top' };
    }
    if (lo.spread && v > 0 && L !== null) {
      if (near(0, lo.H)) return { to: v - 1, corner: 'bottom' };
      if (near(0, 0)) return { to: v - 1, corner: 'top' };
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const g = gesture.current;
    const sp = stagePoint(e);
    g.pointers.set(e.pointerId, sp);
    try {
      stageRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* the pointer was already released */
    }

    if (g.pointers.size === 2) {
      // Second finger: this is a pinch, whatever the first one was doing.
      const f = flipRef.current;
      if (f && f.mode === 'drag') animate(f, f.reverse ? 'turned' : 'flat', false);
      g.down = undefined;
      g.pan = undefined;
      const [a, b] = [...g.pointers.values()];
      const z = zoom.current;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      g.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: z.s, ax: (mx - z.x) / z.s, ay: (my - z.y) / z.s };
      return;
    }
    if (g.pointers.size > 2) return;

    if (zoom.current.s > 1.01) {
      g.pan = { x: sp.x, y: sp.y, zx: zoom.current.x, zy: zoom.current.y };
      g.down = { x: sp.x, y: sp.y, t: performance.now(), lx: 0, ly: 0, offset: 0, type: e.pointerType, moved: false };
      return;
    }

    const f = flipRef.current;
    if (f && f.mode === 'anim') return;

    const offset = live.current.offsetOf(live.current.view);
    const bp = bookPoint(sp.x, sp.y, offset);
    g.down = { x: sp.x, y: sp.y, t: performance.now(), lx: bp.x, ly: bp.y, offset, type: e.pointerType, moved: false };

    if (f && f.mode === 'peel') {
      // The corner is already under the pointer: pick it up.
      f.mode = 'drag';
      f.grab = { cornerGrab: true, start: toNorm(f, bp) };
      f.samples = [{ t: performance.now(), x: f.P.x }];
      g.down.moved = true;
      cancelAnimationFrame(rafRef.current);
    }
  };

  const beginDrag = (dx: number) => {
    const g = gesture.current;
    const { layout: lo, view: v, numViews: nv } = live.current;
    const down = g.down!;
    const start = { x: down.lx, y: down.ly };
    let to: number;
    if (lo.spread) {
      if (start.x < 0 || start.x > lo.bookW || start.y < 0 || start.y > lo.H) return false;
      to = start.x >= lo.W ? v + 1 : v - 1;
    } else {
      to = dx < 0 ? v + 1 : v - 1;
    }
    if (to < 0 || to > nv - 1) return false;
    const corner: Corner = start.y < lo.H / 2 ? 'top' : 'bottom';
    const f = createFlip(to, 'drag', corner);
    const hot = hotCorner(start);
    f.grab = { cornerGrab: !!hot && hot.to === to && !f.reverse, start: toNorm(f, start) };
    f.samples = [{ t: performance.now(), x: f.P.x }];
    flipRef.current = f;
    return true;
  };

  const dragTo = (f: Flip, bp: Vec) => {
    const { layout: lo } = live.current;
    const cur = toNorm(f, bp);
    const start = f.grab!.start;
    const cy = f.corner === 'bottom' ? lo.H : 0;
    let P: Vec;
    if (f.grab!.cornerGrab) {
      P = cur;
    } else if (!f.reverse) {
      // Map the whole sweep from where the page was grabbed to the far edge
      // onto the whole turn, so a drag from mid-page still completes.
      const sx = Math.max(start.x, lo.W * (lo.spread ? 0.25 : 0.35));
      const span = lo.spread ? sx + lo.W : sx;
      P = { x: lo.W - (sx - cur.x) * ((2 * lo.W) / span), y: cy + (cur.y - start.y) * (lo.spread ? 0.9 : 0.5) };
    } else {
      const room = Math.max(lo.W - start.x, lo.W * 0.35);
      P = { x: -lo.W + (cur.x - start.x) * ((2 * lo.W) / room), y: cy + (cur.y - start.y) * 0.5 };
    }
    P.x = clamp(P.x, -lo.W, lo.W);
    f.P = P;
    const now = performance.now();
    f.samples.push({ t: now, x: P.x });
    while (f.samples.length > 2 && now - f.samples[0].t > 110) f.samples.shift();
    applyFrame(f);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    const sp = stagePoint(e);
    if (g.pointers.has(e.pointerId)) g.pointers.set(e.pointerId, sp);

    if (g.pinch && g.pointers.size >= 2) {
      const [a, b] = [...g.pointers.values()];
      const z = zoom.current;
      const s = clamp((g.pinch.s0 * Math.hypot(a.x - b.x, a.y - b.y)) / g.pinch.d0, 1, 4);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      z.s = s;
      z.x = mx - s * g.pinch.ax;
      z.y = my - s * g.pinch.ay;
      clampPan();
      applyZoom(false);
      return;
    }

    if (g.pan && g.down) {
      const z = zoom.current;
      z.x = g.pan.zx + (sp.x - g.pan.x);
      z.y = g.pan.zy + (sp.y - g.pan.y);
      if (Math.hypot(sp.x - g.down.x, sp.y - g.down.y) > 6) g.down.moved = true;
      clampPan();
      applyZoom(false);
      return;
    }

    const f = flipRef.current;
    if (g.down && g.pointers.has(e.pointerId)) {
      const offset = g.down.offset;
      const bp = bookPoint(sp.x, sp.y, offset);
      if (f && f.mode === 'drag') {
        dragTo(f, bp);
        return;
      }
      const dx = sp.x - g.down.x;
      const dy = sp.y - g.down.y;
      const threshold = g.down.type === 'mouse' ? 5 : 10;
      if (!g.down.moved && Math.hypot(dx, dy) > threshold) {
        // On touch, a mostly vertical swipe is not a page turn.
        if (g.down.type !== 'mouse' && Math.abs(dy) > Math.abs(dx) * 1.3) {
          g.down.moved = true;
          return;
        }
        g.down.moved = true;
        if (beginDrag(dx) && flipRef.current) dragTo(flipRef.current, bp);
      }
      return;
    }

    // Hover: lift the corner under a fine pointer.
    if (e.pointerType !== 'mouse' || zoom.current.s > 1.01 || live.current.reduced) return;
    if (f && f.mode !== 'peel') return;
    const offset = live.current.offsetOf(live.current.view);
    const bp = bookPoint(sp.x, sp.y, offset);
    const hot = hotCorner(bp);
    if (hot && (!f || f.to === hot.to)) {
      const flip = f ?? createFlip(hot.to, 'peel', hot.corner);
      if (!f) {
        if (flip.reverse) return;
        flipRef.current = flip;
        rafRef.current = requestAnimationFrame(loop);
      }
      const target = toNorm(flip, bp);
      // Never lift more than a corner's worth on hover.
      const { W: w, H: h } = live.current.layout;
      const cy = flip.corner === 'bottom' ? h : 0;
      const zone = cornerZone();
      const dxC = target.x - w;
      const dyC = target.y - cy;
      const d = Math.hypot(dxC, dyC);
      const k = d > zone ? zone / d : 1;
      setPeelTarget(flip, { x: w + dxC * k, y: cy + dyC * k });
      if (stageRef.current) stageRef.current.style.cursor = 'grab';
    } else if (f && f.mode === 'peel') {
      const { W: w, H: h } = live.current.layout;
      f.peelTarget = { x: w, y: f.corner === 'bottom' ? h : 0 };
      if (stageRef.current) stageRef.current.style.cursor = '';
    }
  };

  const tapAt = (lx: number, ly: number) => {
    const { layout: lo, view: v } = live.current;
    if (lx < 0 || lx > lo.bookW || ly < 0 || ly > lo.H) return;
    const [L, R] = live.current.viewPages(v);
    if (lo.spread) {
      if (lx >= lo.W && R !== null) step(1);
      else if (lx < lo.W && L !== null) step(-1);
    } else {
      step(lx >= lo.W * 0.4 ? 1 : -1);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    const sp = stagePoint(e);
    g.pointers.delete(e.pointerId);

    if (g.pinch) {
      if (g.pointers.size < 2) {
        g.pinch = undefined;
        g.down = undefined;
        if (zoom.current.s < 1.08) zoomTo(1);
        else setZoomLevel(zoom.current.s);
      }
      return;
    }

    const down = g.down;
    g.down = undefined;
    g.pan = undefined;
    if (!down) return;

    const f = flipRef.current;
    if (f && f.mode === 'drag') {
      const s = f.samples;
      const first = s[0];
      const last = s[s.length - 1];
      const v = first && last && last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
      const progress = (live.current.layout.W - f.P.x) / (2 * live.current.layout.W);
      const flick = 0.35;
      let goal: 'turned' | 'flat';
      if (f.reverse) goal = v > flick || (v >= -flick && progress < 0.5) ? 'flat' : 'turned';
      else goal = v < -flick || (v <= flick && progress > 0.5) ? 'turned' : 'flat';
      animate(f, goal, false);
      if (stageRef.current) stageRef.current.style.cursor = '';
      return;
    }

    if (down.moved) return;

    // A tap. On touch, wait a beat in case it is the first of two.
    const now = performance.now();
    if (down.type !== 'mouse') {
      const last = g.lastTap;
      if (last && now - last.t < 300 && Math.hypot(sp.x - last.x, sp.y - last.y) < 36) {
        clearTimeout(g.tapTimer);
        g.lastTap = undefined;
        if (zoom.current.s > 1.01) zoomTo(1, sp.x, sp.y);
        else zoomTo(2.4, sp.x, sp.y);
        return;
      }
      g.lastTap = { t: now, x: sp.x, y: sp.y };
      if (zoom.current.s > 1.01) return;
      clearTimeout(g.tapTimer);
      g.tapTimer = setTimeout(() => tapAt(down.lx, down.ly), 260);
      return;
    }
    if (zoom.current.s > 1.01) return;
    tapAt(down.lx, down.ly);
  };

  const onPointerLeave = () => {
    const f = flipRef.current;
    if (f && f.mode === 'peel') {
      const { W: w, H: h } = live.current.layout;
      f.peelTarget = { x: w, y: f.corner === 'bottom' ? h : 0 };
    }
    if (stageRef.current) stageRef.current.style.cursor = '';
  };

  /* Wheel: pinch-zoom on a trackpad (it arrives as ctrl+wheel), pan when
     zoomed, and one turn per swipe otherwise. Needs a non-passive listener
     to stop the page scrolling underneath. */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let acc = 0;
    let quietTimer: ReturnType<typeof setTimeout> | undefined;
    let spent = false;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.ctrlKey) {
        const z = zoom.current;
        zoomTo(z.s * Math.exp(-e.deltaY * 0.012), e.clientX - r.left, e.clientY - r.top, false);
        return;
      }
      if (zoom.current.s > 1.01) {
        zoom.current.x -= e.deltaX;
        zoom.current.y -= e.deltaY;
        clampPan();
        applyZoom(false);
        return;
      }
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => {
        acc = 0;
        spent = false;
      }, 180);
      if (spent) return;
      acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(acc) > 60) {
        spent = true;
        step(acc > 0 ? 1 : -1);
        acc = 0;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      clearTimeout(quietTimer);
    };
  }, [step, zoomTo, clampPan, applyZoom]);

  /* ── Render ────────────────────────────────────────────────────────────── */

  const zoomed = zoomLevel > 1.2;
  const before = visible.length ? visible[0] : 0;
  const after = visible.length ? n - 1 - visible[visible.length - 1] : 0;
  const edge = (count: number) => (n > 2 ? Math.round(clamp((count / n) * 7, count > 0 ? 1 : 0, 7)) : 0);

  const registerNode = (i: number) => (root: HTMLDivElement | null) => {
    if (!root) {
      nodes.current.delete(i);
      return;
    }
    const shadow = root.querySelector<HTMLDivElement>('[data-shadow]')!;
    const gutter = root.querySelector<HTMLDivElement>('[data-gutter]')!;
    nodes.current.set(i, { root, shadow, gutter });
  };

  return (
    <div
      ref={stageRef}
      className="relative h-full w-full touch-none select-none overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
      onDragStart={(e) => e.preventDefault()}
    >
      <div ref={zoomRef} className="absolute inset-0 origin-top-left">
        {box.w > 0 && (
          <div
            ref={bookRef}
            className="mag-book absolute"
            style={{ left: layout.left, top: layout.top, width: layout.bookW, height: H }}
          >
            {/* The thickness of the paper already read, and still to read. */}
            {spread && edge(before) > 0 && visible[0] !== 0 && (
              <div
                aria-hidden
                className="mag-edge absolute top-[2px] bottom-[2px]"
                style={{ left: -edge(before), width: edge(before) }}
              />
            )}
            {spread && edge(after) > 0 && (
              <div
                aria-hidden
                className="mag-edge absolute top-[2px] bottom-[2px]"
                style={{
                  left: W * 2,
                  width: edge(after),
                  display: viewPages(view)[1] === null ? 'none' : undefined,
                }}
              />
            )}

            {mounted.map((i) => {
              const isVisible = visible.includes(i);
              const img = images[i];
              const links = pages[i]?.links ?? [];
              return (
                <div
                  key={i}
                  ref={registerNode(i)}
                  className="mag-page absolute left-0 top-0 origin-top-left overflow-hidden bg-[#f3f4f6]"
                  style={{ width: W, height: H, visibility: 'hidden' }}
                  role="img"
                  aria-label={`Page ${i + 1}`}
                  aria-hidden
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.t} alt="" draggable={false} className="absolute inset-0 h-full w-full object-fill" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.m}
                    alt=""
                    draggable={false}
                    decoding="async"
                    className="mag-img absolute inset-0 h-full w-full object-fill"
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      // Show it as soon as it has arrived. decode() only warms
                      // pages that are not on screen yet; the fade must never
                      // wait on it, or a page can sit blank while a busy or
                      // backgrounded tab gets round to decoding.
                      el.dataset.loaded = '1';
                      el.decode().catch(() => undefined);
                    }}
                  />
                  {zoomed && isVisible && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.h}
                      alt=""
                      draggable={false}
                      decoding="async"
                      className="mag-img absolute inset-0 h-full w-full object-fill"
                      onLoad={(e) => (e.currentTarget.dataset.loaded = '1')}
                    />
                  )}
                  <div data-gutter aria-hidden className="pointer-events-none absolute inset-0" />
                  <div
                    data-shadow
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-0 origin-top-left opacity-0"
                  />
                  {links.length > 0 && (
                    <div className="mag-links absolute inset-0">
                      {links.map((l, k) => {
                        const style = {
                          left: `${l.x * 100}%`,
                          top: `${l.y * 100}%`,
                          width: `${l.w * 100}%`,
                          height: `${l.h * 100}%`,
                        };
                        const cls =
                          'absolute rounded-[2px] outline-none transition-[background-color,box-shadow] duration-300 hover:bg-[rgba(41,163,221,0.14)] hover:shadow-[inset_0_0_0_1.5px_rgba(41,163,221,0.7)] focus-visible:bg-[rgba(41,163,221,0.14)] focus-visible:shadow-[inset_0_0_0_2px_#29a3dd]';
                        const stop = (e: React.PointerEvent) => e.stopPropagation();
                        return l.url ? (
                          <a
                            key={k}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            tabIndex={isVisible ? 0 : -1}
                            aria-label={`Link: ${l.url}`}
                            onPointerDown={stop}
                            className={cls}
                            style={style}
                          />
                        ) : (
                          <button
                            key={k}
                            type="button"
                            tabIndex={isVisible ? 0 : -1}
                            aria-label={`Go to page ${(l.page ?? 0) + 1}`}
                            onPointerDown={stop}
                            onClick={() => turn(viewOf(l.page ?? 0))}
                            className={cls}
                            style={style}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {!spread && (
              <div
                ref={paperRef}
                aria-hidden
                className="absolute left-0 top-0 origin-top-left overflow-hidden"
                style={{
                  width: W,
                  height: H,
                  visibility: 'hidden',
                  zIndex: 4,
                  background: 'linear-gradient(to right, #eceef1, #f7f8fa 30%, #f1f2f5)',
                }}
              >
                {/* The page's own print, faintly, through the paper. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={paperImgRef}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full -scale-x-100 object-fill opacity-[0.07]"
                />
                <div
                  ref={paperShadowRef}
                  className="pointer-events-none absolute left-0 top-0 origin-top-left opacity-0"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
