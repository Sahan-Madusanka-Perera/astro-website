'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryImage } from '@/types/gallery';

interface LightboxProps {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [dir, setDir] = useState(0);
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      setDir(delta);
      setIndex((i) => (i + delta + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [go, onClose]);

  /* Warm the neighbours so arrowing through doesn't flash. */
  useEffect(() => {
    for (const d of [1, -1]) {
      const n = images[(index + d + images.length) % images.length];
      if (n) {
        const img = new Image();
        img.src = n.image_url;
      }
    }
  }, [index, images]);

  const current = images[index];
  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${current.title} — image ${index + 1} of ${images.length}`}
      className="fixed inset-0 z-[70] flex flex-col bg-void/97 backdrop-blur-xl"
      onClick={onClose}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 56) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* ── Chrome ─────────────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center justify-between px-5 py-4 md:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="label-chart" data-numeric>
          {String(index + 1).padStart(2, '0')}
          <span className="mx-1.5 text-star-ghost">/</span>
          {String(images.length).padStart(2, '0')}
        </p>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close gallery"
          className="grid h-11 w-11 place-items-center rounded-full border border-rule-lit text-star-dim transition-colors hover:border-azure-lit/55 hover:text-starlight"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Frame ──────────────────────────────────────────────────────── */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-20">
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Previous image"
              className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full border border-rule-lit bg-void/60 text-star-dim backdrop-blur-md transition-colors hover:border-azure-lit/55 hover:text-starlight md:left-5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Next image"
              className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full border border-rule-lit bg-void/60 text-star-dim backdrop-blur-md transition-colors hover:border-azure-lit/55 hover:text-starlight md:right-5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <AnimatePresence mode="wait" custom={dir}>
          <motion.img
            key={current.id}
            custom={dir}
            initial={{ opacity: 0, x: reduced ? 0 : dir * 36, scale: reduced ? 1 : 0.99 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: reduced ? 0 : dir * -36, scale: reduced ? 1 : 0.99 }}
            transition={{ duration: 0.45, ease: EASE }}
            src={current.image_url}
            alt={current.title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-sm object-contain shadow-[0_30px_120px_-20px_rgba(0,0,0,0.9)]"
          />
        </AnimatePresence>
      </div>

      {/* ── Plate caption ──────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-5 pb-7 pt-5 md:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto max-w-3xl border-t border-rule pt-4 text-center">
          <h2 className="text-[1.0625rem] font-medium text-starlight">
            {current.title}
          </h2>
          {current.description && (
            <p className="mx-auto mt-2 max-w-[62ch] text-[0.875rem] leading-relaxed text-star-faint">
              {current.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
