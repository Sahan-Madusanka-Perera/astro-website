'use client';

import { useEffect, useState } from 'react';
import { limbPath } from '@/lib/moon';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   Tonight over Nugegoda.

   The one panel on this site that answers the question a member actually has
   before an observation night: is it worth going out? Three readings and a
   verdict —

     · when astronomical twilight ends, i.e. when it is properly dark rather
       than merely after sunset;
     · cloud cover across that window, plotted hour by hour;
     · the moon, which decides what is worth pointing at once you are there.

   Drawn as an instrument, not a weather widget: hairline rules, mono readings,
   a bar plot with no chrome. Data from /api/sky (open-meteo + sunrise-sunset,
   both free and keyless).
--------------------------------------------------------------------------- */

type Sky = {
  site: { label: string; lat: number; lon: number; timeZone: string };
  darkStart: string;
  darkEnd: string;
  cloud: {
    mean: number | null;
    samples: Array<{ t: string; cloud: number }>;
    best: { t: string; cloud: number } | null;
  };
  moon: { illumination: number; name: string; toNew: number; p: number };
  verdict: string;
  moonNote: string | null;
};

function useSky() {
  const [sky, setSky] = useState<Sky | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/sky')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && setSky(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  return { sky, failed };
}

/** Times are formatted in the club's own timezone, not the visitor's. */
function atSite(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  });
}

function Reading({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-t border-rule pt-5', className)}>
      <p className="label-chart">{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function TonightPanel() {
  const { sky, failed } = useSky();

  // The panel is supplementary — if the forecast is down it says nothing at all
  // rather than occupying a screen with an apology.
  if (failed) return null;

  if (!sky) {
    return (
      <div className="grid animate-pulse grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-t border-rule pt-5">
            <div className="h-2 w-20 rounded-full bg-white/[0.06]" />
            <div className="mt-4 h-5 w-32 rounded-full bg-white/[0.04]" />
          </div>
        ))}
      </div>
    );
  }

  const tz = sky.site.timeZone;
  const mean = sky.cloud.mean;
  const moonPath = limbPath(sky.moon.p, 8);

  // Cloud is the variable that decides the night, so it drives the accent.
  const tone =
    mean === null ? 'muted' : mean < 25 ? 'good' : mean < 55 ? 'fair' : 'poor';
  const toneColor = {
    good: 'var(--color-azure-glow)',
    fair: 'var(--color-azure-lit)',
    poor: 'var(--color-star-faint)',
    muted: 'var(--color-star-ghost)',
  }[tone];

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-3">
        <Reading label="Properly dark">
          <p className="font-mono text-[1.0625rem] tracking-[0.02em] text-starlight">
            {atSite(sky.darkStart, tz)}
            <span className="mx-2 text-star-ghost">→</span>
            {atSite(sky.darkEnd, tz)}
          </p>
          <p className="note mt-2">
            Astronomical twilight, {sky.site.label}
          </p>
        </Reading>

        <Reading label="Cloud tonight">
          <div className="flex items-baseline gap-3">
            <p
              className="font-mono text-[1.0625rem] tracking-[0.02em]"
              style={{ color: toneColor }}
            >
              {mean === null ? '—' : `${mean}%`}
            </p>
            {/* hour-by-hour across the dark window, no chrome */}
            <div className="flex h-6 items-end gap-[3px]" aria-hidden>
              {sky.cloud.samples.map((s) => (
                <span
                  key={s.t}
                  title={`${atSite(s.t, tz)} — ${s.cloud}% cloud`}
                  className="w-[3px] rounded-full"
                  style={{
                    height: `${Math.max(8, s.cloud)}%`,
                    background:
                      s.cloud < 30
                        ? 'var(--color-azure-glow)'
                        : s.cloud < 60
                          ? 'var(--color-azure-lit)'
                          : 'var(--color-star-ghost)',
                  }}
                />
              ))}
            </div>
          </div>
          <p className="note mt-2">
            {sky.cloud.best
              ? `Clearest around ${atSite(sky.cloud.best.t, tz)}, ${sky.cloud.best.cloud}%`
              : 'Hourly forecast unavailable'}
          </p>
        </Reading>

        <Reading label="Moon">
          <div className="flex items-center gap-3">
            <svg viewBox="-10 -10 20 20" className="h-5 w-5 shrink-0" aria-hidden>
              <circle r="8" fill="#0d1526" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
              <g transform={moonPath.waning ? 'scale(-1,1)' : undefined}>
                <path d={moonPath.d} fill="#e4ecf6" />
              </g>
            </svg>
            <p className="font-mono text-[1.0625rem] tracking-[0.02em] text-starlight">
              {Math.round(sky.moon.illumination * 100)}%
            </p>
          </div>
          <p className="note mt-2">
            {sky.moon.name}
            {sky.moon.toNew > 2 ? `, new in ${sky.moon.toNew}d` : ', dark skies'}
          </p>
        </Reading>
      </div>

      {/* the verdict, in the club's own terms */}
      <p className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-rule pt-5 text-[1.0625rem] text-star-dim">
        <span
          className="inline-block h-1.5 w-1.5 translate-y-[-0.15em] rounded-full"
          style={{ background: toneColor, boxShadow: `0 0 8px ${toneColor}` }}
          aria-hidden
        />
        <span className="text-starlight">{sky.verdict}</span>
        {sky.moonNote && <span className="text-star-faint">{sky.moonNote}</span>}
      </p>
    </div>
  );
}
