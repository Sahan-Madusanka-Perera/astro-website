'use client';

import { useRef, type ReactNode } from 'react';
import { useScrollMotion } from '@/hooks/useScrollMotion';

/* ---------------------------------------------------------------------------
   A heading that sets itself line by line, each line rising out of its own
   mask as the heading comes into view — type arriving the way it is stamped,
   not faded in as a block.

   The same promises as Reveal: the markup ships readable, a heading already
   on screen when motion loads is never touched, and a heading on screen is
   never left hidden. Once the lines have landed the split is undone, so the
   display face's 0.88 line-height never leaves a mask clipping descenders.

   It starts from an IntersectionObserver rather than a ScrollTrigger. The
   events list, the gallery and the magazine all load after this runs and
   push every heading below them down the page; a trigger measured at load
   fires hundreds of pixels early, while an observer watches where the
   heading actually is.
--------------------------------------------------------------------------- */

export function LineReveal({
  as: Tag = 'h2',
  className,
  children,
}: {
  as?: 'h2' | 'h3';
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useScrollMotion(ref, ({ gsap, SplitText }, el) => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.set(split.lines, { yPercent: 115 });

    let started = false;
    let safety: ReturnType<typeof setTimeout> | undefined;

    // Only ever called back asynchronously, after `io` below exists.
    const start = () => {
      if (started) return;
      started = true;
      io.disconnect();
      clearTimeout(safety);
      gsap.to(split.lines, {
        yPercent: 0,
        duration: 1.05,
        ease: 'expo.out',
        stagger: 0.09,
        onComplete: () => split.revert(),
      });
    };

    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && start(), {
      rootMargin: '0px 0px -14% 0px',
    });
    io.observe(el);

    // Belt and braces: if the observer has somehow not fired for a heading
    // that is on screen, show it rather than leave it hidden.
    const check = () => {
      if (started) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) start();
      else safety = setTimeout(check, 1500);
    };
    safety = setTimeout(check, 5000);

    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  });

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
