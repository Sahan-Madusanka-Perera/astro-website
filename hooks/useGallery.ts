'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GalleryImage } from '@/types/gallery';

export function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/gallery');
      if (!response.ok) throw new Error('Failed to fetch gallery images');
      const data = await response.json();
      setImages(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const uploadImage = async (formData: FormData) => {
    const response = await fetch('/api/gallery', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }

    const newImage = await response.json();
    setImages((prev) => [newImage, ...prev]);
    return newImage;
  };

  const deleteImage = async (id: string) => {
    const response = await fetch(`/api/gallery?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete image');
    }

    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  return {
    images,
    isLoading,
    error,
    refetch: fetchImages,
    uploadImage,
    deleteImage,
  };
}
