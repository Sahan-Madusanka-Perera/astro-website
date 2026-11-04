'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useSky } from '@/components/cosmos/sky-store';
import { mulberry32, spectralIndex, SPECTRAL } from '@/components/cosmos/spectral';

/* ---------------------------------------------------------------------------
   A long exposure of the northern sky, from campus.

   At 6.85° N the celestial pole sits less than seven degrees above the
   northern horizon, so every star in a north-facing frame turns around a
   point just over the hills. Leave a shutter open and each one draws an arc
   of that circle — 15° for every hour of exposure.

   The trails are stacked the way astrophotographers stack them in "comet"
   mode: bright at the star's current position, fading back along the path it
   came from. The fade is five flat steps rather than a gradient, and every
   step of every star of one colour goes into a single path — about ninety
   strokes a frame for the whole sky. (A conic gradient per star looked the
   same and cost the GPU seven hundred gradient fills a frame, which is where
   the hero's dropped frames came from.)

   Three clocks drive it:
   · the shutter opens on load (the trails grow from points),
   · the sky keeps turning slowly while the page is open — a time-lapse, and
     the one thing on this page that moves on its own,
   · scrolling the hero away runs the exposure on through the whole night.

   Polaris and the Little Dipper are real — true right ascension and distance
   from the pole — and the sky starts turned so the Dipper stands upright
   above the hills. (For much of the night from 7° N it hangs below the pole,
   behind them.) Bring the pointer to the pole and it draws itself.
--------------------------------------------------------------------------- */

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

/** Degrees of arc. The sky turns 15° an hour. */
const OPEN_DEG = 30;        // the shutter's first two hours, drawn on load
const NIGHT_DEG = 165;      // dusk to dawn at 7° N — where a full scroll ends
const DEEP_DEG = 75;        // the Konami deep field leaves it open longer
const STILL_DEG = 45;       // reduced motion: one fixed three-hour plate
const DRIFT_DEG_S = 0.32;   // the time-lapse turn at rest: a lap in ~19 min
const SCROLL_TURN_DEG = 36; // extra turn the scroll adds on top

/** Per brightness class: faint, mid, bright. */
const WIDTH = [0.55, 0.85, 1.3];
const ALPHA = [0.34, 0.6, 0.92];

/** The comet fade, head first: each step runs `to` of the way along the
 *  trail at `a` of the star's brightness. */
const STEPS = [
  { to: 0.12, a: 1 },
  { to: 0.3, a: 0.66 },
  { to: 0.52, a: 0.4 },
  { to: 0.76, a: 0.2 },
  { to: 1, a: 0.08 },
];

/** At rest the sky turns a fraction of a pixel a frame — redraw it at about
 *  thirty frames a second, and at the display's full rate only while
 *  something is actually moving fast. */
const IDLE_FRAME_MS = 33;

/* The Little Dipper: right ascension and polar distance (90° − dec), J2000. */
const URSA_MINOR: Array<{ ra: number; p: number; mag: number }> = [
  { ra: 37.95, p: 0.736, mag: 1.98 },   // Polaris
  { ra: 263.05, p: 3.414, mag: 4.36 },  // Yildun
  { ra: 251.49, p: 7.963, mag: 4.21 },  // ε UMi
  { ra: 236.01, p: 12.206, mag: 4.32 }, // ζ UMi
  { ra: 244.38, p: 14.245, mag: 4.95 }, // η UMi
  { ra: 230.18, p: 18.166, mag: 3.0 },  // Pherkad
  { ra: 222.68, p: 15.845, mag: 2.08 }, // Kochab
];
const URSA_LINES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3],         // the handle, out from Polaris
  [3, 4], [4, 5], [5, 6], [6, 3], // the bowl
];

/** The sidereal time the sky starts at: the Dipper's bowl just past the top
 *  of its circle, so the turn carries it down the left of the frame. */
const START_LST = 240;

