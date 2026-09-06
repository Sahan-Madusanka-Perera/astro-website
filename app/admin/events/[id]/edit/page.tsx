'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { EventForm } from '@/components/admin/EventForm';
import type { Event } from '@/types/event';

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { events, isLoading, updateEvent } = useEvents();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const found = events.find((e) => e.id === id);
    if (found) setEvent(found);
  }, [events, id]);

  const back = (
    <Link
      href="/admin/events"
      className="group inline-flex items-center gap-2 text-[0.875rem] text-star-faint transition-colors hover:text-azure-glow"
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1" />
      Back to events
    </Link>
  );

  if (isLoading || (!event && events.length === 0)) {
    return (
      <div>
        {back}
        <div className="mt-16 flex flex-col items-center gap-4">
          <Loader2 className="h-5 w-5 animate-spin text-azure-lit" />
          <p className="label-chart">Loading the event</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        {back}
        <div className="mt-12 flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-20 text-center">
          <AlertCircle className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
          <p className="mt-5 text-[1.0625rem] text-starlight">That event no longer exists</p>
          <p className="note mt-3">It may have been deleted from another session.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {back}
      <h1 className="display mt-6 text-[1.875rem]">Edit event</h1>
      <p className="mt-2.5 text-[0.9375rem] text-star-faint">{event.title}</p>
      <div className="mt-8 rounded-sm border border-rule bg-void-1 p-6 md:p-8">
        <EventForm
          event={event}
          onSubmit={async (formData) => {
            await updateEvent(id, formData);
            router.push('/admin/events');
          }}
          onCancel={() => router.push('/admin/events')}
        />
      </div>
    </div>
  );
}
