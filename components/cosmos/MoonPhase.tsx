'use client';

import { useEffect, useState } from 'react';
import { phaseOf, limbPath, type MoonPhase as Phase } from '@/lib/moon';

/* ---------------------------------------------------------------------------
   Tonight's moon, drawn from the actual date.

   Not decoration: the moon's phase is the single biggest factor in whether a
   deep-sky observation night is worth driving out for, so an astronomy club's
   footer is exactly where it belongs. New moon = go.

   The arithmetic lives in lib/moon.ts so the observing forecast on the server
   uses the same implementation.
--------------------------------------------------------------------------- */

export function MoonPhase() {
  const [moon, setMoon] = useState<Phase | null>(null);

  // Computed after mount: the date is not the same on both sides of hydration.
  useEffect(() => setMoon(phaseOf(new Date())), []);

  const r = 13;
  const path = moon ? limbPath(moon.p, r) : null;

  return (
    <div className="flex items-center gap-3.5">
      <svg
        viewBox="-16 -16 32 32"
        className="h-8 w-8 shrink-0"
        role="img"
        aria-label={
          moon
            ? `${moon.name}, ${Math.round(moon.illumination * 100)}% illuminated`
            : 'Moon phase'
        }
      >
        <circle r={r} fill="#141c2e" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
        {path && (
          <g transform={path.waning ? 'scale(-1,1)' : undefined}>
            <path d={path.d} fill="#e8eef7" />
          </g>
        )}
      </svg>

      <div className="min-w-0">
        <div className="text-[0.8125rem] leading-tight text-star-dim">
          {moon ? moon.name : '—'}
        </div>
        <div className="label-chart mt-1 truncate">
          {moon
            ? moon.toNew <= 2
              ? 'Dark skies now'
              : `New moon in ${moon.toNew}d`
            : 'Calculating'}
        </div>
      </div>
    </div>
  );
}
