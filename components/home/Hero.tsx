'use client';

import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StarField } from '@/components/cosmos/StarField';
import { ISSMarker } from '@/components/cosmos/ISSMarker';
import { Shell } from '@/components/layout/Section';
import { useScrollMotion } from '@/hooks/useScrollMotion';
import { HorizonReadout } from './HorizonReadout';

/* ---------------------------------------------------------------------------
   The first viewport.

   A view from low orbit: Earth's limb as a single hairline arc with its
   atmosphere glowing along it, the club's seal at a size where its own drawing
   reads, and the campus coordinates set on the horizon in mono — the way a
   plate is annotated.

   Two figures share it, both earning their place rather than decorating:

   · The astronaut drifts at the left, graded down into the night — dimmed,
     desaturated and cooled so the light on him matches the light in the field
     behind him. Atmospheric perspective does the work a cutout can't: dimmer
     reads as further away, so he sits in the sky rather than on top of it.
   · The station at the right is the real ISS. Its readout is live and its
     drift follows the station's true longitude, which is what separates an
     instrument from an ornament.

   Everything else is entrance motion only — one settle on load, then stillness.
--------------------------------------------------------------------------- */

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  /* Leaving orbit. Scrolling out of the first viewport lifts the seal and
     wordmark away, the astronaut climbs faster than the page because he is
     nearer, and the horizon rises to meet the next section. Scrubbed to the
     scrollbar: stop scrolling and the scene holds exactly where it is. */
  useScrollMotion(sectionRef, ({ gsap }, section) => {
    const q = gsap.utils.selector(section);
    const vh = () => window.innerHeight;
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      })
      .to(q('[data-hero-content]'), { y: () => -vh() * 0.16, scale: 0.95, opacity: 0, duration: 0.62 }, 0)
      .to(q('[data-hero-readout]'), { y: () => -vh() * 0.1, opacity: 0, duration: 0.45 }, 0)
      // On a phone he starts beside the actions, so he climbs less and stays
      // clear of the text as it fades.
      .to(q('[data-hero-astro]'), { y: () => -vh() * (window.innerWidth < 640 ? 0.12 : 0.34), rotate: 9, duration: 1 }, 0)
      .to(q('[data-hero-horizon]'), { y: () => -vh() * 0.2, duration: 1 }, 0);
  });

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.1, delay, ease: EASE },
  });

  return (
    <section ref={sectionRef} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-void">
      <StarField density={210} constellation meteorRate={6} />

      {/* ── Earth's limb ──────────────────────────────────────────────────
          One hairline arc, an atmosphere gradient along it, and the planet's
          shadowed body below. The whole horizon costs a single element. */}
      <div
        aria-hidden
        data-hero-horizon
        className="pointer-events-none absolute left-1/2 -z-10 -translate-x-1/2"
        style={{
          top: '82svh',
          width: '215vw',
          height: '215vw',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 0%, rgba(41,163,221,0.16) 0%, rgba(0,72,112,0.10) 18%, rgba(4,6,15,0.92) 42%, #04060f 60%)',
          boxShadow:
            '0 -1px 0 0 rgba(111,208,247,0.32), 0 -14px 60px -10px rgba(41,163,221,0.32), 0 -60px 180px -30px rgba(0,128,192,0.22)',
        }}
      />

      <Shell className="relative z-10 flex flex-1 flex-col items-center justify-center pt-[5.5rem] pb-10 text-center md:pt-24 md:pb-14">
        <div data-hero-content className="flex flex-col items-center">
        {/* The seal, large enough that the telescope, the ringed planet and the
            crescent inside it actually read. It is the identity; with the props
            gone it can be the thing you look at. */}
        <motion.div
          {...rise(0.05)}
          className="relative mb-6 h-[min(5.5rem,12svh)] w-[min(5.5rem,12svh)] md:mb-8 md:h-[min(9rem,17svh)] md:w-[min(9rem,17svh)]"
        >
          <Image
            src="/images/astro_logo.png"
            alt=""
            fill
            sizes="(max-width: 768px) 96px, 144px"
            priority
            className="object-contain drop-shadow-[0_0_38px_rgba(41,163,221,0.2)]"
          />
        </motion.div>

        <motion.h1 {...rise(0.14)} className="display display-xl">
          <span className="block text-[min(11.5vw,8.5rem,16svh)]">
            J&apos;PURA
          </span>
          <span className="mt-1 block text-[min(3.55vw,2.4rem,5svh)] font-normal tracking-[0.34em] text-azure-glow md:mt-2.5 md:tracking-[0.42em]">
            ASTRONOMY&nbsp;CLUB
          </span>
        </motion.h1>

        <motion.p
          {...rise(0.24)}
          className="mt-6 max-w-[44ch] text-balance text-[1.0625rem] leading-[1.6] text-star-dim md:mt-7 md:text-[1.1875rem]"
        >
          We keep the telescopes, teach the sky, and drive out past the
          streetlights to find it properly dark.
        </motion.p>

        <motion.div
          {...rise(0.34)}
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
        >
          <Link
            href="#events"
            className="group inline-flex items-center gap-2.5 rounded-full bg-azure px-7 py-3.5 text-[0.9375rem] font-medium text-white transition-[background-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-azure-lit hover:shadow-[0_10px_40px_-8px_rgba(41,163,221,0.65)]"
          >
            What&apos;s on
            <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
          </Link>

          <Link
            href="#about"
            className="inline-flex items-center gap-2.5 rounded-full border border-rule-lit px-7 py-3.5 text-[0.9375rem] font-medium text-star-dim transition-colors duration-500 hover:border-azure-lit/60 hover:text-starlight"
          >
            About the club
          </Link>
        </motion.div>
        </div>
      </Shell>

      {/* ── The astronaut, drifting at the left ───────────────────────────
          Graded into the palette rather than dropped on top of it: the filter
          cools and dims him to the value of a distant, sunlit-from-behind
          figure. Remove the filter and he reads as a sticker again.
          On a phone the middle of the layout is fully occupied and the band
          above the seal is too shallow — tucked there he sat half off-screen
          under the nav. So on a phone he floats low on the right, just above
          Earth's limb and beside the actions, reaching in toward the page. */}
      <div data-hero-astro aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, delay: 0.45, ease: EASE }}
        className="pointer-events-none absolute right-[-0.75rem] top-[calc(82svh-6.5rem)] z-0 h-24 w-24 sm:right-auto sm:left-[-1rem] sm:top-[14svh] sm:h-44 sm:w-44 md:left-[2vw] md:top-[26svh] md:h-64 md:w-64 lg:left-[5vw] lg:h-72 lg:w-72"
      >
        <motion.div
          animate={
            reduced
              ? undefined
              : { y: [0, -18, 0], x: [0, 7, 0], rotate: [-2, 2.5, -2] }
          }
          transition={{
            y: { duration: 14, repeat: Infinity, ease: 'easeInOut' },
            x: { duration: 19, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 23, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="relative h-full w-full"
        >
          <Image
            src="/images/astronaut.webp"
            alt=""
            fill
            sizes="(max-width: 640px) 112px, (max-width: 1024px) 256px, 288px"
            priority
            className="object-contain"
            style={{
              filter:
                'brightness(0.86) saturate(0.72) contrast(1.04) sepia(0.14) hue-rotate(172deg) drop-shadow(0 18px 44px rgba(0,0,0,0.7))',
            }}
          />
        </motion.div>
      </motion.div>
      </div>

      {/* ── The station, where it actually is ─────────────────────────────── */}
      <ISSMarker />

      {/* ── The horizon annotation ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="relative z-10 pb-7 md:pb-8"
      >
        <Shell>
          <div data-hero-readout>
            <HorizonReadout />
          </div>
        </Shell>
      </motion.div>
    </section>
  );
}
