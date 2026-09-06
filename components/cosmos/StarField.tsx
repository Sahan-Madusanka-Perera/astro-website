'use client';

import { useEffect, useRef } from 'react';
import { useSky } from './sky-store';

/* ---------------------------------------------------------------------------
   The sky.
   One canvas for the whole site, drawn at device resolution, replacing the
   ~300 individually-animated DOM nodes this page used to run.

   Stars are coloured by spectral class rather than painted white, so the field
   has the faint blue/gold scatter a real dark-sky exposure has. Positions come
   from a seeded PRNG so the server and the client agree and nothing flickers
   on hydration.

   Hidden in the field, at a fixed place, is Orion. Bring the pointer near it
   and the asterism draws itself.
--------------------------------------------------------------------------- */

/** Deterministic PRNG — same field every render, no hydration mismatch. */
function mulberry32(seed: number) {
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
const SPECTRAL: Array<{ rgb: [number, number, number]; w: number }> = [
  { rgb: [155, 188, 255], w: 0.10 }, // O/B  blue
  { rgb: [202, 220, 255], w: 0.16 }, // A    blue-white
  { rgb: [248, 247, 255], w: 0.30 }, // F    white
  { rgb: [255, 244, 222], w: 0.24 }, // G    yellow-white
  { rgb: [255, 218, 172], w: 0.14 }, // K    orange
  { rgb: [255, 186, 150], w: 0.06 }, // M    red
];

function pickSpectral(r: number): [number, number, number] {
  let acc = 0;
  for (const s of SPECTRAL) {
    acc += s.w;
    if (r <= acc) return s.rgb;
  }
  return SPECTRAL[2].rgb;
}

/* Orion, in normalised asterism space (x right, y down). */
const ORION_STARS: Array<{ x: number; y: number; mag: number; name: string }> = [
  { x: 0.50, y: 0.02, mag: 3.4, name: 'Meissa' },
  { x: 0.29, y: 0.20, mag: 0.5, name: 'Betelgeuse' },
  { x: 0.73, y: 0.17, mag: 1.6, name: 'Bellatrix' },
  { x: 0.40, y: 0.53, mag: 1.7, name: 'Alnitak' },
  { x: 0.50, y: 0.50, mag: 1.7, name: 'Alnilam' },
  { x: 0.60, y: 0.47, mag: 2.2, name: 'Mintaka' },
  { x: 0.32, y: 0.87, mag: 2.1, name: 'Saiph' },
  { x: 0.76, y: 0.90, mag: 0.1, name: 'Rigel' },
];

/* Index pairs into ORION_STARS — the asterism as it is actually drawn. */
const ORION_LINES: Array<[number, number]> = [
  [0, 1], [0, 2],           // head to shoulders
  [1, 2],                   // shoulder line
  [1, 3], [2, 5],           // shoulders down to belt
  [3, 4], [4, 5],           // the belt
  [3, 6], [5, 7],           // belt down to legs
];

type Star = {
  x: number; y: number;      // 0..1 of the field
  r: number;                 // radius in css px
  a: number;                 // base alpha
  rgb: [number, number, number];
  depth: number;             // 0 far … 1 near — drives parallax
  phase: number;             // scintillation phase
  speed: number;             // scintillation rate
};

type Meteor = {
  x: number; y: number; vx: number; vy: number; life: number; len: number;
};

interface StarFieldProps {
  /** Stars per million css px². Lower for content-heavy sections. */
  density?: number;
  /** Draw the hidden Orion into this field. Home hero only. */
  constellation?: boolean;
  /** Meteors per minute, roughly. 0 disables them. */
  meteorRate?: number;
  className?: string;
}

export function StarField({
  density = 190,
  constellation = false,
  meteorRate = 5,
  className = '',
}: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { deepField } = useSky();
  const deepRef = useRef(deepField);
  deepRef.current = deepField;

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const wrapEl = wrapRef.current;
    if (!canvasEl || !wrapEl) return;
    const context = canvasEl.getContext('2d', { alpha: true });
    if (!context) return;

    // Narrowed aliases — the closures below outlive the null checks above.
    const canvas = canvasEl;
    const wrap = wrapEl;
    const ctx = context;

    /* Canvas text can't inherit CSS, so read the site's own mono off the
       root variable rather than falling back to the platform's. */
    const MONO =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--font-jetbrains')
        .trim() || 'ui-monospace';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    let w = 0, h = 0, dpr = 1;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let raf = 0;
    let visible = true;
    let running = true;

    /* Glow sprites. Drawing a few hundred radial gradients per frame is what
       makes canvas star fields chug; drawing a few cached bitmaps does not. */
    const sprites = new Map<string, HTMLCanvasElement>();
    function sprite(rgb: [number, number, number], r: number) {
      const key = `${rgb[0]},${rgb[1]},${rgb[2]}|${r.toFixed(2)}`;
      const hit = sprites.get(key);
      if (hit) return hit;
      const pad = Math.max(2, r * 5);
      const size = Math.ceil(pad * 2 * dpr);
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const cc = c.getContext('2d')!;
      cc.scale(dpr, dpr);
      const g = cc.createRadialGradient(pad, pad, 0, pad, pad, pad);
      const [R, G, B] = rgb;
      g.addColorStop(0, `rgba(${R},${G},${B},1)`);
      g.addColorStop(0.22, `rgba(${R},${G},${B},0.75)`);
      g.addColorStop(0.5, `rgba(${R},${G},${B},0.14)`);
      g.addColorStop(1, `rgba(${R},${G},${B},0)`);
      cc.fillStyle = g;
      cc.beginPath();
      cc.arc(pad, pad, pad, 0, Math.PI * 2);
      cc.fill();
      sprites.set(key, c);
      return c;
    }

    function build() {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sprites.clear();

      // Density scales with area but is capped so a 4K monitor doesn't melt.
      const area = (w * h) / 1_000_000;
      const target = Math.round(
        Math.min(520, Math.max(70, area * density * (coarse ? 0.62 : 1)))
      );

      const rnd = mulberry32(0x5eed ^ Math.round(w) ^ (Math.round(h) << 8));
      stars = Array.from({ length: target }, () => {
        const depth = rnd();
        // Near stars are fewer and brighter — that's what gives the field depth.
        const bright = Math.pow(rnd(), 2.4);
        return {
          x: rnd(),
          y: rnd(),
          r: 0.42 + bright * 1.5 + depth * 0.35,
          a: 0.24 + bright * 0.7,
          rgb: pickSpectral(rnd()),
          depth,
          phase: rnd() * Math.PI * 2,
          speed: 0.35 + rnd() * 0.9,
        };
      });
    }

    /* Orion sits in the upper-right quadrant of the field, at a fixed spot so
       it can actually be found twice. Returns screen-space points. */
    const orionBox = () => {
      // Sized and placed to sit clear of the fixed nav above it and the
      // wordmark beside it — a clipped constellation isn't worth finding.
      const size = Math.min(w * 0.28, h * 0.5, 360);
      const ox = w * (coarse ? 0.62 : 0.78) - size / 2;
      const oy = h * 0.42 - size / 2;
      return { ox, oy, size };
    };

    let pointer = { x: -9999, y: -9999, inside: false };
    let scrollY = window.scrollY;
    let orionGlow = 0;   // 0..1, eases toward target
    let deepGlow = 0;

    const onPointer = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.inside = true;
    };
    const onLeave = () => { pointer.inside = false; };
    const onScroll = () => { scrollY = window.scrollY; };

    let last = performance.now();
    let meteorAt = performance.now() + 4000 + Math.random() * 6000;

    function frame(now: number) {
      if (!running) return;
      const dt = Math.min(64, now - last);
      last = now;

      ctx.clearRect(0, 0, w, h);

      if (!visible) { raf = requestAnimationFrame(frame); return; }

      const t = now / 1000;
      const rect = wrap.getBoundingClientRect();
      // Parallax: how far this field has travelled through the viewport.
      const travel = reduced ? 0 : (scrollY + window.innerHeight - rect.top - rect.height * 0.5) * 0.06;

      // Deep-field: the Konami reward. The sky opens up.
      const deepTarget = deepRef.current ? 1 : 0;
      deepGlow += (deepTarget - deepGlow) * Math.min(1, dt / 420);

      /* ---- stars ---- */
      for (const s of stars) {
        const par = reduced ? 0 : travel * (0.25 + s.depth * 1.35);
        let y = s.y * h - par;
        // wrap so the field never runs out as you scroll
        const span = h + 200;
        y = ((y + 100) % span + span) % span - 100;
        const x = s.x * w;

        // Scintillation. Atmospheric, so nearer (brighter) stars twinkle less.
        const tw = reduced
          ? 1
          : 0.72 + 0.28 * Math.sin(t * s.speed + s.phase) * (1 - s.depth * 0.55);

        const alpha = Math.min(1, s.a * tw * (1 + deepGlow * 0.5));
        const r = s.r * (1 + deepGlow * 0.45);
        const sp = sprite(s.rgb, r);
        const pad = Math.max(2, r * 5);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sp, x - pad, y - pad, pad * 2, pad * 2);
      }
      ctx.globalAlpha = 1;

      /* ---- the hidden constellation ---- */
      if (constellation) {
        const { ox, oy, size } = orionBox();
        const cx = ox + size / 2;
        const cy = oy + size / 2 - (reduced ? 0 : travel * 0.5);

        const near = pointer.inside
          ? Math.hypot(pointer.x - cx, pointer.y - cy)
          : 9999;
        // Reveal within ~1.15 box-widths of centre, or whenever deep field is on.
        const proximity = Math.max(0, 1 - near / (size * 1.15));
        const target = Math.max(deepRef.current ? 0.85 : 0, proximity);
        orionGlow += (target - orionGlow) * Math.min(1, dt / 260);

        if (orionGlow > 0.01) {
          const pts = ORION_STARS.map((s) => ({
            x: ox + s.x * size,
            y: cy - size / 2 + s.y * size,
            mag: s.mag,
            name: s.name,
          }));

          // Asterism lines — hairlines, in the club's azure.
          ctx.save();
          ctx.lineWidth = 1;
          ctx.lineCap = 'round';
          ctx.strokeStyle = `rgba(111, 208, 247, ${0.55 * orionGlow})`;
          ctx.shadowColor = `rgba(41, 163, 221, ${0.6 * orionGlow})`;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          for (const [a, b] of ORION_LINES) {
            ctx.moveTo(pts[a].x, pts[a].y);
            ctx.lineTo(pts[b].x, pts[b].y);
          }
          ctx.stroke();
          ctx.restore();

          // The named stars themselves, sized by real magnitude.
          for (const p of pts) {
            const r = 1.5 + (3.6 - Math.min(3.4, p.mag)) * 0.72;
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4.5);
            g.addColorStop(0, `rgba(255,255,255,${orionGlow})`);
            g.addColorStop(0.3, `rgba(182, 230, 255, ${0.8 * orionGlow})`);
            g.addColorStop(1, 'rgba(111,208,247,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 4.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Label, once the reveal is well underway.
          if (orionGlow > 0.45) {
            ctx.save();
            ctx.globalAlpha = (orionGlow - 0.45) / 0.55;
            ctx.fillStyle = 'rgba(182, 230, 255, 0.85)';
            ctx.font = `500 10px ${MONO}`;
            ctx.letterSpacing = '0.22em';
            ctx.textAlign = 'center';
            ctx.fillText('O R I O N', ox + size / 2, cy + size / 2 + 26);
            ctx.font = `400 9px ${MONO}`;
            ctx.fillStyle = 'rgba(127, 142, 168, 0.9)';
            ctx.fillText('05h 35m −05° 27′', ox + size / 2, cy + size / 2 + 42);
            ctx.restore();
          }
        }
      }

      /* ---- meteors ---- */
      if (!reduced && meteorRate > 0) {
        if (now > meteorAt) {
          const gap = (60_000 / meteorRate) * (0.55 + Math.random());
          meteorAt = now + gap;
          const fromLeft = Math.random() > 0.5;
          const speed = 0.42 + Math.random() * 0.3;
          meteors.push({
            x: fromLeft ? -40 : w + 40,
            y: Math.random() * h * 0.55,
            vx: (fromLeft ? 1 : -1) * speed,
            vy: speed * (0.42 + Math.random() * 0.3),
            life: 1,
            len: 90 + Math.random() * 120,
          });
        }
        for (const m of meteors) {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          m.life -= dt / 1400;
          if (m.life <= 0) continue;
          const tailX = m.x - m.vx * m.len;
          const tailY = m.y - m.vy * m.len;
          const g = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          const a = Math.sin(Math.PI * m.life) * 0.85;
          g.addColorStop(0, `rgba(255,255,255,${a})`);
          g.addColorStop(0.35, `rgba(182,230,255,${a * 0.45})`);
          g.addColorStop(1, 'rgba(111,208,247,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.35;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        }
        meteors = meteors.filter(
          (m) => m.life > 0 && m.x > -400 && m.x < w + 400 && m.y < h + 200
        );
      }

      raf = requestAnimationFrame(frame);
    }

    build();
    raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => build());
    ro.observe(wrap);

    // Don't burn frames on a field nobody can see.
    const io = new IntersectionObserver(
      ([e]) => { visible = e.isIntersecting; },
      { rootMargin: '120px' }
    );
    io.observe(wrap);

    const onVis = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('scroll', onScroll, { passive: true });
    if (constellation && !coarse) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('pointerleave', onLeave);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [density, constellation, meteorRate]);

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
