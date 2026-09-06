'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PLANETS } from '@/lib/planets-data';
import { StarField } from '@/components/cosmos/StarField';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shell } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { Avatar } from '@/components/people/Avatar';

/* ---------------------------------------------------------------------------
   One division.

   The old page tinted every element with a per-planet accent — but all six
   planets carry the same colour in the data, so the tinting bought nothing and
   cost the page its consistency. Here the site's own azure does the work and
   the planet's own artwork carries its identity.
--------------------------------------------------------------------------- */

export default function PlanetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const planet = PLANETS.find((p) => p.slug === slug);
  if (!planet) notFound();

  const short = planet.name.replace('Planet of ', '');
  const people = planet.managers.length + 1;

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
            <div className="col-span-1 justify-self-center md:col-span-4 md:justify-self-start">
              <span className="relative block aspect-square w-44 overflow-hidden rounded-full ring-1 ring-white/10 shadow-[0_0_90px_-20px_rgba(41,163,221,0.8)] md:w-full md:max-w-[17rem]">
                <Image
                  src={planet.icon}
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
                Planet {planet.id} of {PLANETS.length}
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

            {/* Director — given the room the role deserves. */}
            <Reveal className="mt-10">
              <div className="panel flex flex-col items-center gap-8 p-7 text-center sm:flex-row sm:items-start sm:gap-10 sm:p-9 sm:text-left">
                <Avatar
                  src={planet.director.image}
                  name={planet.director.name}
                  sizes="176px"
                  className="h-36 w-36 shrink-0 shadow-[0_18px_50px_-16px_rgba(41,163,221,0.6)] sm:h-44 sm:w-44"
                />
                <div className="min-w-0 flex-1">
                  <p className="label-chart">Director</p>
                  <h3 className="display mt-3 text-[clamp(1.4rem,3.2vw,2rem)]">
                    {planet.director.name}
                  </h3>
                  {planet.director.bio && (
                    <p className="mt-4 max-w-[58ch] leading-[1.7] text-star-dim">
                      {planet.director.bio}
                    </p>
                  )}
                  {planet.director.email && (
                    <a
                      href={`mailto:${planet.director.email}`}
                      className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-rule-lit px-5 py-2.5 text-[0.875rem] text-star-dim transition-colors duration-500 hover:border-azure-lit/60 hover:text-starlight"
                    >
                      <Mail className="h-4 w-4" strokeWidth={1.6} />
                      Email {planet.director.name.split(' ')[0]}
                    </a>
                  )}
                </div>
              </div>
            </Reveal>

            {/* Managers */}
            <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {planet.managers.map((m, i) => (
                <Reveal as="li" key={m.id} delay={i * 65}>
                  <div className="panel panel-lift flex h-full items-center gap-5 p-5">
                    <Avatar
                      src={m.image}
                      name={m.name}
                      sizes="80px"
                      className="h-[4.5rem] w-[4.5rem] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="label-chart">Manager</p>
                      <h3 className="mt-2 text-[1.0625rem] font-medium leading-snug text-starlight">
                        {m.name}
                      </h3>
                      {m.email && (
                        <a
                          href={`mailto:${m.email}`}
                          className="mt-2.5 inline-flex items-center gap-1.5 text-[0.8125rem] text-azure-lit transition-colors hover:text-azure-glow"
                        >
                          <Mail className="h-3.5 w-3.5" strokeWidth={1.6} />
                          Contact
                        </a>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </section>

          {/* ── Remit ───────────────────────────────────────────────────── */}
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

          {/* ── Onward ──────────────────────────────────────────────────── */}
          <nav className="mt-24 border-t border-rule pt-8 md:mt-32" aria-label="Other planets">
            <p className="label-chart">The other five</p>
            <ul className="mt-5 flex flex-wrap gap-x-2 gap-y-2">
              {PLANETS.filter((p) => p.slug !== planet.slug).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/planets/${p.slug}`}
                    className="inline-flex items-center gap-2.5 rounded-full border border-rule px-4 py-2 text-[0.875rem] text-star-dim transition-colors duration-500 hover:border-azure-lit/55 hover:text-starlight"
                  >
                    <span className="relative block h-5 w-5 shrink-0 overflow-hidden rounded-full">
                      <Image src={p.icon} alt="" fill sizes="20px" className="object-cover" />
                    </span>
                    {p.name.replace('Planet of ', '')}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Shell>
      </main>
      <Footer />
    </>
  );
}
