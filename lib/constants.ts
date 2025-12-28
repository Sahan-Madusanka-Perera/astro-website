export const SITE_CONFIG = {
  name: 'University of Sri Jayewardenepura Astronomy Club',
  shortName: 'USJ Astronomy Club',
  description: 'Exploring the cosmos together - Events, Observations, and Workshops',
  url: 'https://astronomy-club.usjp.ac.lk',
} as const;

export const EVENT_CATEGORIES = {
  observation: { label: 'Star Observation', color: 'bg-blue-500' },
  workshop: { label: 'Workshop', color: 'bg-purple-500' },
  seminar: { label: 'Seminar', color: 'bg-green-500' },
  trip: { label: 'Field Trip', color: 'bg-orange-500' },
  other: { label: 'Other', color: 'bg-gray-500' },
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_GALLERY: '/admin/gallery',
} as const;
