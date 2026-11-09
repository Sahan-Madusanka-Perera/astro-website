'use client';

import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Section, Shell, SectionHead } from '@/components/layout/Section';
import { Reveal } from '@/components/motion/Reveal';
import { LineReveal } from '@/components/motion/LineReveal';
import { useScrollMotion } from '@/hooks/useScrollMotion';

/* ---------------------------------------------------------------------------
   What the club actually does — in the words of its constitution (4th
   edition): the mission, and the work of the planets.

   Set as a programme of hairline-ruled rows rather than four identical icon
   cards, so the block reads as a list of what happens, not a grid.
--------------------------------------------------------------------------- */

const PROGRAMME = [
  {
    title: 'Observation',
    body: 'Night camps and observation sessions under the sky — planned and run by the Planet of Observation.',
  },
  {
    title: 'Education & seminars',
    body: 'Educational programmes and seminars that make astronomy accessible and engaging, including support for students preparing for important examinations.',
  },
  {
    title: 'Research',
    body: 'Research projects related to astronomy, organised by the Planet of Research, for members who want to go deeper.',
  },
  {
    title: 'Outreach & charity',
    body: 'Sharing astronomy with the university community and beyond through social media, and contributing through educational and charitable projects.',
  },
];

const JOIN_FORM =
  'https://docs.google.com/forms/d/e/1FAIpQLSeFJ5bgWOGQ88zKIxZ5psOf-yfJ8DAab0EJpgjxm4cqzqhjIg/viewform?usp=header';

export function AboutSection() {
  const joinRef = useRef<HTMLDivElement>(null);

  /* The seal's rings turn against each other as the join field passes
     through the viewport — the only azure region on the site, moving only
     while the reader does. */
  useScrollMotion(joinRef, ({ gsap }, field) => {
    const q = gsap.utils.selector(field);
    const through = () => ({ trigger: field, start: 'top bottom', end: 'bottom top', scrub: 0.3 });
    gsap.fromTo(q('[data-join-ring="outer"]'), { rotate: 22 }, { rotate: -22, ease: 'none', scrollTrigger: through() });
    gsap.fromTo(q('[data-join-ring="inner"]'), { rotate: -28 }, { rotate: 18, ease: 'none', scrollTrigger: through() });
  });

  return (
    <Section id="about" className="bg-void pt-8 pb-0">
      <Shell>
        <SectionHead
          title={<>What we do<br />when it&apos;s dark.</>}
          lede="The J'pura Astronomy Club is a non-profit student organisation of the University of Sri Jayewardenepura. Our mission is to expand and share our knowledge of astronomy with the university community and beyond — to inspire curiosity, encourage a scientific mindset, and cultivate a passion for the cosmos."
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
              <p className="col-span-1 max-w-[62ch] leading-[1.7] text-star-dim md:col-span-8">
                {item.body}
              </p>
            </Reveal>
          ))}
        </ul>
      </Shell>

      {/* ── The join field ───────────────────────────────────────────────
          The one region on the site where azure owns the whole surface. The
          page has been dark for three screens; this is what it was saving. */}
      <div
        ref={joinRef}
        className="relative mt-24 overflow-hidden md:mt-32"
        style={{
          background:
            'linear-gradient(155deg, #00405f 0%, #00699b 32%, #0d8fcf 68%, #2fabe4 100%)',
        }}
      >
        {/* the seal's own ring geometry, at wall scale — each ring carries one
            body on its visible left limb, so its turn can actually be seen */}
        <div
          aria-hidden
          data-join-ring="outer"
          className="pointer-events-none absolute -right-[16%] -top-[62%] aspect-square w-[62rem] rounded-full border border-white/[0.14]"
        >
          <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        </div>
        <div
          aria-hidden
          data-join-ring="inner"
          className="pointer-events-none absolute -right-[10%] -top-[48%] aspect-square w-[46rem] rounded-full border border-white/[0.09]"
        >
          <span className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60" />
        </div>
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
              <LineReveal as="h3" className="display display-xl text-[clamp(2rem,5.6vw,3.75rem)] text-white">
                Anyone who looks up
                <br />
                is already halfway in.
              </LineReveal>
              <p className="mt-6 max-w-[48ch] text-[1.0625rem] leading-[1.65] text-white/85">
                Any student of the University of Sri Jayewardenepura who is
                interested in astronomy can join, with a one-year membership
                you renew each year. No experience needed — just curiosity.
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
