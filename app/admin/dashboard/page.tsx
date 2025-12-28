'use client';

import { useEvents } from '@/hooks/useEvents';
import { useGallery } from '@/hooks/useGallery';
import { Calendar, Image, TrendingUp, Users } from 'lucide-react';

export default function DashboardPage() {
  const { events, isLoading: eventsLoading } = useEvents();
  const { images, isLoading: galleryLoading } = useGallery();

  const stats = [
    {
      name: 'Total Events',
      value: events.length,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      name: 'Gallery Images',
      value: images.length,
      icon: Image,
      color: 'bg-purple-500',
    },
    {
      name: 'Featured Events',
      value: events.filter((e) => e.is_featured).length,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      name: 'Upcoming Events',
      value: events.filter((e) => new Date(e.date) > new Date()).length,
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  if (eventsLoading || galleryLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to USJ Astronomy Club Admin Panel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Events
          </h2>
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">{event.date}</p>
                </div>
                {event.is_featured && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    Featured
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Uploads
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {images.slice(0, 6).map((image) => (
              <div key={image.id} className="relative aspect-square">
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
