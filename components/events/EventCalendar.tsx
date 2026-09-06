'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Telescope } from 'lucide-react';
import { EventCard } from './EventCard';
import { EventSkeleton } from './EventSkeleton';
import type { Event } from '@/types/event';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   The month browser.

   A twelve-cell scrubber rather than a page of month buttons: each cell is a
   tick on a year, and the ones holding events carry a mark. It reads as an
   instrument scale, and it fits on a phone without scrolling.
--------------------------------------------------------------------------- */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function EventCalendar({
  events,
  isLoading,
}: {
  events: Event[];
  isLoading: boolean;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const reduced = useReducedMotion();

  /* One pass over the events gives both the per-month counts and the
     selected month's list. */
  const { counts, selected } = useMemo(() => {
    const counts = new Array(12).fill(0) as number[];
    const selected: Event[] = [];
    for (const e of events) {
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime()) || d.getFullYear() !== year) continue;
      counts[d.getMonth()] += 1;
      if (d.getMonth() === month) selected.push(e);
    }
    selected.sort((a, b) => +new Date(a.date) - +new Date(b.date));
    return { counts, selected };
  }, [events, month, year]);

  const total = counts.reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* ── Year + scale ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            aria-label={`Go to ${year - 1}`}
            className="grid h-10 w-10 place-items-center rounded-full text-star-faint transition-colors hover:bg-white/[0.06] hover:text-starlight"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span
            className="display min-w-[5rem] text-center text-[1.75rem] tabular-nums"
            data-numeric
          >
            {year}
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            aria-label={`Go to ${year + 1}`}
            className="grid h-10 w-10 place-items-center rounded-full text-star-faint transition-colors hover:bg-white/[0.06] hover:text-starlight"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <p className="label-chart">
          {total} {total === 1 ? 'event' : 'events'} logged in {year}
        </p>
      </div>

      {/* ── The twelve ───────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Select a month"
        className="mt-5 grid grid-cols-6 gap-1.5 sm:gap-2 md:grid-cols-12"
      >
        {MONTHS.map((m, i) => {
          const isSel = i === month;
          const has = counts[i] > 0;
          const isNow = i === now.getMonth() && year === now.getFullYear();
          return (
            <button
              key={m}
              role="tab"
              aria-selected={isSel}
              onClick={() => setMonth(i)}
              title={`${MONTHS_FULL[i]} ${year} — ${counts[i]} ${counts[i] === 1 ? 'event' : 'events'}`}
              className={cn(
                'group relative flex flex-col items-center gap-2 rounded-sm px-1 py-3 transition-colors duration-400',
                isSel
                  ? 'bg-azure/16 text-starlight'
                  : 'text-star-faint hover:bg-white/[0.045] hover:text-star-dim'
              )}
            >
              {/* tick */}
              <span
                aria-hidden
                className={cn(
                  'block w-px transition-[height,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  isSel
                    ? 'h-5 w-0.5 bg-azure-glow'
                    : has
                      ? 'h-4 w-0.5 bg-azure-lit group-hover:bg-azure-glow'
                      : 'h-1.5 bg-star-ghost/45'
                )}
              />
              <span className="label-chart text-[0.625rem] text-current">{m}</span>

              {/* today's month, marked in sodium — the one warm on the page */}
              {isNow && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-px mx-auto h-px w-5 bg-sodium"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── The month ────────────────────────────────────────────────── */}
      <div className="mt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${month}-${year}`}
            initial={{ opacity: 0, y: reduced ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -10 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-rule pb-4">
              <h3 className="display text-[1.5rem] md:text-[1.75rem]">
                {MONTHS_FULL[month]}{' '}
                <span className="text-star-ghost" data-numeric>{year}</span>
              </h3>
              <span className="label-chart shrink-0">
                {selected.length} {selected.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => <EventSkeleton key={i} />)}
              </div>
            ) : selected.length === 0 ? (
              <div className="flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-20 text-center">
                <Telescope className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
                <p className="mt-5 text-[1.0625rem] text-star-dim">
                  Nothing scheduled in {MONTHS_FULL[month]}.
                </p>
                <p className="note mt-3 max-w-[46ch]">
                  {total > 0
                    ? 'Try another month on the scale above.'
                    : 'The club posts observation nights about a fortnight ahead.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {selected.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: reduced ? 0 : 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
