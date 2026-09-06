'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { GalleryImage } from '@/types/gallery';

/* One shared fetch per page, for the same reason as useEvents: several
   components read the gallery on one screen and they must not each fire a
   request or drift apart after an upload. */

type State = {
  images: GalleryImage[];
  isLoading: boolean;
  error: string | null;
};

let state: State = { images: [], isLoading: true, error: null };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;
let started = false;

const SERVER_STATE: State = { images: [], isLoading: true, error: null };

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
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
      const response = await fetch('/api/gallery');
      if (!response.ok) throw new Error('Failed to fetch gallery images');
      const data = (await response.json()) as GalleryImage[];
      set({ images: data, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
      inflight = null;
    }
  })();
  return inflight;
}

export function useGallery() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE
  );

  const refetch = useCallback(() => load(), []);

  const uploadImage = useCallback(async (formData: FormData) => {
    const response = await fetch('/api/gallery', { method: 'POST', body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to upload image');
    }
    const newImage = (await response.json()) as GalleryImage;
    set({ images: [newImage, ...state.images] });
    return newImage;
  }, []);

  const deleteImage = useCallback(async (id: string) => {
    const response = await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to delete image');
    }
    set({ images: state.images.filter((i) => i.id !== id) });
  }, []);

  return {
    images: snapshot.images,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    refetch,
    uploadImage,
    deleteImage,
  };
}
