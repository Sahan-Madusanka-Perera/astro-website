'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowUpRight, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { EVENT_CATEGORIES } from '@/lib/constants';
import type { Event } from '@/types/event';

interface EventCardProps {
  event: Event;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/** A category chip: a dot in the category's own hue, on a faint field of it. */
function CategoryChip({ tint, label }: { tint: string; label: string }) {
  return (
    <span
      className="label-chart inline-flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-md"
      style={{
        color: tint,
        background: `color-mix(in oklab, ${tint} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tint} 30%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: tint, boxShadow: `0 0 8px ${tint}` }}
      />
      {label}
    </span>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-azure-lit" strokeWidth={1.6} />
      <div className="min-w-0">
        <div className="label-chart">{label}</div>
        <div className="mt-1.5 text-[0.9375rem] leading-snug text-starlight" data-numeric>
          {value}
        </div>
      </div>
    </div>
  );
}

export function EventCard({ event }: EventCardProps) {
  const [open, setOpen] = useState(false);
  const category = EVENT_CATEGORIES[event.category] ?? EVENT_CATEGORIES.other;

  // Broken out for the date plate that stands in for a missing photograph.
  const when = new Date(event.date);
  const valid = !Number.isNaN(when.getTime());
  const day = valid ? String(when.getDate()).padStart(2, '0') : '--';
  const month = valid ? when.toLocaleString('en', { month: 'short' }).toUpperCase() : '';
  const year = valid ? when.getFullYear() : '';
  const reduced = useReducedMotion();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      openerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="panel panel-lift group flex h-full w-full flex-col overflow-hidden text-left"
      >
        {event.image_url ? (
          <div className="relative aspect-[16/10] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.image_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-90 transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/25 to-transparent" />
            <div className="absolute left-4 top-4">
              <CategoryChip tint={category.tint} label={category.label} />
            </div>
          </div>
        ) : (
          /* No photograph yet — the date becomes the picture. Keeps every card
             the same shape in the grid instead of leaving a hole under the
             text, and it's the thing people are scanning for anyway. */
          <div className="relative flex aspect-[16/10] flex-col justify-between overflow-hidden border-b border-rule p-5">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-16 aspect-square w-56 rounded-full border border-white/[0.05]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-4 -top-8 aspect-square w-36 rounded-full border border-white/[0.04]"
            />
            <CategoryChip tint={category.tint} label={category.label} />
            <div className="relative">
              <div className="display text-[3.25rem] leading-none tabular-nums" data-numeric>
                {day}
              </div>
              <div className="label-chart mt-2">
                {month} {year}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col p-5 md:p-6">
          <h3 className="text-[1.1875rem] font-medium leading-snug tracking-[-0.012em] text-starlight transition-colors duration-500 group-hover:text-azure-glow">
            {event.title}
          </h3>

          <div className="label-chart mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <time dateTime={event.date}>{formatDate(event.date)}</time>
            <span className="text-star-ghost">/</span>
            <span data-numeric>{event.time}</span>
          </div>

          <p className="mt-4 line-clamp-2 text-[0.9375rem] leading-[1.65] text-star-dim">
            {event.description}
          </p>

          <div className="mt-auto flex items-center gap-2 pt-5 text-[0.8125rem] font-medium text-azure-lit">
            <span className="truncate">{event.location}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-void/85 backdrop-blur-md"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, y: reduced ? 0 : 26, scale: reduced ? 1 : 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduced ? 0 : 18, scale: reduced ? 1 : 0.99 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="fixed inset-x-3 bottom-3 top-3 z-[61] flex flex-col overflow-hidden rounded-lg border border-rule-lit bg-void-1 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] md:inset-x-auto md:inset-y-auto md:left-1/2 md:top-1/2 md:h-auto md:max-h-[88vh] md:w-full md:max-w-3xl md:-translate-x-1/2 md:-translate-y-1/2"
            >
              <button
                ref={closeRef}
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-rule-lit bg-void/70 text-star-dim backdrop-blur-md transition-colors hover:border-azure-lit/50 hover:text-starlight"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex-1 overflow-y-auto overscroll-contain">
                {event.image_url && (
                  <div className="relative aspect-[16/9] max-h-[38vh] w-full shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-void-1 via-void-1/35 to-transparent" />
                  </div>
                )}

                <div className={event.image_url ? '-mt-16 px-6 pb-8 md:px-10' : 'px-6 pb-8 pt-14 md:px-10'}>
                  <CategoryChip tint={category.tint} label={category.label} />
                  <h2
                    id={titleId}
                    className="display mt-4 text-[clamp(1.6rem,4.4vw,2.5rem)]"
                  >
                    {event.title}
                  </h2>

                  <div className="mt-8 grid grid-cols-1 gap-6 border-y border-rule py-6 sm:grid-cols-3">
                    <Fact icon={Calendar} label="Date" value={formatDate(event.date)} />
                    <Fact icon={Clock} label="Time" value={event.time} />
                    <Fact icon={MapPin} label="Location" value={event.location} />
                  </div>

                  <p className="mt-8 max-w-[68ch] whitespace-pre-line text-[1.0625rem] leading-[1.75] text-star-dim">
                    {event.description}
                  </p>

                  {event.registration_link && (
                    <a
                      href={event.registration_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-azure px-7 py-3.5 text-[0.9375rem] font-medium text-white transition-[background-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-azure-lit hover:shadow-[0_10px_40px_-8px_rgba(41,163,221,0.6)]"
                    >
                      Register
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
