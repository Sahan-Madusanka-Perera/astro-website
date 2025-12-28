'use client';

import { useState } from 'react';
import { useGallery } from '@/hooks/useGallery';
import { Lightbox } from './Lightbox';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';

export function GalleryGrid() {
  const { images, isLoading } = useGallery();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-20">
        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No images in gallery yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg"
            onClick={() => setSelectedImageIndex(index)}
          >
            <img
              src={image.image_url}
              alt={image.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
              <div className="text-center">
                <h3 className="text-white font-semibold text-lg mb-1">
                  {image.title}
                </h3>
                {image.description && (
                  <p className="text-white/80 text-sm line-clamp-2">
                    {image.description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedImageIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </>
  );
}
