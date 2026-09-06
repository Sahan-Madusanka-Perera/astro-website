export const SITE_CONFIG = {
  name: 'University of Sri Jayewardenepura Astronomy Club',
  shortName: 'USJ Astronomy Club',
  description: 'Exploring the cosmos together - Events, Observations, and Workshops',
  url: 'https://astronomy-club.usjp.ac.lk',
} as const;

/**
 * Category colours are drawn from the night palette, not from a stock hue
 * wheel: four cool steps plus the one sodium warm, so a page full of events
 * still reads as a single sky. `tint` is the hue itself; use it for the dot
 * and for the low-alpha field behind a chip.
 */
export const EVENT_CATEGORIES = {
  observation: { label: 'Observation', tint: '#29a3dd' },
  workshop: { label: 'Workshop', tint: '#6fd0f7' },
  seminar: { label: 'Seminar', tint: '#8f9ee8' },
  trip: { label: 'Field trip', tint: '#f0b429' },
  other: { label: 'Other', tint: '#8fa0ba' },
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_GALLERY: '/admin/gallery',
} as const;
