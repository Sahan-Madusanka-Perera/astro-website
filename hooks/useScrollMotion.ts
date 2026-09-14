'use client';

import { useEffect, type DependencyList, type RefObject } from 'react';
import { loadMotion, type Motion } from '@/lib/motion/gsap';

/**
 * Runs a GSAP setup scoped to one element, once GSAP has loaded and the
 * fonts have settled (line splits measured against a fallback face land on
 * the wrong lines). Everything created inside is reverted on unmount.
 *
 * Skipped entirely under `prefers-reduced-motion`: every animated element
 * already renders in its final state, so skipping is the reduced path.
 */
export function useScrollMotion<T extends HTMLElement>(
  ref: RefObject<T | null>,
  setup: (motion: Motion, scope: T) => void | (() => void),
  deps: DependencyList = []
) {
  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    let ctx: ReturnType<Motion['gsap']['context']> | undefined;
    let cleanup: void | (() => void);

    Promise.all([loadMotion(), document.fonts?.ready]).then(([motion]) => {
      const scope = ref.current;
      if (cancelled || !scope) return;
      ctx = motion.gsap.context(() => {
        cleanup = setup(motion, scope);
      }, scope);
    });

    return () => {
      cancelled = true;
      if (typeof cleanup === 'function') cleanup();
      ctx?.revert();
    };
    // The setup closes over refs, not render values; callers pass deps
    // explicitly when it should re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
