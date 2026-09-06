'use client';

import { useState } from 'react';
import { Aperture, AlertCircle } from 'lucide-react';
import { useGallery } from '@/hooks/useGallery';
import { Reveal } from '@/components/motion/Reveal';
import { Lightbox } from './Lightbox';
import { GalleryFrame } from './GalleryFrame';

/* ---------------------------------------------------------------------------
   The gallery.

   Masonry rather than a grid of identical squares: astrophotography is mostly
   not square, and cropping a wide-field Milky Way into a tile throws away the
   picture. Columns keep every frame at its own aspect ratio.
--------------------------------------------------------------------------- */

/* Deterministic placeholder heights so the skeleton has the shape of a real
   masonry column instead of a stack of equal blocks. */
const SKELETON_H = [260, 190, 320, 230, 300, 210, 275, 195];

export function GalleryGrid() {
  const { images, isLoading, error, refetch } = useGallery();
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (error) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-sm border border-destructive/30 bg-destructive/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" strokeWidth={1.6} />
          <div>
            <p className="text-[0.9375rem] text-starlight">
              The gallery didn&apos;t load.
            </p>
            <p className="note mt-2">
              Connection to the club&apos;s image store failed.
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="shrink-0 rounded-full border border-rule-lit px-5 py-2.5 text-[0.875rem] text-star-dim transition-colors hover:border-azure-lit/55 hover:text-starlight"
        >
          Try again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4" aria-hidden>
        {SKELETON_H.map((h, i) => (
          <div
            key={i}
            className="mb-4 break-inside-avoid overflow-hidden rounded-sm bg-white/[0.035]"
            style={{ height: h }}
          >
            <div className="h-full w-full animate-[shimmer_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
          </div>
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-24 text-center">
        <Aperture className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
        <p className="mt-5 text-[1.0625rem] text-star-dim">
          No frames in the gallery yet.
        </p>
        <p className="note mt-3 max-w-[48ch]">
          Members&apos; astrophotography and observation-night photographs land
          here once the club uploads them.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
        {images.map((image, i) => (
          <Reveal
            key={image.id}
            delay={Math.min(i, 8) * 45}
            y={16}
            className="mb-4 block break-inside-avoid"
          >
          <button
            type="button"
            onClick={() => setOpenAt(i)}
            aria-label={`Open ${image.title}`}
            className="group relative block w-full overflow-hidden rounded-sm text-left ring-1 ring-white/[0.07] transition-[box-shadow,ring-color] duration-700 hover:ring-azure-lit/45"
          >
            <GalleryFrame
              src={image.image_url}
              alt={image.title}
              className="opacity-[0.92] transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-hover:opacity-100"
            />

            {/* The caption sits in the frame's own shadow, not on a black wash
                that hides the picture you came to look at. */}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-void via-void/70 to-transparent p-4 pt-10 opacity-0 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100">
              <span className="block text-[0.9375rem] font-medium leading-snug text-starlight">
                {image.title}
              </span>
              {image.description && (
                <span className="label-chart mt-1.5 line-clamp-1 block">
                  {image.description}
                </span>
              )}
            </span>
          </button>
          </Reveal>
        ))}
      </div>

      {openAt !== null && (
        <Lightbox
          images={images}
          initialIndex={openAt}
          onClose={() => setOpenAt(null)}
        />
      )}
    </>
  );
}
