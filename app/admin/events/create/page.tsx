'use client';

import { useRouter } from 'next/navigation';
import { useEvents } from '@/hooks/useEvents';
import { EventForm } from '@/components/admin/EventForm';

export default function CreateEventPage() {
  const router = useRouter();
  const { createEvent } = useEvents();

  const handleCreate = async (formData: FormData) => {
    await createEvent(formData);
    router.push('/admin/events');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Event</h1>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <EventForm
          onSubmit={handleCreate}
          onCancel={() => router.push('/admin/events')}
        />
      </div>
    </div>
  );
}
