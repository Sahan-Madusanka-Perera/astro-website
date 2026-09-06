'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { sky } from '@/components/cosmos/sky-store';
import { cn } from '@/lib/utils';

/* Only what exists. A nav that links to sections the page doesn't have is
   worse than a short nav. */
const NAV = [
  { name: 'Planets', href: '/#planets', section: 'planets' },
  { name: 'About', href: '/#about', section: 'about' },
  { name: 'Events', href: '/#events', section: 'events' },
  { name: 'Gallery', href: '/#gallery', section: 'gallery' },
  { name: 'Board', href: '/board', section: null },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const seals = useRef(0);
  const sealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Scroll spy — only meaningful on the home page.

     The observer callback only reports sections whose state *changed*, so the
     currently-visible set has to be tracked across callbacks. Reading each
     callback in isolation left the last match latched forever: standing in the
     hero, the nav claimed you were at Events. When the set empties — which is
     exactly the case in the hero — nothing is active. */
  useEffect(() => {
    if (pathname !== '/') { setActive(null); return; }
    const ids = NAV.map((n) => n.section).filter(Boolean) as string[];
    const visible = new Map<string, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
          else visible.delete(e.target.id);
        }
        if (visible.size === 0) {
          setActive(null);
          return;
        }
        let best: string | null = null;
        let bestRatio = -1;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) { bestRatio = ratio; best = id; }
        }
        setActive(best);
      },
      // A band across the middle fifth of the viewport, wide enough that
      // scrolling doesn't skip straight past it between sections.
      { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.2, 0.5, 0.8] }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);

  /* While the sheet is open: lock the scroll, close on Escape, and take the
     page behind it out of the tab order so focus can't wander off-screen. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const main = document.getElementById('main');
    main?.setAttribute('inert', '');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      main?.removeAttribute('inert');
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /* Seven taps on the seal. */
  const tapSeal = useCallback(() => {
    seals.current += 1;
    if (sealTimer.current) clearTimeout(sealTimer.current);
    sealTimer.current = setTimeout(() => { seals.current = 0; }, 2200);
    if (seals.current >= 7) {
      seals.current = 0;
      sky.bumpSeal();
      toast('Seal of the club, 2017', {
        description:
          'Drawn by Isuru Graphics. Telescope, ringed planet, crescent moon — and four stars for the four founding batches.',
      });
    }
  }, []);

  return (
    <>
      {/* First stop for a keyboard or screen reader — the sky is decorative and
          there is a lot of it before the content starts. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-azure focus:px-5 focus:py-2.5 focus:text-[0.875rem] focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <motion.nav
        initial={{ y: reduced ? 0 : -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-700',
          scrolled || open
            ? 'border-b border-rule bg-void/72 backdrop-blur-xl backdrop-saturate-150'
            : 'border-b border-transparent bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center justify-between gap-6 px-6 md:h-[4.5rem] md:px-10">
          {/* Seal + wordmark */}
          <Link
            href="/"
            onClick={tapSeal}
            className="group -m-2 flex shrink-0 items-center gap-3 rounded-sm p-2"
          >
            <span className="relative block h-9 w-9 shrink-0 md:h-10 md:w-10">
              <Image
                src="/images/astro_logo.png"
                alt="J'pura Astronomy Club"
                fill
                sizes="40px"
                priority
                className="object-contain transition-[filter,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[8deg] group-hover:drop-shadow-[0_0_18px_rgba(41,163,221,0.6)]"
              />
            </span>
            <span className="hidden text-[0.9375rem] font-medium tracking-[-0.01em] text-starlight sm:block">
              J&apos;pura Astronomy
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const isActive = item.section && active === item.section;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-[0.875rem] transition-colors duration-400',
                    isActive
                      ? 'text-starlight'
                      : 'text-star-faint hover:text-starlight'
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      transition={{ duration: 0.5, ease: EASE }}
                      className="absolute inset-0 -z-10 rounded-full bg-white/[0.055] ring-1 ring-inset ring-white/[0.07]"
                    />
                  )}
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://forms.gle/Hc83F5GZbEVF6ShU6"
              target="_blank"
              rel="noopener noreferrer"
              className="group hidden items-center gap-1.5 rounded-full border border-rule-lit px-4 py-2 text-[0.875rem] text-star-dim transition-colors duration-400 hover:border-azure-lit/55 hover:text-starlight lg:inline-flex"
            >
              Merch
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>

            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-starlight transition-colors hover:bg-white/[0.06] lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile sheet — full height, room to breathe, staggered in. */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed inset-0 z-40 bg-void/96 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex h-full flex-col justify-between px-6 pt-24 pb-10">
              <nav className="flex flex-col">
                {NAV.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.06 + i * 0.055, ease: EASE }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block border-b border-rule py-5"
                    >
                      <span className="display text-[2rem] leading-none">
                        {item.name}
                      </span>
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.06 + NAV.length * 0.055, ease: EASE }}
                >
                  <a
                    href="https://forms.gle/Hc83F5GZbEVF6ShU6"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex items-baseline justify-between border-b border-rule py-5"
                  >
                    <span className="display text-[2rem] leading-none text-azure-glow">
                      Merch
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-star-faint" />
                  </a>
                </motion.div>
              </nav>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.42 }}
                className="label-chart leading-relaxed"
              >
                6.8524° N / 79.9040° E
                <span className="mt-1.5 block">
                  University of Sri Jayewardenepura
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
