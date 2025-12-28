'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEvents } from '@/hooks/useEvents';
import { EventForm } from '@/components/admin/EventForm';
import type { Event } from '@/types/event';

export default function EditEventPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const router = useRouter();
  const { events, updateEvent } = useEvents();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const foundEvent = events.find((e) => e.id === id);
    if (foundEvent) {
      setEvent(foundEvent);
    }
  }, [events, id]);

  const handleUpdate = async (formData: FormData) => {
    await updateEvent(id, formData);
    router.push('/admin/events');
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Event</h1>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <EventForm
          event={event}
          onSubmit={handleUpdate}
          onCancel={() => router.push('/admin/events')}
        />
      </div>
    </div>
  );
}
