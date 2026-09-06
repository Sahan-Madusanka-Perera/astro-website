'use client';

import { useState } from 'react';
import { Plus, Trash2, Images, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGallery } from '@/hooks/useGallery';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function AdminGalleryPage() {
  const { images, isLoading, uploadImage, deleteImage } = useGallery();
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete “${title}”? This removes it from the public gallery immediately and cannot be undone.`)) return;
    try {
      setDeleting(id);
      await deleteImage(id);
      toast.success('Image deleted');
    } catch {
      toast.error('Could not delete the image. Try again.');
    } finally {
      setDeleting(null);
    }
  };

  if (showUpload) {
    return (
      <div>
        <button
          onClick={() => setShowUpload(false)}
          className="group inline-flex items-center gap-2 text-[0.875rem] text-star-faint transition-colors hover:text-azure-glow"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1" />
          Back to gallery
        </button>
        <h1 className="display mt-6 text-[1.875rem]">Upload image</h1>
        <div className="mt-8 max-w-2xl rounded-sm border border-rule bg-void-1 p-6 md:p-8">
          <ImageUpload
            onSubmit={async (formData) => {
              await uploadImage(formData);
              setShowUpload(false);
            }}
            onCancel={() => setShowUpload(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="display text-[1.875rem]">Gallery</h1>
          <p className="mt-2.5 text-[0.9375rem] text-star-faint">
            {isLoading
              ? 'Loading…'
              : `${images.length} ${images.length === 1 ? 'image' : 'images'} on the public site.`}
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-azure px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit"
        >
          <Plus className="h-4 w-4" />
          Upload image
        </button>
      </header>

      {isLoading ? (
        <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="aspect-square rounded-sm border border-rule bg-white/[0.025]" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="mt-9 flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-20 text-center">
          <Images className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
          <p className="mt-5 text-[1.0625rem] text-starlight">No images yet</p>
          <p className="note mt-3 max-w-[46ch]">
            The public gallery stays empty until you upload the first one.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-azure px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit"
          >
            <Plus className="h-4 w-4" />
            Upload an image
          </button>
        </div>
      ) : (
        <ul className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => {
            const isDeleting = deleting === image.id;
            return (
              <li
                key={image.id}
                className="group relative overflow-hidden rounded-sm border border-rule bg-void-1"
                style={{ opacity: isDeleting ? 0.5 : 1 }}
              >
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.image_url}
                    alt={image.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => handleDelete(image.id, image.title)}
                    disabled={isDeleting}
                    aria-label={`Delete ${image.title}`}
                    className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-sm border border-rule-lit bg-void/75 text-star-faint opacity-0 backdrop-blur-md transition-[opacity,color,border-color] duration-300 hover:border-destructive/60 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                    )}
                  </button>
                </div>
                <div className="border-t border-rule px-3 py-2.5">
                  <p className="truncate text-[0.8125rem] text-starlight">{image.title}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
