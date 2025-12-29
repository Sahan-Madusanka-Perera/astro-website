'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from './EventCard';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function EventCalendar() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const { events, isLoading } = useEvents();

  // Filter events for selected month
  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
  });

  const handlePrevYear = () => setSelectedYear(selectedYear - 1);
  const handleNextYear = () => setSelectedYear(selectedYear + 1);

  return (
    <section id="all-events" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Event Calendar
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse events by month and plan your cosmic adventures
          </p>
        </motion.div>

        {/* Year Selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={handlePrevYear}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous year"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <span className="text-2xl font-bold text-gray-900 min-w-[100px] text-center">
            {selectedYear}
          </span>
          <button
            onClick={handleNextYear}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next year"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
          {MONTHS.map((month, index) => {
            const isSelected = selectedMonth === index;
            const monthEvents = events.filter((event) => {
              const eventDate = new Date(event.date);
              return eventDate.getMonth() === index && eventDate.getFullYear() === selectedYear;
            });
            const hasEvents = monthEvents.length > 0;

            return (
              <motion.button
                key={month}
                onClick={() => setSelectedMonth(index)}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative p-6 rounded-2xl font-semibold text-lg transition-all duration-300
                  ${isSelected 
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-xl shadow-purple-500/30' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-100 hover:border-purple-200'
                  }
                `}
              >
                {month}
                {hasEvents && (
                  <span className={`
                    absolute top-2 right-2 flex h-3 w-3 rounded-full
                    ${isSelected ? 'bg-white' : 'bg-purple-500'}
                  `}>
                    <span className={`
                      animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                      ${isSelected ? 'bg-white' : 'bg-purple-400'}
                    `} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Selected Month Events */}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedMonth}-${selectedYear}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {MONTHS[selectedMonth]} {selectedYear}
                </h3>
                <p className="text-gray-600">
                  {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} scheduled
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
                </div>
              ) : filteredEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200"
                >
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No events scheduled for this month</p>
                  <p className="text-gray-400 text-sm mt-2">Check back later for updates</p>
                </motion.div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <EventCard event={event} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
