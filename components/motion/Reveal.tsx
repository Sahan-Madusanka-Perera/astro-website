'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   Scroll reveal that cannot strand content.

   framer-motion's `whileInView` was leaving rows at opacity 0 while they sat
   in the middle of the viewport, so half the programme list never appeared.
   This does the same job with three rules that make that impossible:

     1. The markup ships visible. Nothing is hidden until JS has decided to
        hide it, so no-JS, a hydration failure, or a crashed observer all
        render readable content.
     2. Only elements below the fold are ever hidden, in a layout effect
        before paint — what is already on screen is never touched.
     3. A timeout reveals anything the observer somehow misses.

   It also animates by writing styles straight to the node, so a reveal costs
   no React render.
--------------------------------------------------------------------------- */

const useIsomorphic =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** ms */
  delay?: number;
  /** px of travel */
  y?: number;
  as?: 'div' | 'li' | 'section' | 'header' | 'article';
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphic(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Anything already on screen stays as it is — the fold never animates.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return;

    el.style.opacity = '0';
    el.style.transform = `translate3d(0, ${y}px, 0)`;
    el.style.willChange = 'opacity, transform';

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      io.disconnect();
      el.style.transition =
        `opacity 900ms var(--ease-out-expo) ${delay}ms,` +
        `transform 900ms var(--ease-out-expo) ${delay}ms`;
      el.style.opacity = '';
      el.style.transform = '';
      const clean = () => {
        el.style.willChange = '';
        el.style.transition = '';
        el.removeEventListener('transitionend', clean);
      };
      el.addEventListener('transitionend', clean);
    };

    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && show(),
      { threshold: 0.01, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(el);

    // Belt and braces: content is never left invisible.
    const timer = setTimeout(show, 5000);

    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [delay, y]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn(className)}>
      {children}
    </Tag>
  );
}
