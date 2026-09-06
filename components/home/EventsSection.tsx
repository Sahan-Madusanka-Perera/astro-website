'use client';

import { useMemo } from 'react';
import { AlertCircle, Telescope } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from '@/components/events/EventCard';
import { EventCalendar } from '@/components/events/EventCalendar';
import { EventSkeleton } from '@/components/events/EventSkeleton';
import { Section, Shell, SectionHead } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { TonightPanel } from '@/components/sky/TonightPanel';

/* ---------------------------------------------------------------------------
   Events, as one section rather than two.

   The page used to run a "Featured Events" block and an "Event Calendar" block
   back to back under two near-identical headings. Same data, same cards, twice
   the scroll. Here the featured events lead, and the month scale sits under
   them as the way into everything else — one heading, one fetch.
--------------------------------------------------------------------------- */

export function EventsSection() {
  const { events, isLoading, error, refetch } = useEvents();

  const featured = useMemo(() => {
    const now = Date.now();
    const upcoming = events
      .filter((e) => e.is_featured)
      .sort((a, b) => {
        // Upcoming first, nearest first; past events fall to the back.
        const da = +new Date(a.date);
        const db = +new Date(b.date);
        const fa = da >= now ? 0 : 1;
        const fb = db >= now ? 0 : 1;
        return fa - fb || (fa === 0 ? da - db : db - da);
      });
    return upcoming.slice(0, 3);
  }, [events]);

  return (
    <Section id="events" className="bg-void py-28 md:py-40">
      <Shell>
        <SectionHead
          title={<>What&apos;s on.</>}
          lede="Observation nights, workshops and trips. Registration links are on each event — most fill up, so early is better."
        />

        {/* ── Tonight ──────────────────────────────────────────────────────
            Before the list of dates, the one reading that decides whether
            tonight is worth it. Same question as the events below, answered
            for the next few hours instead of the next few weeks. */}
        <div className="mt-16 md:mt-20">
          <h3 className="display text-[clamp(1.5rem,3.4vw,2.25rem)]">
            Tonight over Nugegoda
          </h3>
          <div className="mt-8">
            <TonightPanel />
          </div>
        </div>

        {/* ── Featured ─────────────────────────────────────────────────── */}
        <div className="mt-20 md:mt-28">
          {error ? (
            <div className="flex flex-col items-start gap-4 rounded-sm border border-destructive/30 bg-destructive/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" strokeWidth={1.6} />
                <div>
                  <p className="text-[0.9375rem] text-starlight">
                    The events list didn&apos;t load.
                  </p>
                  <p className="note mt-2">
                    Connection to the club&apos;s server failed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className="shrink-0 rounded-full border border-rule-lit px-5 py-2.5 text-[0.875rem] text-star-dim transition-colors hover:border-azure-lit/55 hover:text-starlight"
              >
                Try again
              </button>
            </div>
          ) : isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <EventSkeleton key={i} />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-20 text-center">
              <Telescope className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
              <p className="mt-5 text-[1.0625rem] text-star-dim">
                No events pinned right now.
              </p>
              <p className="note mt-3 max-w-[46ch]">
                The calendar below has everything the club has run and scheduled.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((event, i) => (
                <Reveal key={event.id} delay={i * 70} className="h-full">
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        {/* ── The calendar, subordinate to the section above it ─────────── */}
        <div id="all-events" className="mt-24 scroll-mt-28 md:mt-32">
          <div className="mb-10 flex items-baseline justify-between gap-6">
            <h3 className="display text-[clamp(1.5rem,3.4vw,2.25rem)]">
              Browse by month
            </h3>
          </div>
          <EventCalendar events={events} isLoading={isLoading} />
        </div>
      </Shell>
    </Section>
  );
}
