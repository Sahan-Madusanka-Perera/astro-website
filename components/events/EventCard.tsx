'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, ExternalLink, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { EVENT_CATEGORIES } from '@/lib/constants';
import type { Event } from '@/types/event';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const category = EVENT_CATEGORIES[event.category];

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        onClick={() => setIsOpen(true)}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
      >
        {event.image_url && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <span className={`${category.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                {category.label}
              </span>
            </div>
          </div>
        )}

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
          
          <div className="space-y-2 mb-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(event.date)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {event.time}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
          </div>

          <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

          <div className="text-purple-600 font-medium text-sm">
            Click to view details →
          </div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="relative h-full overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="sticky top-4 right-4 ml-auto flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors z-10"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* Event Image */}
                {event.image_url && (
                  <div className="relative h-64 md:h-80 -mt-14">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <span className={`${category.color} text-white px-4 py-2 rounded-full text-sm font-medium inline-block mb-3`}>
                        {category.label}
                      </span>
                      <h2 className="text-3xl md:text-4xl font-bold text-white">
                        {event.title}
                      </h2>
                    </div>
                  </div>
                )}

                {/* Event Details */}
                <div className="p-6 md:p-8">
                  {!event.image_url && (
                    <div className="mb-6">
                      <span className={`${category.color} text-white px-4 py-2 rounded-full text-sm font-medium inline-block mb-3`}>
                        {category.label}
                      </span>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                        {event.title}
                      </h2>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-medium mb-1">Date</div>
                        <div className="text-gray-900 font-medium">{formatDate(event.date)}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-medium mb-1">Time</div>
                        <div className="text-gray-900 font-medium">{event.time}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-medium mb-1">Location</div>
                        <div className="text-gray-900 font-medium">{event.location}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">About This Event</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>
                  </div>

                  {event.registration_link && (
                    <motion.a
                      href={event.registration_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30"
                    >
                      Register Now
                      <ExternalLink className="w-5 h-5" />
                    </motion.a>
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
