'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEvents } from '@/hooks/useEvents';
import { EventForm } from '@/components/admin/EventForm';
import { formatDate } from '@/lib/utils';
import { EVENT_CATEGORIES } from '@/lib/constants';

export default function AdminEventsPage() {
  const { events, isLoading, createEvent, deleteEvent } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete “${title}”? This removes it from the public site immediately and cannot be undone.`)) return;
    try {
      setDeleting(id);
      await deleteEvent(id);
      toast.success('Event deleted');
    } catch {
      toast.error('Could not delete the event. Try again.');
    } finally {
      setDeleting(null);
    }
  };

  if (showForm) {
    return (
      <div>
        <button
          onClick={() => setShowForm(false)}
          className="group inline-flex items-center gap-2 text-[0.875rem] text-star-faint transition-colors hover:text-azure-glow"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1" />
          Back to events
        </button>
        <h1 className="display mt-6 text-[1.875rem]">New event</h1>
        <div className="mt-8 rounded-sm border border-rule bg-void-1 p-6 md:p-8">
          <EventForm
            onSubmit={async (formData) => {
              await createEvent(formData);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="display text-[1.875rem]">Events</h1>
          <p className="mt-2.5 text-[0.9375rem] text-star-faint">
            {isLoading
              ? 'Loading…'
              : `${events.length} ${events.length === 1 ? 'event' : 'events'} on the public site.`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-azure px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit"
        >
          <Plus className="h-4 w-4" />
          New event
        </button>
      </header>

      {isLoading ? (
        <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 rounded-sm border border-rule bg-white/[0.025]" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="mt-9 flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-20 text-center">
          <Calendar className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
          <p className="mt-5 text-[1.0625rem] text-starlight">No events yet</p>
          <p className="note mt-3 max-w-[46ch]">
            The public events section stays empty until you add the first one.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-azure px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit"
          >
            <Plus className="h-4 w-4" />
            Add an event
          </button>
        </div>
      ) : (
        <ul className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const cat = EVENT_CATEGORIES[event.category] ?? EVENT_CATEGORIES.other;
            const isDeleting = deleting === event.id;
            return (
              <li
                key={event.id}
                className="flex flex-col overflow-hidden rounded-sm border border-rule bg-void-1 transition-opacity"
                style={{ opacity: isDeleting ? 0.5 : 1 }}
              >
                {event.image_url && (
                  <div className="relative aspect-[16/9] shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={event.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="label-chart inline-flex items-center gap-2"
                      style={{ color: cat.tint }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: cat.tint }}
                        aria-hidden
                      />
                      {cat.label}
                    </span>
                    {event.is_featured && (
                      <span className="label-chart shrink-0 text-sodium">Featured</span>
                    )}
                  </div>

                  <h2 className="mt-3 text-[1.0625rem] font-medium leading-snug text-starlight">
                    {event.title}
                  </h2>

                  <dl className="label-chart mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                      <time dateTime={event.date}>{formatDate(event.date)}</time>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                      <span data-numeric>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </dl>

                  <div className="mt-auto flex gap-2 pt-5">
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-rule-lit px-4 py-2.5 text-[0.875rem] text-star-dim transition-colors duration-300 hover:border-azure-lit/55 hover:text-starlight"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.7} />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id, event.title)}
                      disabled={isDeleting}
                      aria-label={`Delete ${event.title}`}
                      className="grid h-auto w-11 place-items-center rounded-sm border border-rule-lit text-star-faint transition-colors duration-300 hover:border-destructive/55 hover:text-destructive disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