function fmtExposure(deg: number) {
  const min = Math.round(deg * 4);
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

type Star = {
  r: number;   // px from the pole
  th: number;  // canvas angle at sidereal time 0, radians
  cls: 0 | 1 | 2;
  col: number; // index into SPECTRAL
};

type Meteor = {
  x: number; y: number; vx: number; vy: number; life: number; len: number;
};

export type Pole = { x: number; y: number };

interface StarTrailsProps {
  /** The pole in px, relative to this element. Nothing draws until it is known. */
  pole: Pole | null;
  /** The hero, for scroll progress. */
  scopeRef: RefObject<HTMLElement | null>;
  /** Receives the running exposure as text, written straight to the node. */
  exposureRef?: RefObject<HTMLElement | null>;
  className?: string;
}

export function StarTrails({ pole, scopeRef, exposureRef, className = '' }: StarTrailsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { deepField } = useSky();
  const deepRef = useRef(deepField);
  const poleRef = useRef(pole);
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    deepRef.current = deepField;
    kickRef.current();
  }, [deepField]);

  useEffect(() => {
    poleRef.current = pole;
    kickRef.current();
  }, [pole]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const wrapEl = wrapRef.current;
    if (!canvasEl || !wrapEl) return;
    const context = canvasEl.getContext('2d', { alpha: true });
    if (!context) return;

    const canvas = canvasEl;
    const wrap = wrapEl;
    const ctx = context;

    const MONO =
      getComputedStyle(document.documentElement).getPropertyValue('--font-jetbrains').trim() ||
      'ui-monospace';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    /* One stroke style per colour × brightness × step, built once. */
    const STYLE = SPECTRAL.map(({ rgb: [R, G, B] }) =>
      ALPHA.map((a) => STEPS.map((st) => `rgba(${R},${G},${B},${+(a * st.a).toFixed(3)})`))
    );

    let w = 0, h = 0, dpr = 1, ppd = 12;
    let at: Pole | null = null;
    let stars: Star[] = [];
    /** Stars by colour × brightness, so each step of each group is one path. */
    let groups: Star[][] = [];
    let scopeTop = 0, scopeH = 1;
    let meteors: Meteor[] = [];
    let raf = 0;
    let running = false;
    let visible = true;
    let built = false;

    /* Glow sprites for the brightest heads — cached bitmaps, not gradients. */
    const sprites = new Map<string, HTMLCanvasElement>();
    function sprite(col: number, r: number) {
      const key = `${col}|${r.toFixed(2)}`;
      const hit = sprites.get(key);
      if (hit) return hit;
      const pad = Math.max(2, r * 5);
      const size = Math.ceil(pad * 2 * dpr);
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const cc = c.getContext('2d')!;
      cc.scale(dpr, dpr);
      const [R, G, B] = SPECTRAL[col].rgb;
      const g = cc.createRadialGradient(pad, pad, 0, pad, pad, pad);
      g.addColorStop(0, `rgba(${R},${G},${B},1)`);
      g.addColorStop(0.22, `rgba(${R},${G},${B},0.7)`);
      g.addColorStop(0.5, `rgba(${R},${G},${B},0.12)`);
      g.addColorStop(1, `rgba(${R},${G},${B},0)`);
      cc.fillStyle = g;
      cc.beginPath();
      cc.arc(pad, pad, pad, 0, TAU);
      cc.fill();
      sprites.set(key, c);
      return c;
    }

    function build() {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      // Thin lines survive a lower backing resolution; a phone's GPU needs it.
      dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sprites.clear();

      const scope = scopeRef.current;
      if (scope) {
        scopeTop = scope.getBoundingClientRect().top + window.scrollY;
        scopeH = Math.max(1, scope.offsetHeight);
      }

      at = poleRef.current;
      if (!at) { built = false; return; }

      // About 70° of sky from the top of the frame to the hills.
      ppd = h / 74;

      // Every star whose circle can cross the frame, wherever the turn is.
      const R = Math.max(
        Math.hypot(at.x, at.y), Math.hypot(w - at.x, at.y),
        Math.hypot(at.x, h - at.y), Math.hypot(w - at.x, h - at.y)
      ) + 12;
      const discArea = (Math.PI * R * R) / 1_000_000;
      const target = Math.round(
        Math.min(680, Math.max(240, discArea * 150 * (coarse ? 0.8 : 1)))
      );

      const rnd = mulberry32(0x7a11 ^ Math.round(w) ^ (Math.round(h) << 8));
      stars = URSA_MINOR.map((s) => ({
        r: s.p * ppd,
        th: (s.ra - 90) * DEG,
        cls: s.mag < 2.6 ? 2 : s.mag < 4.5 ? 1 : 0,
        col: 1,
      }));
      // Keep a clear collar round the pole so Polaris reads as the centre.
      const inner = ppd * 1.6;
      for (let i = 0; i < target; i++) {
        const r = inner + (R - inner) * Math.sqrt(rnd());
        const th = rnd() * TAU;
        const b = Math.pow(rnd(), 2.5);
        stars.push({
          r, th,
          cls: b > 0.5 ? 2 : b > 0.15 ? 1 : 0,
          col: spectralIndex(rnd()),
        });
      }
      groups = Array.from({ length: SPECTRAL.length * 3 }, () => []);
      for (const st of stars) groups[st.col * 3 + st.cls].push(st);
      built = true;
    }

    const lst0 = START_LST;
    const t0 = performance.now();
    let last = t0;
    let lastDraw = 0;
    let drift = 0;
    let prog = 0;
    let deep = deepRef.current ? 1 : 0;
    let ursa = 0;
    let ursaEasing = false;
    let shownMinutes = -1;
    let meteorAt = t0 + 5000 + Math.random() * 6000;
    const pointer = { x: -9999, y: -9999, inside: false };

    function writeExposure(deg: number) {
      const min = Math.round(deg * 4);
      if (min === shownMinutes || !exposureRef?.current) return;
      shownMinutes = min;
      exposureRef.current.textContent = fmtExposure(deg);
    }

    function draw(rot: number, delta: number, fade: number, now: number, dt: number) {
      ctx.clearRect(0, 0, w, h);
      if (!at) return;
      const { x: px, y: py } = at;
      const boost = fade * (1 + deep * 0.3);

      /* ---- the trails: one path per colour, brightness and step ---- */
      ctx.lineCap = 'butt';
      ctx.globalAlpha = Math.min(1, boost);
      if (delta > 0.001) {
        for (let g = 0; g < groups.length; g++) {
          const group = groups[g];
          if (!group.length) continue;
          const col = (g / 3) | 0;
          const cls = g % 3;
          ctx.lineWidth = WIDTH[cls];
          let from = 0;
          for (let k = 0; k < STEPS.length; k++) {
            const to = STEPS[k].to;
            ctx.strokeStyle = STYLE[col][cls][k];
            ctx.beginPath();
            for (let i = 0; i < group.length; i++) {
              const s = group[i];
              const a0 = s.th - rot + from * delta;
              ctx.moveTo(px + s.r * Math.cos(a0), py + s.r * Math.sin(a0));
              ctx.arc(px, py, s.r, a0, s.th - rot + to * delta);
            }
            ctx.stroke();
            from = to;
          }
        }
      }

      /* ---- the brightest stars, where they are now ---- */
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (s.cls !== 2) continue;
        const head = s.th - rot;
        const x = px + s.r * Math.cos(head);
        const y = py + s.r * Math.sin(head);
        if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
        const r = i === 0 ? 1.9 : 1.25;
        const sp = sprite(s.col, r);
        const pad = Math.max(2, r * 5);
        ctx.drawImage(sp, x - pad, y - pad, pad * 2, pad * 2);
      }
      ctx.globalAlpha = 1;

      /* ---- the Little Dipper, on approach ---- */
      const near = pointer.inside ? Math.hypot(pointer.x - px, pointer.y - py) : 1e9;
      const reach = 20 * ppd;
      const ursaTarget = Math.max(deepRef.current ? 0.85 : 0, 1 - near / reach);
      ursa += (ursaTarget - ursa) * Math.min(1, dt / 280);
      ursaEasing = Math.abs(ursaTarget - ursa) > 0.004;
      if (ursa > 0.01) {
        const pts = URSA_MINOR.map((_, i) => {
          const s = stars[i];
          const head = s.th - rot;
          return { x: px + s.r * Math.cos(head), y: py + s.r * Math.sin(head) };
        });
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(111,208,247,${0.6 * ursa})`;
        ctx.shadowColor = `rgba(41,163,221,${0.6 * ursa})`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (const [a, b] of URSA_LINES) {
          ctx.moveTo(pts[a].x, pts[a].y);
          ctx.lineTo(pts[b].x, pts[b].y);
        }
        ctx.stroke();
        ctx.restore();
        if (ursa > 0.4) {
          // Labelled off the far side of the bowl, away from the pole.
          const bowl = [3, 4, 5, 6].map((i) => pts[i]);
          const bx = bowl.reduce((a, p) => a + p.x, 0) / 4;
          const by = bowl.reduce((a, p) => a + p.y, 0) / 4;
          const d = Math.hypot(bx - px, by - py) || 1;
          const lx = bx + ((bx - px) / d) * 34;
          const ly = by + ((by - py) / d) * 34;
          ctx.save();
          ctx.globalAlpha = (ursa - 0.4) / 0.6;
          ctx.textAlign = 'center';
          ctx.font = `500 10px ${MONO}`;
          ctx.letterSpacing = '0.22em';
          ctx.fillStyle = 'rgba(182,230,255,0.9)';
          ctx.fillText('URSA MINOR', lx, ly);
          ctx.restore();
        }
      }

      /* ---- meteors: straight, because they're not turning with the sky ---- */
      if (!reduced) {
        if (now > meteorAt) {
          meteorAt = now + 14_000 + Math.random() * 16_000;
          const fromLeft = Math.random() > 0.5;
          const speed = 0.5 + Math.random() * 0.3;
          meteors.push({
            x: fromLeft ? w * (0.05 + Math.random() * 0.3) : w * (0.65 + Math.random() * 0.3),
            y: h * (0.04 + Math.random() * 0.22),
            vx: (fromLeft ? 1 : -1) * speed,
            vy: speed * (0.35 + Math.random() * 0.3),
            life: 1,
            len: 70 + Math.random() * 90,
          });
        }
        for (const m of meteors) {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          m.life -= dt / 1100;
          if (m.life <= 0) continue;
          const tailX = m.x - m.vx * m.len;
          const tailY = m.y - m.vy * m.len;
          const g = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          const a = Math.sin(Math.PI * m.life) * 0.9;
          g.addColorStop(0, `rgba(255,255,255,${a})`);
          g.addColorStop(0.35, `rgba(182,230,255,${a * 0.45})`);
          g.addColorStop(1, 'rgba(111,208,247,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        }
        meteors = meteors.filter((m) => m.life > 0);
      }
    }

    /* From the scroll position and the hero's measured place — no layout
       read on the frame path. */
    function progress() {
      return Math.min(1, Math.max(0, (window.scrollY - scopeTop) / scopeH));
    }

    /* Reduced motion: one plate, redrawn only when something changes. */
    function still() {
      if (!built) build();
      if (!built) return;
      const delta = STILL_DEG + (deepRef.current ? DEEP_DEG : 0);
      deep = deepRef.current ? 1 : 0;
      draw(lst0 * DEG, delta * DEG, 1, performance.now(), 0);
      writeExposure(delta);
    }

    function frame(now: number) {
      if (!running) return;
      const dt = Math.min(64, now - last);
      last = now;
      if (!built) build();

      const opening = now - t0 < 3300;
      const shutter = easeOutExpo(Math.max(0, (now - t0 - 250) / 2800));
      drift += (DRIFT_DEG_S * dt) / 1000;
      const p = progress();
      const before = prog;
      prog += (p - prog) * (1 - Math.exp(-dt / 90));
      const deepTo = deepRef.current ? 1 : 0;
      deep += (deepTo - deep) * (1 - Math.exp(-dt / 600));

      // Full rate while the shutter opens, the page scrolls, a meteor falls
      // or a reveal is easing; otherwise the slow turn at the idle rate.
      const busy =
        opening ||
        Math.abs(prog - before) > 0.0002 ||
        Math.abs(deepTo - deep) > 0.002 ||
        meteors.length > 0 ||
        ursaEasing;
      if (busy || now - lastDraw >= IDLE_FRAME_MS) {
        const delta = OPEN_DEG * shutter + (NIGHT_DEG - OPEN_DEG) * prog + DEEP_DEG * deep;
        const rot = lst0 + drift + SCROLL_TURN_DEG * prog;
        const fade = 0.25 + 0.75 * shutter;
        draw(rot * DEG, delta * DEG, fade, now, Math.min(64, now - lastDraw));
        lastDraw = now;
        writeExposure(delta);
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      last = lastDraw = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    kickRef.current = () => {
      built = false;
      if (reduced) still();
    };

    if (reduced) still();
    else start();

    const ro = new ResizeObserver(() => {
      built = false;
      if (reduced) still();
    });
    ro.observe(wrap);

    // Don't burn frames on a sky nobody can see.
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) start();
        else stop();
      },
      { rootMargin: '80px' }
    );
    io.observe(wrap);

    const onVis = () => (document.hidden ? stop() : start());
    const onPointer = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.inside = true;
    };
    const onLeave = () => { pointer.inside = false; };

    document.addEventListener('visibilitychange', onVis);
    if (!coarse) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    }

    return () => {
      stop();
      kickRef.current = () => {};
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [scopeRef, exposureRef]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
