'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Section, Shell, SectionHead } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { Rocket } from './Rocket';
import { SITE } from '@/lib/site-location';

/* ---------------------------------------------------------------------------
   The wider sky, on a day's delay.

   Two feeds the club doesn't have to maintain: NASA's picture of the day, and
   what is going up next. The club's own photographs lead the page; this is the
   rest of the sky, and it keeps the site fresh on the weeks nothing is on.

   Both degrade to nothing: a section that can't fill itself is not shown.
--------------------------------------------------------------------------- */

type Apod = {
  title: string;
  date: string;
  explanation: string;
  copyright: string | null;
  mediaType: string;
  image: string | null;
  link: string;
  usingDemoKey: boolean;
};

type Launch = {
  id: string;
  vehicle: string;
  mission: string | null;
  net: string;
  status: string | null;
  provider: string | null;
  location: string | null;
};

function ApodFrame({ src, alt }: { src: string; alt: string }) {
  const [ratio, setRatio] = useState<number | null>(null);
  return (
    <span
      className="relative block w-full overflow-hidden bg-white/[0.035]"
      style={{ aspectRatio: ratio ?? 3 / 2 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={(e) => {
          const el = e.currentTarget;
          if (el.naturalWidth && el.naturalHeight) {
            setRatio(el.naturalWidth / el.naturalHeight);
          }
        }}
        className="absolute inset-0 h-full w-full object-cover opacity-[0.94] transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] group-hover:opacity-100"
      />
    </span>
  );
}

function useFeed<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [url]);
  return { data, failed };
}

/** Countdown in the club's timezone, plus a human gap. */
function untilLabel(net: string) {
  const ms = +new Date(net) - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms < 0) return 'In progress';
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `T−${Math.max(1, Math.round(ms / 60_000))}m`;
  if (h < 48) return `T−${h}h`;
  return `T−${Math.round(h / 24)}d`;
}

export function FromOrbitSection() {
  const { data: apod, failed: apodFailed } = useFeed<Apod>('/api/apod');
  const { data: launchData, failed: launchFailed } =
    useFeed<{ launches: Launch[] }>('/api/launches');

  const launches = launchData?.launches ?? [];

  // Nothing to show and nothing coming — don't render an empty screen.
  if (apodFailed && launchFailed) return null;

  return (
    <Section id="from-orbit" className="bg-void pb-28 md:pb-40">
      <Shell>
        <SectionHead
          title={<>Elsewhere<br />in the sky.</>}
          lede="What NASA is looking at today, and what goes up next. Two feeds the club doesn't have to keep — they refresh themselves."
        />

        <div className="mt-16 grid grid-cols-1 gap-x-10 gap-y-14 md:mt-20 lg:grid-cols-12">
          {/* ── Picture of the day ──────────────────────────────────────── */}
          <div className="lg:col-span-7">
            {apodFailed ? null : !apod ? (
              <div className="animate-pulse">
                <div className="aspect-[3/2] w-full rounded-sm bg-white/[0.035]" />
                <div className="mt-5 h-4 w-2/3 rounded-full bg-white/[0.06]" />
                <div className="mt-3 h-2.5 w-full rounded-full bg-white/[0.035]" />
              </div>
            ) : (
              <Reveal>
                <figure>
                  <a
                    href={apod.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-sm ring-1 ring-white/[0.07] transition-[box-shadow,ring-color] duration-700 hover:ring-azure-lit/45"
                  >
                    {apod.image ? (
                      /* APOD frames vary wildly in shape; reserve 3:2 and let
                         the real ratio take over once it decodes, the same way
                         the gallery does. */
                      <ApodFrame src={apod.image} alt={apod.title} />
                    ) : (
                      <div className="grid aspect-[3/2] place-items-center bg-white/[0.035]">
                        <span className="label-chart">Today&apos;s entry is a video</span>
                      </div>
                    )}
                  </a>

                  <figcaption className="mt-5 border-t border-rule pt-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                      <h3 className="text-[1.1875rem] font-medium leading-snug text-starlight">
                        {apod.title}
                      </h3>
                      <p className="label-chart shrink-0">
                        NASA APOD
                        <span className="mx-2 text-star-ghost">/</span>
                        <time dateTime={apod.date}>
                          {new Date(apod.date + 'T00:00:00Z').toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            timeZone: 'UTC',
                          })}
                        </time>
                      </p>
                    </div>
                    <p className="mt-4 line-clamp-4 max-w-[68ch] leading-[1.7] text-star-dim">
                      {apod.explanation}
                    </p>
                    {apod.copyright && (
                      <p className="note mt-3">Image: {apod.copyright}</p>
                    )}
                  </figcaption>
                </figure>
              </Reveal>
            )}
          </div>

          {/* ── Next up ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 lg:col-start-9">
            {launchFailed ? null : (
              <>
                <div className="flex items-center gap-2.5 border-t border-rule pt-4">
                  <Rocket className="-ml-1.5 text-sodium" />
                  <h3 className="text-[0.9375rem] font-medium text-starlight">
                    Going up next
                  </h3>
                </div>

                {!launchData ? (
                  <ul className="mt-2 animate-pulse">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="border-b border-rule py-4">
                        <div className="h-3 w-24 rounded-full bg-white/[0.05]" />
                        <div className="mt-3 h-4 w-40 rounded-full bg-white/[0.035]" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="mt-2">
                    {launches.map((l, i) => {
                      const t = untilLabel(l.net);
                      return (
                        <Reveal
                          as="li"
                          key={l.id}
                          delay={i * 60}
                          className="border-b border-rule py-4"
                        >
                          <div className="flex items-baseline justify-between gap-4">
                            <p className="label-chart">{l.provider ?? '—'}</p>
                            {t && (
                              <p
                                className="label-chart shrink-0"
                                style={{ color: i === 0 ? 'var(--color-sodium)' : undefined }}
                                data-numeric
                              >
                                {t}
                              </p>
                            )}
                          </div>
                          <p className="mt-2 text-[0.9375rem] leading-snug text-starlight">
                            {l.mission ?? l.vehicle}
                          </p>
                          <p className="note mt-1.5">
                            {l.vehicle}
                            {l.location ? ` · ${l.location}` : ''}
                          </p>
                          <p className="note mt-1.5">
                            {new Date(l.net).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: SITE.timeZone,
                            })}{' '}
                            local
                          </p>
                        </Reveal>
                      );
                    })}
                  </ul>
                )}

                <a
                  href="https://nextspaceflight.com/launches/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-5 inline-flex items-center gap-1.5 text-[0.875rem] text-star-faint transition-colors hover:text-azure-glow"
                >
                  Full schedule
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </Shell>
    </Section>
  );
}
