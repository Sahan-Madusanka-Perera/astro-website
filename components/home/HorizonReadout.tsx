'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { phaseOf, limbPath, type MoonPhase } from '@/lib/moon';

/* ---------------------------------------------------------------------------
   The hero's annotation row.

   The direction contract promises a visitor finds the next observation night
   without scrolling twice — so the answer belongs on the horizon, not four
   sections down.

   Three groups, deliberately not one string: the place (faint, it is context),
   the sky (lit, it is the datum the promise rests on), and the scroll
   affordance (quiet, and fenced off by a rule so it does not read as more
   data). On a phone the row wraps and the place gives up its second line
   rather than the sky giving up the answer.

   Everything degrades: with no events the moon still shows, and with neither
   the row is just the place.
--------------------------------------------------------------------------- */

function MoonGlyph({ p }: { p: number }) {
  const r = 7;
  const path = limbPath(p, r);
  return (
    <svg viewBox="-9 -9 18 18" className="h-[1.15em] w-[1.15em] shrink-0" aria-hidden>
      <circle r={r} fill="#0d1526" stroke="rgba(255,255,255,0.18)" strokeWidth="0.9" />
      <g transform={path.waning ? 'scale(-1,1)' : undefined}>
        <path d={path.d} fill="#e4ecf6" />
      </g>
    </svg>
  );
}

export function HorizonReadout() {
  const { events } = useEvents();
  const [moon, setMoon] = useState<MoonPhase | null>(null);

  // After mount only — the date differs across hydration.
  useEffect(() => setMoon(phaseOf(new Date())), []);

  const next = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => {
        const t = +new Date(e.date);
        return !Number.isNaN(t) && t >= now;
      })
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];
  }, [events]);

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3.5">
      {/* the place */}
      <p className="label-chart basis-full leading-relaxed sm:basis-auto">
        <span className="text-azure-haze/70">6.8524° N</span>
        <span className="mx-2 text-star-ghost">/</span>
        <span className="text-azure-haze/70">79.9040° E</span>
        <span className="mt-1.5 hidden lg:block">
          University of Sri Jayewardenepura
        </span>
      </p>

      <div className="flex basis-full items-center justify-between gap-6 sm:basis-auto sm:justify-end sm:gap-7">
        {/* the sky — the datum the story promise rests on, so it is the
            brightest thing in the row */}
        {(next || moon) && (
          <div className="flex items-center gap-4 sm:gap-5">
            {next && (
              <a
                href="#events"
                className="group flex items-baseline gap-2 transition-colors hover:text-azure-glow"
              >
                <span className="label-chart">Next</span>
                <span className="font-mono text-[0.8125rem] tracking-[0.06em] text-starlight transition-colors group-hover:text-azure-glow">
                  {new Date(next.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              </a>
            )}

            {moon && (
              <p
                className="flex items-center gap-2"
                title={`${moon.name}, ${Math.round(moon.illumination * 100)}% illuminated`}
              >
                <MoonGlyph p={moon.p} />
                <span className="font-mono text-[0.8125rem] tracking-[0.06em] text-star-dim">
                  {moon.toNew <= 2 ? 'Dark skies' : `New −${moon.toNew}d`}
                </span>
              </p>
            )}
          </div>
        )}

        {/* the affordance — fenced off so it doesn't read as another reading */}
        <a
          href="#planets"
          className="group flex items-center gap-3 border-l border-rule pl-6 text-star-faint transition-colors hover:text-azure-glow sm:pl-7"
          aria-label="Scroll to the club's planets"
        >
          <span className="label-chart transition-colors group-hover:text-azure-glow">
            Scroll
          </span>
          <span
            aria-hidden
            className="block h-7 w-px bg-gradient-to-b from-star-ghost to-transparent"
          />
        </a>
      </div>
    </div>
  );
}
