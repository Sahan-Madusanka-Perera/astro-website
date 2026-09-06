'use client';

import { ArrowUpRight } from 'lucide-react';
import { Section, Shell, SectionHead } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';

/* ---------------------------------------------------------------------------
   What the club actually does.

   Set as a programme — hairline-ruled rows with a cadence column — rather than
   four identical icon cards. The rows carry different weights of text, so the
   block reads as a schedule instead of a grid.
--------------------------------------------------------------------------- */

const PROGRAMME = [
  {
    title: 'Observation nights',
    body: 'Telescopes out on the roof, and out at dark-sky sites when the moon gets out of the way. Beginners get put on the eyepiece first.',
    cadence: 'Monthly',
  },
  {
    title: 'Workshops & seminars',
    body: 'Astrophotography, orbital mechanics, stellar spectra, and how to actually collimate a Dobsonian without ruining your night.',
    cadence: 'Each term',
  },
  {
    title: 'Research',
    body: 'Member-led projects with real write-ups. Variable star photometry, occultation timing, and whatever a member turns up curious about.',
    cadence: 'Ongoing',
  },
  {
    title: 'Field trips',
    body: 'Out past the streetlights, and out to the observatories. The nights that turn a member into an astronomer.',
    cadence: 'Twice yearly',
  },
];

const JOIN_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSeFJ5bgWOGQ88zKIxZ5psOf-yfJ8DAab0EJpgjxm4cqzqhjIg/viewform?usp=header';

export function AboutSection() {
  return (
    <Section id="about" className="bg-void pt-8 pb-0">
      <Shell>
        <SectionHead
          title={<>What we do<br />when it&apos;s dark.</>}
          lede="We're the astronomy club of the University of Sri Jayewardenepura — students, mostly, plus anyone who turns up and stays. No experience is assumed and none is required."
        />

        <ul className="mt-16 md:mt-20">
          {PROGRAMME.map((item, i) => (
            <Reveal
              as="li"
              key={item.title}
              delay={i * 70}
              className="group grid grid-cols-1 gap-x-10 gap-y-3 border-t border-rule py-8 transition-colors duration-500 hover:border-azure-lit/35 md:grid-cols-12 md:py-10 last:border-b"
            >
              <h3 className="col-span-1 text-[1.375rem] font-medium leading-tight tracking-[-0.015em] text-starlight transition-colors duration-500 group-hover:text-azure-glow md:col-span-4 md:text-[1.5rem]">
                {item.title}
              </h3>
              <p className="col-span-1 max-w-[62ch] leading-[1.7] text-star-dim md:col-span-6">
                {item.body}
              </p>
              <p className="label-chart col-span-1 md:col-span-2 md:text-right">
                {item.cadence}
              </p>
            </Reveal>
          ))}
        </ul>
      </Shell>

      {/* ── The join field ───────────────────────────────────────────────
          The one region on the site where azure owns the whole surface. The
          page has been dark for three screens; this is what it was saving. */}
      <div
        className="relative mt-24 overflow-hidden md:mt-32"
        style={{
          background:
            'linear-gradient(155deg, #00405f 0%, #00699b 32%, #0d8fcf 68%, #2fabe4 100%)',
        }}
      >
        {/* the seal's own ring geometry, at wall scale */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[16%] -top-[62%] aspect-square w-[62rem] rounded-full border border-white/[0.14]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[10%] -top-[48%] aspect-square w-[46rem] rounded-full border border-white/[0.09]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(115% 85% at 10% 112%, rgba(0,24,42,0.42), transparent 60%)',
          }}
        />

        <Shell className="relative py-20 md:py-28">
          <div className="grid grid-cols-1 items-end gap-x-10 gap-y-10 md:grid-cols-12">
            <div className="col-span-1 md:col-span-7">
              <h3 className="display display-xl text-[clamp(2rem,5.6vw,3.75rem)] text-white">
                Anyone who looks up
                <br />
                is already halfway in.
              </h3>
              <p className="mt-6 max-w-[48ch] text-[1.0625rem] leading-[1.65] text-white/85">
                Membership is open to every faculty, every year, and every level
                of knowing what you&apos;re looking at. Bring nothing. We have
                the telescopes.
              </p>
            </div>

            <div className="col-span-1 flex md:col-span-4 md:col-start-9 md:justify-end">
              <a
                href={JOIN_FORM}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-[0.9375rem] font-medium text-[#00354f] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_14px_44px_-10px_rgba(0,0,0,0.5)]"
              >
                Become a member
                <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </Shell>
      </div>
    </Section>
  );
}
