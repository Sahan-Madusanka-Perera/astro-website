'use client';

import { useEffect, useRef, useState } from 'react';

/* ---------------------------------------------------------------------------
   A rocket, drawn rather than rendered.

   It climbs once when the launch list scrolls into view, and again on hover —
   an entrance, not an idle loop, so it stays inside the site's "one signature
   moment, quiet elsewhere" rule. The exhaust is a masked gradient that fades
   with the climb, so nothing lingers on screen after the ascent lands.

   Same stroke weight and grid as every other icon on the site.
--------------------------------------------------------------------------- */

export function Rocket({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setFlying(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The class toggles off after the animation so hover can replay it.
  useEffect(() => {
    if (!flying) return;
    const t = setTimeout(() => setFlying(false), 1500);
    return () => clearTimeout(t);
  }, [flying]);

  return (
    <span
      ref={ref}
      onMouseEnter={() => setFlying(true)}
      className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center ${className}`}
    >
      {/* exhaust — a tapering hairline that only exists during the climb */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 w-px -translate-x-1/2 origin-bottom"
        style={{
          height: '1.5rem',
          background:
            'linear-gradient(to top, transparent, var(--color-sodium), transparent)',
          opacity: flying ? 1 : 0,
          transform: flying
            ? 'translateX(-50%) scaleY(1)'
            : 'translateX(-50%) scaleY(0)',
          transition: flying
            ? 'opacity .25s ease, transform .5s cubic-bezier(0.16,1,0.3,1)'
            : 'opacity .6s ease .4s, transform .6s ease .4s',
        }}
      />

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative h-[1.15rem] w-[1.15rem]"
        style={{
          transform: flying ? 'translateY(-0.55rem)' : 'translateY(0)',
          transition: flying
            ? 'transform .85s cubic-bezier(0.16,1,0.3,1)'
            : 'transform .9s cubic-bezier(0.33,1,0.68,1)',
        }}
        aria-hidden
      >
        {/* body */}
        <path d="M12 2.5c2.6 2.2 4 5.4 4 8.8v4.2l-1.9 2.2h-4.2L8 15.5v-4.2c0-3.4 1.4-6.6 4-8.8Z" />
        {/* window */}
        <circle cx="12" cy="10" r="1.6" />
        {/* fins */}
        <path d="M8 12.6 5.2 15.2v3.1l2.8-1.6" />
        <path d="M16 12.6l2.8 2.6v3.1L16 16.7" />
        {/* flame */}
        <path d="M10.6 19.9c.5 1 .9 1.7 1.4 2.4.5-.7.9-1.4 1.4-2.4" />
      </svg>
    </span>
  );
}
