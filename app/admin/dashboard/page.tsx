'use client';

import Link from 'next/link';
import { Calendar, Images, Star, Sunrise, ArrowUpRight, AlertCircle } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useGallery } from '@/hooks/useGallery';
import { formatDate } from '@/lib/utils';
import { EVENT_CATEGORIES } from '@/lib/constants';

/* Operate mode: the numbers are here to be read at a glance, not admired.
   One rule-separated row of counts, then the two things an editor actually
   opens this page to check. */

export default function DashboardPage() {
  const { events, isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useEvents();
  const { images, isLoading: galleryLoading, error: galleryError, refetch: refetchGallery } = useGallery();
  const loading = eventsLoading || galleryLoading;
  const failed = eventsError || galleryError;

  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const stats = [
    { name: 'Events', value: events.length, icon: Calendar, href: '/admin/events' },
    { name: 'Upcoming', value: upcoming.length, icon: Sunrise, href: '/admin/events' },
    { name: 'Featured', value: events.filter((e) => e.is_featured).length, icon: Star, href: '/admin/events' },
    { name: 'Images', value: images.length, icon: Images, href: '/admin/gallery' },
  ];

  return (
    <div>
      <header>
        <h1 className="display text-[1.875rem]">Overview</h1>
        <p className="mt-2.5 text-[0.9375rem] text-star-faint">
          Everything the public site is currently showing.
        </p>
      </header>

      {/* A failed fetch must never read as "you have zero events" — an editor
          seeing 0 would think the site had lost their work. */}
      {failed && !loading && (
        <div className="mt-8 flex flex-col items-start gap-4 rounded-sm border border-destructive/30 bg-destructive/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" strokeWidth={1.6} />
            <div>
              <p className="text-[0.9375rem] text-starlight">
                Couldn&apos;t reach the club&apos;s database.
              </p>
              <p className="note mt-2">
                The counts below are not your real figures.
              </p>
            </div>
          </div>
          <button
            onClick={() => { refetchEvents(); refetchGallery(); }}
            className="shrink-0 rounded-full border border-rule-lit px-5 py-2.5 text-[0.875rem] text-star-dim transition-colors hover:border-azure-lit/55 hover:text-starlight"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Counts ──────────────────────────────────────────────────────── */}
      <dl className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-rule bg-rule lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.name}
            href={s.href}
            className="group flex flex-col justify-between gap-6 bg-void-1 p-5 transition-colors duration-300 hover:bg-void-2"
          >
            <div className="flex items-center justify-between">
              <dt className="label-chart">{s.name}</dt>
              <s.icon className="h-4 w-4 text-star-ghost transition-colors duration-300 group-hover:text-azure-lit" strokeWidth={1.7} />
            </div>
            <dd
              className="display text-[2.25rem] leading-none tabular-nums text-starlight"
              data-numeric
            >
              {loading || failed ? <span className="text-star-ghost">—</span> : s.value}
            </dd>
          </Link>
        ))}
      </dl>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Next up ───────────────────────────────────────────────────── */}
        <section className="rounded-sm border border-rule bg-void-1">
          <header className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
            <h2 className="text-[0.9375rem] font-medium text-starlight">Next up</h2>
            <Link
              href="/admin/events"
              className="label-chart inline-flex items-center gap-1.5 transition-colors hover:text-azure-glow"
            >
              All events
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </header>

          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded-sm bg-white/[0.035]" />
              ))}
            </div>
          ) : eventsError ? (
            <p className="px-5 py-10 text-center text-[0.9375rem] text-star-faint">
              Couldn&apos;t load events.
            </p>
          ) : upcoming.length === 0 ? (
            <p className="px-5 py-10 text-center text-[0.9375rem] text-star-faint">
              Nothing scheduled ahead of today.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-rule)]">
              {upcoming.slice(0, 5).map((e) => {
                const cat = EVENT_CATEGORIES[e.category] ?? EVENT_CATEGORIES.other;
                return (
                  <li key={e.id}>
                    <Link
                      href={`/admin/events/${e.id}/edit`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-300 hover:bg-white/[0.03]"
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: cat.tint, boxShadow: `0 0 8px ${cat.tint}` }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem] text-starlight">
                          {e.title}
                        </span>
                        <span className="label-chart mt-1 block">
                          <time dateTime={e.date}>{formatDate(e.date)}</time>
                        </span>
                      </span>
                      {e.is_featured && <span className="label-chart shrink-0 text-sodium">Featured</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Latest uploads ────────────────────────────────────────────── */}
        <section className="rounded-sm border border-rule bg-void-1">
          <header className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4">
            <h2 className="text-[0.9375rem] font-medium text-starlight">Latest uploads</h2>
            <Link
              href="/admin/gallery"
              className="label-chart inline-flex items-center gap-1.5 transition-colors hover:text-azure-glow"
            >
              Gallery
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </header>

          {loading ? (
            <div className="grid grid-cols-3 gap-2 p-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-square rounded-sm bg-white/[0.035]" />
              ))}
            </div>
          ) : galleryError ? (
            <p className="px-5 py-10 text-center text-[0.9375rem] text-star-faint">
              Couldn&apos;t load the gallery.
            </p>
          ) : images.length === 0 ? (
            <p className="px-5 py-10 text-center text-[0.9375rem] text-star-faint">
              No images uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 p-5">
              {images.slice(0, 6).map((image) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-sm ring-1 ring-white/[0.07]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.image_url}
                    alt={image.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
