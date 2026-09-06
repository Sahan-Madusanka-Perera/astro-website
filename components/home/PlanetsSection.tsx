'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PLANETS } from '@/lib/planets-data';
import { StarField } from '@/components/cosmos/StarField';
import { Section, Shell, SectionHead } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';

/* ---------------------------------------------------------------------------
   The club's six divisions.

   Drawn as an ecliptic rather than a card grid: one hairline runs the width of
   the section and every planet sits on it, the way bodies sit on the plane of
   the solar system. Hovering drops a tick from the line to the label, which is
   how a chart points at a thing.
--------------------------------------------------------------------------- */

export function PlanetsSection() {
  return (
    <Section id="planets" className="bg-void pt-28 pb-24 md:pt-40 md:pb-32">
      <StarField density={110} meteorRate={0} className="fade-edge-y opacity-70" />

      <Shell className="relative z-10">
        <SectionHead
          title={<>Six planets,<br />one orbit.</>}
          lede="The club runs as six divisions. Each keeps its own people, its own remit, and its own corner of what we do — and they all turn around the same thing."
          aside={
            <p className="label-chart">
              {PLANETS.length} divisions / est. 2017
            </p>
          }
        />

        {/* ── The ecliptic ─────────────────────────────────────────────── */}
        <div className="relative mt-20 md:mt-28">
          <div
            aria-hidden
            className="absolute inset-x-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-transparent via-azure-lit/25 to-transparent lg:block lg:top-[4.5rem]"
          />

          <ul className="relative grid grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-6 lg:gap-x-5">
            {PLANETS.map((planet, i) => {
              const short = planet.name.replace('Planet of ', '');
              return (
                <Reveal as="li" key={planet.id} delay={i * 65}>
                  <Link
                    href={`/planets/${planet.slug}`}
                    className="group flex flex-col items-center text-center"
                  >
                    {/* the body */}
                    <span className="relative block aspect-square w-full max-w-[7.5rem] lg:max-w-[9rem]">
                      <span
                        aria-hidden
                        className="absolute inset-[-18%] rounded-full opacity-0 blur-2xl transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
                        style={{
                          background:
                            'radial-gradient(circle, rgba(41,163,221,0.55), transparent 68%)',
                        }}
                      />
                      {/* Still. Six bodies turning forever is ambient noise,
                          not motion with something to say — the star field is
                          the one thing on this page that moves by itself. */}
                      <span className="relative block h-full w-full overflow-hidden rounded-full ring-1 ring-white/[0.09] transition-[transform,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07] group-hover:shadow-[0_0_50px_-12px_rgba(41,163,221,0.75)]">
                        <Image
                          src={planet.icon}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 120px, (max-width: 1024px) 140px, 144px"
                          className="object-cover"
                        />
                      </span>
                    </span>

                    {/* the tick that points at the label */}
                    <span
                      aria-hidden
                      className="mt-3 block h-4 w-px origin-top scale-y-0 bg-gradient-to-b from-azure-lit/70 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100"
                    />

                    <span className="mt-1 block text-[0.9375rem] font-medium leading-snug text-starlight transition-colors duration-500 group-hover:text-azure-glow">
                      {short}
                    </span>
                    <span className="label-chart mt-2 block opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      {planet.managers.length + 1} people
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </Shell>
    </Section>
  );
}
