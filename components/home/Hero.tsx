'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Shell } from '@/components/layout/Section';
import { useScrollMotion } from '@/hooks/useScrollMotion';
import { HorizonReadout } from './HorizonReadout';
import { StarTrails, type Pole } from './StarTrails';
import {
  DOME_TOP, FarRidge, MidRidge, NearRidge, Observatory, PLATEAU, POLE_X, SCOPE_X, Telescope,
} from './Landscape';

/* ---------------------------------------------------------------------------
   The first viewport: a long exposure from a dark-sky site.

   The camera faces north from the hills. The stars wheel round the pole,
   which at the campus's latitude sits just over the ridgeline, above a small
   observatory; the club's telescope stands in the foreground, trained on the
   sky. The wordmark is set in the landscape rather than on top of it — in
   front of the far hills, behind the near one.

   Five planes, each moving at its own rate:

     sky ─ far ridge ─ middle ridge + observatory ─ wordmark ─ near ridge
                                                               + telescope
                                                               + the content

   · Scrolling away runs the exposure on through the night, and the planes
     part: the sky barely moves, the ridges sink at their own rates, and the
     wordmark sets behind the near hill like a moonset. Scrubbed, so it holds
     wherever the reader stops.
   · On a desktop pointer, the planes shift a few pixels against the cursor —
     the parallax of a head moving. The foreground and everything clickable
     stay put.
   · On load the shutter opens, the wordmark pulls into focus, and the
     telescope slews up off the horizontal. All CSS, so it plays before
     hydration and rests in its final state if it never plays at all.
--------------------------------------------------------------------------- */

/** How far each plane lags the page, as a fraction of the hero's height. */
const LAG = { sky: 0.74, far: 0.6, mid: 0.5, mark: 0.4 } as const;

/** Sum offsets up the offsetParent chain — layout position, ignoring the
 *  parallax transforms, so a mid-scroll resize still measures the rest pose. */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Plays one of the hero's entrance keyframes, `at` seconds after load. */
