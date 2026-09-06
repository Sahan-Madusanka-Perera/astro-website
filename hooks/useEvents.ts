'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { Event } from '@/types/event';

/* ---------------------------------------------------------------------------
   Events, fetched once per page rather than once per component.

   The home page now reads this hook twice — the events section and the hero's
   horizon readout, which shows the next observation night — and the admin
   dashboard reads it alongside the gallery. A plain useState/useEffect hook
   fires a request for each caller and lets them drift out of sync. This backs
   every caller onto one module-level store: the first mount fetches, the rest
   subscribe, and a mutation anywhere updates everyone.
--------------------------------------------------------------------------- */

type State = {
  events: Event[];
  isLoading: boolean;
  error: string | null;
};

let state: State = { events: [], isLoading: true, error: null };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;
let started = false;

const SERVER_STATE: State = { events: [], isLoading: true, error: null };

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // The first subscriber kicks off the one request everybody shares.
  if (!started) {
    started = true;
    void load();
  }
  return () => {
    listeners.delete(listener);
  };
}

function load(): Promise<void> {
  if (inflight) return inflight;
  set({ isLoading: true });
  inflight = (async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = (await response.json()) as Event[];
      set({ events: data, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
      inflight = null;
    }
  })();
  return inflight;
}

export function useEvents() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE
  );

  const refetch = useCallback(() => load(), []);

  const createEvent = useCallback(async (formData: FormData) => {
    const response = await fetch('/api/events', { method: 'POST', body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create event');
    }
    const newEvent = (await response.json()) as Event;
    set({ events: [newEvent, ...state.events] });
    return newEvent;
  }, []);

  const updateEvent = useCallback(async (id: string, formData: FormData) => {
    const response = await fetch(`/api/events/${id}`, { method: 'PUT', body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update event');
    }
    const updated = (await response.json()) as Event;
    set({ events: state.events.map((e) => (e.id === id ? updated : e)) });
    return updated;
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete event');
    }
    set({ events: state.events.filter((e) => e.id !== id) });
  }, []);

  return {
    events: snapshot.events,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
