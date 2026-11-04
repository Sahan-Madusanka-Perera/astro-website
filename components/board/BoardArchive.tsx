'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Reveal } from '@/components/motion/Reveal';
import { Avatar } from '@/components/people/Avatar';
import { shortPlanetName } from '@/lib/club/shared';
import type { ClubBoard, ClubMember, ClubPlanet } from '@/types/club';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   The board archive: one tab per year, that year's photographs, and who ran
   each planet. Everything here is edited in Admin → Boards.
--------------------------------------------------------------------------- */

const EASE = [0.16, 1, 0.3, 1] as const;

function Plate({ src, alt, year, caption, title, priority = false }: {
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
        <Image src={src} alt={alt} width={1600} height={900} priority={priority} className="h-auto w-full object-cover" />
        {/* the plate's own edge light */}
        <div aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />
        <span className="label-chart absolute right-4 top-4 rounded-full border border-white/15 bg-void/60 px-3 py-1.5 text-azure-haze backdrop-blur-md">
          {year}
        </span>
      </div>
      {(title || caption) && (
        <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-rule pt-4">
          <span className="text-[0.9375rem] font-medium text-starlight">{title}</span>
          <span className="label-chart">{caption}</span>
        </figcaption>
      )}
    </figure>
  );
}

function Person({ m, role }: { m: ClubMember; role: string }) {
  return (
    <li className="flex items-center gap-3.5">
      <Avatar src={m.image_url || undefined} name={m.name} sizes="48px" className="h-12 w-12 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate text-[0.9375rem] text-starlight">{m.name}</span>
        <span className="label-chart mt-1 block">{role}</span>
      </span>
    </li>
  );
}

export function BoardArchive({ boards, planets, members }: { boards: ClubBoard[]; planets: ClubPlanet[]; members: ClubMember[] }) {
  const initial = boards.find((b) => b.is_current) ?? boards[0];
  const [selectedId, setSelectedId] = useState(initial?.id);
  const selected = boards.find((b) => b.id === selectedId) ?? initial;
  const reduced = useReducedMotion();

  if (!selected) {
    return <p className="mt-16 text-[1.0625rem] text-star-dim">The board for this year will be published soon.</p>;
  }

  const teams = planets
    .map((p) => {
      const people = members.filter((m) => m.board_id === selected.id && m.planet_id === p.id);
      return { planet: p, directors: people.filter((m) => m.role === 'director'), managers: people.filter((m) => m.role === 'manager') };
    })
    .filter((t) => t.directors.length + t.managers.length > 0);

  return (
    <>
      {/* ── The spine: pick a year ──────────────────────────────────── */}
      <div role="tablist" aria-label="Board year" className="mt-14 flex flex-wrap gap-2 border-t border-rule pt-6 md:mt-20">
        {boards.map((b) => {
          const on = b.id === selected.id;
          return (
            <button
              key={b.id}
              role="tab"
              id={`board-tab-${b.id}`}
              aria-selected={on}
              aria-controls="board-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setSelectedId(b.id)}
              className={cn(
                'rounded-full border px-5 py-2.5 text-[0.9375rem] transition-[color,border-color,background-color] duration-500',
                on ? 'border-azure-lit/60 bg-azure/16 text-starlight' : 'border-rule text-star-faint hover:border-rule-lit hover:text-star-dim'
              )}
              data-numeric
            >
              {b.year}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          id="board-panel"
          role="tabpanel"
          aria-labelledby={`board-tab-${selected.id}`}
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -12 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="mt-12 md:mt-16"
        >
          {selected.note && <p className="max-w-[58ch] text-[1.0625rem] leading-[1.7] text-star-dim">{selected.note}</p>}

          {selected.images.length > 0 && (
            <div className="mt-12 space-y-16 md:mt-16 md:space-y-20">
              {selected.images.map((img, i) => (
                <Reveal key={img.id}>
                  <Plate
                    src={img.url}
                    alt={`${img.title || 'Board'}, ${selected.year}`}
                    year={selected.year}
                    title={img.title}
                    caption={img.caption}
                    priority={i === 0}
                  />
                </Reveal>
              ))}
            </div>
          )}

          {teams.length > 0 && (
            <section className="mt-20 md:mt-28">
              <div className="rule-h" />
              <h2 className="display mt-8 text-[clamp(1.6rem,3.6vw,2.25rem)]">The planets, {selected.year}</h2>
              <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
                {teams.map(({ planet, directors, managers }) => (
                  <Reveal as="li" key={planet.id} className="panel p-6">
                    <Link href={`/planets/${planet.slug}`} className="group flex items-center gap-3.5">
                      <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                        {planet.icon_url && <Image src={planet.icon_url} alt="" fill sizes="40px" className="object-cover" />}
                      </span>
                      <span className="text-[1.0625rem] font-medium text-starlight transition-colors group-hover:text-azure-glow">
                        {shortPlanetName(planet.name)}
                      </span>
                    </Link>
                    <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {directors.map((m) => (
                        <Person key={m.id} m={m} role="Director" />
                      ))}
                      {managers.map((m) => (
                        <Person key={m.id} m={m} role="Manager" />
                      ))}
                    </ul>
                  </Reveal>
                ))}
              </ul>
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