const enter = (name: string, at: number, extra: Vars = {}): Vars => ({
  '--in': name,
  '--in-at': `${at}s`,
  ...extra,
});

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const domeRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const exposureRef = useRef<HTMLSpanElement>(null);
  const [pole, setPole] = useState<Pole | null>(null);

  /* Find the pole over the observatory's roof — about four degrees of sky
     above it. Re-measured whenever the hero or its foreground changes size. */
  useIsoLayoutEffect(() => {
    const section = sectionRef.current;
    const sky = skyRef.current;
    const dome = domeRef.current;
    const ground = groundRef.current;
    if (!section || !sky || !dome || !ground) return;

    const measure = () => {
      const H = section.offsetHeight;
      const d = offsetIn(dome, section);
      const s = offsetIn(sky, section);
      const px = d.x + dome.offsetWidth / 2;
      const py = d.y + dome.offsetHeight * DOME_TOP - H * 0.05;
      // The airglow sits on the hills, wherever the hills are.
      sky.style.setProperty('--hz', `${(py - s.y).toFixed(0)}px`);
      sky.style.setProperty('--hx', `${(px - s.x).toFixed(0)}px`);
      setPole((prev) => {
        const next = { x: px - s.x, y: py - s.y };
        return prev && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5
          ? prev
          : next;
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(ground);
    return () => ro.disconnect();
  }, []);

  /* Leaving the site. Each plane lags the page by its depth; the near ridge
     and the content ride with it. */
  useScrollMotion(sectionRef, ({ gsap }, section) => {
    const q = gsap.utils.selector(section);
    const H = () => section.offsetHeight;
    const tl = gsap.timeline({
      defaults: { ease: 'none', duration: 1 },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.3,
        invalidateOnRefresh: true,
      },
    });
    (Object.keys(LAG) as Array<keyof typeof LAG>).forEach((plane) => {
      tl.to(q(`[data-depth="${plane}"]`), { y: () => H() * LAG[plane] }, 0);
    });
  });

  /* A head moving, on a desktop pointer only. Eased toward the cursor and
     stopped once it arrives, so nothing runs while the pointer is still.
     Each plane's translate is written to it directly: a custom property on
     the section would restyle the whole hero on every frame. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    const planes = Array.from(section.querySelectorAll<HTMLElement>('.hero-par')).map((el) => ({
      el,
      dx: parseFloat(el.style.getPropertyValue('--dx')) || 0,
      dy: parseFloat(el.style.getPropertyValue('--dy')) || 0,
    }));

    let tx = 0, ty = 0, x = 0, y = 0;
    let raf = 0;
    let last = 0;
    const step = (now: number) => {
      const k = 1 - Math.exp(-Math.min(64, now - last) / 220);
      last = now;
      x += (tx - x) * k;
      y += (ty - y) * k;
      for (const p of planes) {
        p.el.style.translate = `${(x * p.dx).toFixed(2)}px ${(y * p.dy).toFixed(2)}px`;
      }
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(step) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (window.scrollY > section.offsetHeight) return;
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-void"
    >
      {/* ── The sky ───────────────────────────────────────────────────────── */}
      <div data-depth="sky" aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          ref={skyRef}
          className="hero-par hero-sky absolute inset-[-3%]"
          style={{ '--dx': '-10px', '--dy': '-6px' } as Vars}
        >
          <StarTrails pole={pole} scopeRef={sectionRef} exposureRef={exposureRef} />

        </div>
      </div>

      {/* Polaris, annotated the way a plate is — over the hills, since an
          annotation sits on the plate rather than in the scene. It travels
          with the sky. */}
      <div data-depth="sky" aria-hidden className="pointer-events-none absolute inset-0 z-[3]">
        <div className="hero-par absolute inset-[-3%]" style={{ '--dx': '-10px', '--dy': '-6px' } as Vars}>
          {pole && (
            <div className="absolute" style={{ left: pole.x, top: pole.y }}>
              <div
                className="hero-in text-shadow-void absolute right-4 top-0 flex -translate-y-1/2 flex-row-reverse items-center gap-3"
                style={enter('hero-fade', 2.2, { '--in-dur': '1.4s' })}
              >
                <span className="block h-px w-7 bg-azure-glow/40 sm:w-9" />
                <span className="flex flex-col items-end gap-1.5 whitespace-nowrap" data-numeric>
                  <span className="label-chart text-azure-haze/85">Polaris</span>
                  <span className="label-chart">Alt 6.9°</span>
                  <span className="label-chart">
                    Exp <span ref={exposureRef}>0h 00m</span>
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      {/* ── The wordmark, between the hills ───────────────────────────────── */}
      <div
        data-depth="mark"
        className="relative z-[3] pb-[24svh] pt-28 [--wm:min(21.5vw,15svh)] sm:pb-[22svh] sm:[--wm:min(17vw,19svh)] lg:pb-[16.5svh] lg:[--wm:min(12vw,12.5rem,21svh)]"
      >
        <Shell>
          <div className="hero-par" style={{ '--dx': '-12px', '--dy': '-6px' } as Vars}>
            <h1 className="display display-xl text-shadow-void">
              <span
                className="hero-in block text-[length:var(--wm)] leading-[0.84] tracking-[-0.04em]"
                style={enter('hero-focus', 0.3, { '--in-dur': '2s' })}
              >
                J&apos;PURA
              </span>
              <span
                className="hero-in mt-[calc(var(--wm)*0.12)] block text-[length:calc(var(--wm)*0.235)] font-normal leading-none tracking-[0.47em] text-azure-glow"
                style={enter('hero-track', 0.8, { '--in-dur': '2s', '--track-from': '0.85em' })}
              >
                ASTRONOMY&nbsp;CLUB
              </span>
            </h1>
          </div>
        </Shell>
      </div>

      {/* ── The ground ────────────────────────────────────────────────────── */}
      <div ref={groundRef} className="relative">
        {/* the far ridge, palest, with the hairline */}
        <div
          data-depth="far"
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-full z-[1] h-[28svh]"
        >
          <div
            className="hero-par absolute inset-y-0 -inset-x-8"
            style={{ '--dx': '-16px', '--dy': '-8px' } as Vars}
          >
            <div className="hero-in absolute inset-0" style={enter('hero-settle', 0, { '--in-dur': '2.6s', '--settle': '18px' })}>
              <FarRidge className="text-ridge-far" />
              <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-azure-lit/[0.09] to-transparent" />
            </div>
          </div>
        </div>

        {/* the middle ridge, and the observatory under the pole */}
        <div
          data-depth="mid"
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-full z-[2] h-[19svh]"
        >
          <div
            className="hero-par absolute inset-y-0 -inset-x-8"
            style={{ '--dx': '-24px', '--dy': '-12px' } as Vars}
          >
            <div className="hero-in absolute inset-0 text-ridge-mid" style={enter('hero-settle', 0, { '--in-dur': '2.6s', '--settle': '30px' })}>
              <MidRidge />
              <div
                ref={domeRef}
                className="absolute bottom-0 h-[min(16svh,40vw)] w-[calc(min(16svh,40vw)*260/170)]"
                style={{ left: `${POLE_X * 100}%`, marginLeft: 'calc(min(16svh,40vw) * -130 / 170)' }}
              >
                <Observatory className="block h-full w-full" />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-azure-lit/[0.07] to-transparent" />
            </div>
          </div>
        </div>

        {/* the near ridge, and the club's telescope on it */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-[calc(100%-2px)] z-[4] h-[13svh]"
        >
          <div
            className="hero-par absolute inset-y-0 -inset-x-12"
            style={{ '--dx': '-34px' } as Vars}
          >
            <div className="hero-in absolute inset-0 text-void" style={enter('hero-settle', 0, { '--in-dur': '2.6s', '--settle': '46px' })}>
              <NearRidge />
              <div
                className="absolute h-[min(clamp(6rem,20svh,12rem),32vw)] w-[calc(min(clamp(6rem,20svh,12rem),32vw)*140/170)] -translate-x-1/2"
                style={{ left: `${SCOPE_X * 100}%`, bottom: `calc(${PLATEAU * 100}% - 1px)` }}
              >
                <Telescope className="block h-full w-full" />
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden className="absolute inset-0 z-[4] bg-void" />

        {/* ── The foreground: what to read, and what to do ─────────────────── */}
        <div className="relative z-[5]">
          <Shell className="pb-6 md:pb-8">
            <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between md:gap-12">
              <p
                className="hero-in max-w-[40ch] text-pretty text-[1.0625rem] leading-[1.6] text-star-dim md:text-[1.1875rem]"
                style={enter('hero-rise', 1.05)}
              >
                We keep the telescopes, teach the sky, and drive out past the
                streetlights to find it properly dark.
              </p>

              <div className="hero-in flex shrink-0 items-center gap-3 sm:gap-4" style={enter('hero-rise', 1.2)}>
                <Link
                  href="#events"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-azure px-6 py-3.5 text-[0.9375rem] font-medium text-white transition-[background-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-azure-lit hover:shadow-[0_10px_40px_-8px_rgba(41,163,221,0.65)] sm:px-7"
                >
                  What&apos;s on
                  <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#about"
                  className="inline-flex items-center gap-2.5 rounded-full border border-rule-lit px-6 py-3.5 text-[0.9375rem] font-medium text-star-dim transition-colors duration-500 hover:border-azure-lit/60 hover:text-starlight sm:px-7"
                >
                  About the club
                </Link>
              </div>
            </div>

            <div
              className="hero-in rule-h mt-7 origin-left md:mt-9"
              style={enter('hero-draw', 1.35, { '--in-dur': '1.8s' })}
            />
            <div className="hero-in pt-5" style={enter('hero-fade', 1.5)}>
              <HorizonReadout />
            </div>
          </Shell>
        </div>
      </div>
    </section>
  );
}
