'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { EventForm } from '@/components/admin/EventForm';

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useEvents();

  return (
    <div>
      <Link
        href="/admin/events"
        className="group inline-flex items-center gap-2 text-[0.875rem] text-star-faint transition-colors hover:text-azure-glow"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1" />
        Back to events
      </Link>
      <h1 className="display mt-6 text-[1.875rem]">New event</h1>
      <div className="mt-8 rounded-sm border border-rule bg-void-1 p-6 md:p-8">
        <EventForm
          onSubmit={async (formData) => {
            await createEvent(formData);
            router.push('/admin/events');
          }}
          onCancel={() => router.push('/admin/events')}
        />
      </div>
    </div>
  );
}
