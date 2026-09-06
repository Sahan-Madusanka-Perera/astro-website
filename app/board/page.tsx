'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { StarField } from '@/components/cosmos/StarField';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shell, SectionHead } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   The board archive.

   Add a year by dropping the two photographs into /public/images/boards/ and
   adding an entry here. Only add a year once both files exist — the page shows
   what it has rather than rendering a broken plate. (2023/24 was listed here
   with image paths that were never added, so it rendered two broken frames.)
--------------------------------------------------------------------------- */

const BOARD_YEARS = [
  {
    year: '2025/26',
    topBoard: '/images/top_board.jpg',
    executiveBoard: '/images/board.jpg',
    note: 'The current board. Elected at the annual general meeting and running the club through to the next.',
  },
  {
    year: '2024/25',
    topBoard: '/images/boards/2024_top_board.jpg',
    executiveBoard: '/images/boards/2024_board.jpg',
    note: 'The board that took the club through its busiest observation season to date.',
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function Plate({
  src,
  alt,
  year,
  caption,
  title,
  priority = false,
}: {
  src: string;
  alt: string;
  year: string;
  caption: string;
  title: string;
  priority?: boolean;
}) {
  return (
    <figure className="group relative">
      <div className="relative overflow-hidden rounded-sm border border-rule bg-void-1">
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={900}
          priority={priority}
          className="h-auto w-full object-cover"
        />
        {/* the plate's own edge light */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]"
        />
        <span className="label-chart absolute right-4 top-4 rounded-full border border-white/15 bg-void/60 px-3 py-1.5 text-azure-haze backdrop-blur-md">
          {year}
        </span>
      </div>

      <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-rule pt-4">
        <span className="text-[0.9375rem] font-medium text-starlight">{title}</span>
        <span className="label-chart">{caption}</span>
      </figcaption>
    </figure>
  );
}

export default function BoardPage() {
  const [selected, setSelected] = useState(BOARD_YEARS[0]);
  const reduced = useReducedMotion();

  return (
    <>
      <Navbar />
      <main id="main" className="relative isolate min-h-screen overflow-hidden bg-void">
        <StarField density={110} meteorRate={3} />

        <Shell className="relative z-10 pt-28 pb-24 md:pt-36 md:pb-32">
          <SectionHead
            title={<>The people<br />who run it.</>}
            lede="Every year the club elects a top board and an executive board. This is the archive — who was steering, and when."
            aside={
              <p className="label-chart">
                {BOARD_YEARS.length} {BOARD_YEARS.length === 1 ? 'year' : 'years'} on record
              </p>
            }
          />

          {/* ── The spine: pick a year ──────────────────────────────────── */}
          <div
            role="tablist"
            aria-label="Board year"
            className="mt-14 flex flex-wrap gap-2 border-t border-rule pt-6 md:mt-20"
          >
            {BOARD_YEARS.map((b) => {
              const on = b.year === selected.year;
              return (
                <button
                  key={b.year}
                  role="tab"
                  id={`board-tab-${b.year.replace('/', '-')}`}
                  aria-selected={on}
                  aria-controls="board-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setSelected(b)}
                  className={cn(
                    'rounded-full border px-5 py-2.5 text-[0.9375rem] transition-[color,border-color,background-color] duration-500',
                    on
                      ? 'border-azure-lit/60 bg-azure/16 text-starlight'
                      : 'border-rule text-star-faint hover:border-rule-lit hover:text-star-dim'
                  )}
                  data-numeric
                >
                  {b.year}
                </button>
              );
            })}
          </div>

          {/* ── The plates ──────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.year}
              id="board-panel"
              role="tabpanel"
              aria-labelledby={`board-tab-${selected.year.replace('/', '-')}`}
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -12 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="mt-12 md:mt-16"
            >
              <p className="max-w-[58ch] text-[1.0625rem] leading-[1.7] text-star-dim">
                {selected.note}
              </p>

              <div className="mt-12 space-y-16 md:mt-16 md:space-y-20">
                <Reveal>
                  <Plate
                    src={selected.topBoard}
                    alt={`Top board, ${selected.year}`}
                    year={selected.year}
                    title="Top Board"
                    caption="President, secretary and treasurer"
                    priority
                  />
                </Reveal>

                <Reveal>
                  <Plate
                    src={selected.executiveBoard}
                    alt={`Executive board, ${selected.year}`}
                    year={selected.year}
                    title="Executive Board"
                    caption="Directors and managers of all six planets"
                  />
                </Reveal>
              </div>
            </motion.div>
          </AnimatePresence>
        </Shell>
      </main>
      <Footer />
    </>
  );
}
