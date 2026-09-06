'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/* ---------------------------------------------------------------------------
   The station, where it actually is.

   The club already had a satellite render floating in the hero as decoration.
   Wired to api.wheretheiss.at it stops being decoration: the readout beside it
   is the real position of ISS (NORAD 25544), and the figure drifts horizontally
   with the station's true longitude, so it tracks east the way the station
   does. Roughly nine minutes of orbit per pixel of drift.

   Renders nothing at all until a position arrives, and disappears again if the
   feed dies — a marker with no data behind it would be a lie.
--------------------------------------------------------------------------- */

type Position = {
  lat: number;
  lon: number;
  altitude: number;
  velocity: number;
  visibility: string;
};

const POLL_MS = 8000;

function fmtLat(v: number) {
  return `${Math.abs(v).toFixed(1)}° ${v >= 0 ? 'N' : 'S'}`;
}
function fmtLon(v: number) {
  return `${Math.abs(v).toFixed(1)}° ${v >= 0 ? 'E' : 'W'}`;
}

export function ISSMarker() {
  const [pos, setPos] = useState<Position | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const r = await fetch('/api/iss');
        if (r.ok && alive.current) setPos(await r.json());
      } catch {
        /* keep the last known position rather than blanking the marker */
      }
      if (alive.current) timer = setTimeout(tick, POLL_MS);
    };

    // Don't poll a tab nobody is looking at.
    const onVis = () => {
      if (!document.hidden && alive.current) {
        clearTimeout(timer);
        tick();
      }
    };

    tick();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive.current = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  if (!pos) return null;

  /* Longitude drives a small horizontal offset — a real eastward drift rather
     than an animation loop, bounded so the marker stays inside its corner. */
  const drift = ((pos.lon + 180) / 360) * 40 - 20; // −20…+20 px
  const sunlit = pos.visibility === 'daylight';

  return (
    <div
      className="pointer-events-none absolute right-[4vw] bottom-[15svh] z-10 hidden items-end gap-3 md:flex lg:right-[7vw]"
      style={{
        transform: `translateX(${drift}px)`,
        transition: 'transform 3s cubic-bezier(0.33, 1, 0.68, 1)',
      }}
    >
      <div className="relative h-14 w-14 shrink-0 lg:h-[4.25rem] lg:w-[4.25rem]">
        <Image
          src="/images/iss.webp"
          alt=""
          fill
          sizes="68px"
          className="object-contain"
          style={{
            // graded into the night so it belongs to the same lit world
            filter: sunlit
              ? 'saturate(0.75) brightness(0.92) drop-shadow(0 0 14px rgba(111,208,247,0.35))'
              : 'saturate(0.45) brightness(0.6) drop-shadow(0 0 10px rgba(41,163,221,0.25))',
            transition: 'filter 1.2s ease',
          }}
        />
      </div>

      <div className="mb-1 border-l border-rule pl-3">
        <p className="label-chart flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: sunlit ? 'var(--color-sodium)' : 'var(--color-azure-lit)',
              boxShadow: `0 0 7px ${sunlit ? 'var(--color-sodium)' : 'var(--color-azure-lit)'}`,
            }}
            aria-hidden
          />
          ISS
        </p>
        <p className="mt-1.5 font-mono text-[0.8125rem] leading-relaxed tracking-[0.04em] text-star-dim">
          {fmtLat(pos.lat)} <span className="text-star-ghost">/</span> {fmtLon(pos.lon)}
        </p>
        <p className="label-chart mt-1">
          {Math.round(pos.altitude)} km · {sunlit ? 'Sunlit' : 'In eclipse'}
        </p>
      </div>
    </div>
  );
}
