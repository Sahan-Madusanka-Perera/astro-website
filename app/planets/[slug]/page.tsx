import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { countWord, shortPlanetName } from '@/lib/club/shared';
import { currentBoard, getClubData, teamsForPlanet } from '@/lib/club/queries';
import { PlanetPeople } from '@/components/planets/PlanetPeople';
import { StarField } from '@/components/cosmos/StarField';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shell } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';

/* ---------------------------------------------------------------------------
   One division.

   The old page tinted every element with a per-planet accent — but all six
   planets carry the same colour in the data, so the tinting bought nothing and
   cost the page its consistency. Here the site's own azure does the work and
   the planet's own artwork carries its identity.
--------------------------------------------------------------------------- */

// Edited in Admin → Planets and Admin → Boards, which refresh these pages on save.
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

/* Pre-render the known planets; ones added later in the admin render on first visit. */
export async function generateStaticParams() {
  const { planets } = await getClubData();
  return planets.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { planets } = await getClubData();
  const planet = planets.find((p) => p.slug === slug);
  return planet ? { title: planet.name, description: planet.description } : {};
}

export default async function PlanetPage({ params }: Props) {
  const { slug } = await params;
  const club = await getClubData();
  const index = club.planets.findIndex((p) => p.slug === slug);
  const planet = club.planets[index];
  if (!planet) notFound();

  const short = shortPlanetName(planet.name);
  const teams = teamsForPlanet(club, planet.id);
  const current = currentBoard(club.boards);
  const initial = teams.find((t) => t.boardId === current?.id) ?? teams[0];
  const people = initial ? initial.directors.length + initial.managers.length : 0;
  const others = club.planets.filter((p) => p.id !== planet.id);

  return (
    <>
      <Navbar />
      <main id="main" className="relative isolate min-h-screen overflow-hidden bg-void">
        <StarField density={120} meteorRate={3} />

        {/* the planet's own light, spilling over the top of the page */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-32rem] -z-10 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full opacity-[0.18] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #29a3dd, transparent 70%)' }}
        />

        <Shell className="relative z-10 pt-28 pb-24 md:pt-36 md:pb-32">
          <Link
            href="/#planets"
            className="group inline-flex items-center gap-2 text-[0.875rem] text-star-faint transition-colors hover:text-azure-glow"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1" />
            All planets
          </Link>

          {/* ── Masthead ────────────────────────────────────────────────── */}
          <header className="mt-14 grid grid-cols-1 items-center gap-x-14 gap-y-10 md:mt-20 md:grid-cols-12">
            <div className="col-span-1 justify-self-center md:col-span-4 md:w-full md:justify-self-start">
              <span className="relative block aspect-square w-44 overflow-hidden rounded-full ring-1 ring-white/10 shadow-[0_0_90px_-20px_rgba(41,163,221,0.8)] md:w-full md:max-w-[17rem]">
                <Image
                  src={planet.icon_url || '/images/astro_logo.png'}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 176px, 272px"
                  priority
                  className="object-cover"
                />
              </span>
            </div>

            <div className="col-span-1 text-center md:col-span-8 md:text-left">
              <h1 className="display display-xl text-[clamp(2.5rem,7.5vw,5rem)]">
                {short}
              </h1>
              <p className="label-chart mt-5">
                Planet {index + 1} of {club.planets.length}
                <span className="mx-2 text-star-ghost">/</span>
                {people} {people === 1 ? 'person' : 'people'}
              </p>
              <p className="mx-auto mt-7 max-w-[54ch] text-[1.0625rem] leading-[1.7] text-star-dim md:mx-0 md:text-[1.1875rem]">
                {planet.description}
              </p>
            </div>
          </header>

          {/* ── The people ──────────────────────────────────────────────── */}
          <section className="mt-24 md:mt-32">
            <div className="rule-h" />
            <h2 className="display mt-8 text-[clamp(1.6rem,3.6vw,2.25rem)]">
              Who runs it
            </h2>

            <PlanetPeople teams={teams} initialYear={initial?.year} />
          </section>

          {/* ── Remit ───────────────────────────────────────────────────── */}
          {planet.responsibilities.length > 0 && (
          <section className="mt-24 md:mt-32">
            <div className="rule-h" />
            <div className="grid grid-cols-1 gap-x-14 gap-y-8 pt-8 md:grid-cols-12">
              <h2 className="display col-span-1 text-[clamp(1.6rem,3.6vw,2.25rem)] md:col-span-4">
                What it&apos;s
                <br className="hidden md:block" /> responsible for
              </h2>

              {/* A list, not a sequence — the duties aren't performed in
                  order, so numbering them would be decoration. */}
              <ul className="col-span-1 md:col-span-7 md:col-start-6">
                {planet.responsibilities.map((r, i) => (
                  <Reveal
                    as="li"
                    key={r}
                    delay={i * 60}
                    className="border-t border-rule py-5 text-[1.0625rem] leading-[1.65] text-star-dim last:border-b"
                  >
                    {r}
                  </Reveal>
                ))}
              </ul>
            </div>
          </section>
          )}

          {/* ── Onward ──────────────────────────────────────────────────── */}
          {others.length > 0 && (
          <nav className="mt-24 border-t border-rule pt-8 md:mt-32" aria-label="Other planets">
            <p className="label-chart">The other {countWord(others.length).toLowerCase()}</p>
            <ul className="mt-5 flex flex-wrap gap-x-2 gap-y-2">
              {others.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/planets/${p.slug}`}
                    className="inline-flex items-center gap-2.5 rounded-full border border-rule px-4 py-2 text-[0.875rem] text-star-dim transition-colors duration-500 hover:border-azure-lit/55 hover:text-starlight"
                  >
                    <span className="relative block h-5 w-5 shrink-0 overflow-hidden rounded-full">
                      <Image src={p.icon_url || '/images/astro_logo.png'} alt="" fill sizes="20px" className="object-cover" />
                    </span>
                    {shortPlanetName(p.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          )}
        </Shell>
      </main>
      <Footer />
    </>
  );
}
