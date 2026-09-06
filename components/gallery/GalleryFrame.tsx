'use client';

import { useState } from 'react';

/* ---------------------------------------------------------------------------
   A masonry cell that holds its place.

   The gallery API returns no image dimensions, so an <img> with height:auto
   measures zero until it decodes — which collapsed every masonry column to a
   hairline and then reflowed the whole grid once the pictures arrived. This
   reserves a 4:3 box, then adopts the frame's real aspect ratio the moment it
   is known, so the column is never empty and never jumps twice.
--------------------------------------------------------------------------- */

export function GalleryFrame({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [ratio, setRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  return (
    <span
      className="relative block w-full overflow-hidden bg-white/[0.035]"
      style={{ aspectRatio: ratio ?? 4 / 3 }}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            const el = e.currentTarget;
            if (el.naturalWidth && el.naturalHeight) {
              setRatio(el.naturalWidth / el.naturalHeight);
            }
          }}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover ${className}`}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center">
          <span className="label-chart">Image unavailable</span>
        </span>
      )}
    </span>
  );
}
