'use client';

import { Mail, MapPin, ArrowUpRight } from 'lucide-react';
import {
  InstagramIcon, FacebookIcon, YouTubeIcon,
  LinkedInIcon, TikTokIcon, XIcon, WhatsAppIcon,
} from './social-icons';
import Link from 'next/link';
import Image from 'next/image';
import { MoonPhase } from '@/components/cosmos/MoonPhase';
import { StarField } from '@/components/cosmos/StarField';
import { Shell } from './Section';

/* TODO(club): replace each `url` with the club's real profile — these are bare
   domains, carried over from the previous site, and they were never handles. */
const SOCIALS = [
  { url: 'https://www.instagram.com/', name: 'Instagram', Icon: InstagramIcon },
  { url: 'https://www.facebook.com/', name: 'Facebook', Icon: FacebookIcon },
  { url: 'https://www.youtube.com/', name: 'YouTube', Icon: YouTubeIcon },
  { url: 'https://www.linkedin.com/', name: 'LinkedIn', Icon: LinkedInIcon },
  { url: 'https://www.tiktok.com/', name: 'TikTok', Icon: TikTokIcon },
  { url: 'https://www.x.com/', name: 'X', Icon: XIcon },
  { url: 'https://www.whatsapp.com/', name: 'WhatsApp', Icon: WhatsAppIcon },
];

const SITE_LINKS = [
  { name: 'Planets', href: '/#planets' },
  { name: 'About', href: '/#about' },
  { name: 'Events', href: '/#events' },
  { name: 'Gallery', href: '/#gallery' },
  { name: 'Magazine', href: '/magazine' },
  { name: 'Board', href: '/board' },
];

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-rule bg-void">
      <StarField density={70} meteorRate={0} className="opacity-45" />

      <Shell className="relative z-10 pt-20 pb-10 md:pt-24">
        {/* ── Top: the mark and the practical facts ────────────────────── */}
        <div className="grid grid-cols-1 gap-x-10 gap-y-14 md:grid-cols-12">
          <div className="col-span-1 md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3.5">
              <span className="relative block h-11 w-11 shrink-0">
                <Image
                  src="/images/astro_logo.png"
                  alt=""
                  fill
                  sizes="44px"
                  className="object-contain"
                />
              </span>
              <span className="display text-[1.375rem] leading-none">
                J&apos;pura Astronomy
              </span>
            </Link>

            <p className="mt-6 max-w-[42ch] leading-[1.7] text-star-dim">
              The astronomy club of the University of Sri Jayewardenepura. We
              keep the telescopes, teach the sky, and go looking for dark.
            </p>

            {/* Tonight's moon — the one number that decides whether an
                observation night is worth the drive. */}
            <div className="mt-9 inline-flex items-center gap-5 border-t border-rule pt-6">
              <MoonPhase />
            </div>
          </div>

          <nav className="col-span-1 md:col-span-3 md:col-start-7" aria-label="Footer">
            <h2 className="label-chart">Sections</h2>
            <ul className="mt-5 space-y-3">
              {SITE_LINKS.map((l) => (
                <li key={l.name}>
                  <Link
                    href={l.href}
                    className="text-[0.9375rem] text-star-dim transition-colors duration-400 hover:text-azure-glow"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://forms.gle/Hc83F5GZbEVF6ShU6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-[0.9375rem] text-star-dim transition-colors duration-400 hover:text-azure-glow"
                >
                  Merch
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </li>
            </ul>
          </nav>

          <div className="col-span-1 md:col-span-3 md:col-start-10">
            <h2 className="label-chart">Find us</h2>
            <address className="mt-5 space-y-4 not-italic">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-azure-lit" strokeWidth={1.6} />
                <span className="text-[0.9375rem] leading-relaxed text-star-dim">
                  University of Sri Jayewardenepura
                  <br />
                  Gangodawila, Nugegoda
                  <br />
                  Sri Lanka
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-azure-lit" strokeWidth={1.6} />
                <a
                  href="mailto:astronomy@sjp.ac.lk"
                  className="text-[0.9375rem] text-star-dim underline decoration-star-ghost/60 transition-colors duration-400 hover:text-azure-glow hover:decoration-azure-lit"
                >
                  astronomy@sjp.ac.lk
                </a>
              </div>
            </address>

            <ul className="-mx-1.5 mt-7 flex flex-wrap gap-x-0.5 gap-y-1">
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    className="grid h-9 w-9 place-items-center rounded-full text-star-faint transition-[color,background-color] duration-400 hover:bg-white/[0.06] hover:text-azure-glow"
                  >
                    <s.Icon className="h-[1.15rem] w-[1.15rem]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom rule ──────────────────────────────────────────────── */}
        <div className="mt-16 flex flex-col-reverse gap-5 border-t border-rule pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-chart leading-relaxed">
            © {new Date().getFullYear()} J&apos;pura Astronomy Club
            <span className="mx-2 text-star-ghost">/</span>
            6.8524° N, 79.9040° E
          </p>

          <Link
            href="/login"
            className="label-chart transition-colors duration-400 hover:text-azure-glow"
          >
            Committee login
          </Link>
        </div>
      </Shell>
    </footer>
  );
}
