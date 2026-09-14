import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shell, SectionHead } from '@/components/layout/Section';
import { StarField } from '@/components/cosmos/StarField';
import { Reveal } from '@/components/motion/Reveal';
import { IssueCover } from '@/components/magazine/IssueCover';
import { getPublishedIssues, type MagazineSummary } from '@/lib/magazine/queries';
import { issueImages } from '@/lib/magazine/shared';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Magazine',
  description:
    "The J'pura Astronomy Club e-magazine — observing reports, astrophotography and the people behind them. Read every issue in the browser.",
};

const coverOf = (m: MagazineSummary) => issueImages(m)[0];
const aspectOf = (m: MagazineSummary) => (m.pages?.[0] ? m.pages[0].w / m.pages[0].h : 0.707);
const published = (m: MagazineSummary) => format(parseISO(m.published_at), 'MMMM yyyy');

export default async function MagazinePage() {
  const issues = await getPublishedIssues();
  const [latest, ...earlier] = issues;

  return (
    <>
      <Navbar />
      <main id="main" className="relative isolate min-h-screen overflow-hidden bg-void">
        <StarField density={90} meteorRate={2} />

        <Shell className="relative z-10 pt-28 pb-24 md:pt-36 md:pb-32">
          <SectionHead
            title={<>The club,<br />in print.</>}
            lede="Observing reports, astrophotography, interviews and whatever the committee couldn't fit on a poster. Every issue opens right here — turn the pages like paper."
            aside={
              issues.length > 0 ? (
                <p className="label-chart" data-numeric>
                  {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
                </p>
              ) : undefined
            }
          />

          {!latest ? (
            <div className="mt-16 flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-24 text-center md:mt-20">
              <BookOpen className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
              <p className="mt-5 text-[1.0625rem] text-star-dim">The first issue is on its way.</p>
              <p className="note mt-3 max-w-[46ch]">
                When the committee publishes it, it will open here as a flipbook.
              </p>
            </div>
          ) : (
            <>
              {/* ── The latest issue, at full weight ─────────────────────── */}
              <Link
                href={`/magazine/${latest.slug}`}
                className="group mt-16 grid grid-cols-1 items-center gap-x-10 gap-y-10 rounded-sm md:mt-24 md:grid-cols-12"
              >
                <IssueCover
                  src={coverOf(latest).m}
                  aspect={aspectOf(latest)}
                  alt={`Cover of ${latest.title}`}
                  priority
                  className="mx-auto w-full max-w-[22rem] md:col-span-5 md:max-w-none"
                />
                <div className="md:col-span-6 md:col-start-7">
                  <p className="text-[0.8125rem] text-azure-glow">Latest issue</p>
                  <h2 className="display display-xl mt-4 text-[clamp(2rem,5.2vw,3.75rem)] transition-colors duration-500 group-hover:text-azure-glow">
                    {latest.title}
                  </h2>
                  {latest.edition && (
                    <p className="mt-4 text-[1.0625rem] text-star-dim">{latest.edition}</p>
                  )}
                  {latest.description && (
                    <p className="mt-6 max-w-[52ch] leading-[1.7] text-star-dim">{latest.description}</p>
                  )}
                  <p className="label-chart mt-8 border-t border-rule pt-5" data-numeric>
                    {latest.page_count} pages
                    <span className="mx-2 text-star-ghost">/</span>
                    <time dateTime={latest.published_at}>{published(latest)}</time>
                  </p>
                  <span className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-azure px-7 py-3.5 text-[0.9375rem] font-medium text-white transition-[background-color,transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:bg-azure-lit group-hover:shadow-[0_10px_40px_-8px_rgba(41,163,221,0.65)]">
                    Read the issue
                    <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
              {latest.allow_download && latest.pdf_url && (
                <div className="mt-4 md:grid md:grid-cols-12">
                  <a
                    href={latest.pdf_url}
                    download
                    className="inline-flex items-center gap-2 text-[0.875rem] text-star-faint transition-colors duration-400 hover:text-azure-glow md:col-span-6 md:col-start-7"
                  >
                    <Download className="h-4 w-4" strokeWidth={1.7} />
                    Download the PDF
                  </a>
                </div>
              )}

              {/* ── The shelf ────────────────────────────────────────────── */}
              {earlier.length > 0 && (
                <section className="mt-28 md:mt-40">
                  <div className="rule-h" />
                  <h2 className="display mt-8 text-[clamp(1.5rem,3.4vw,2.25rem)] md:mt-10">Earlier issues</h2>
                  <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 md:mt-14 lg:grid-cols-4">
                    {earlier.map((m, i) => (
                      <Reveal as="li" key={m.id} delay={i * 60}>
                        <Link href={`/magazine/${m.slug}`} className="group block rounded-sm">
                          <IssueCover src={coverOf(m).m} aspect={aspectOf(m)} alt={`Cover of ${m.title}`} />
                          <h3 className="mt-5 text-[1.0625rem] font-medium leading-snug text-starlight transition-colors duration-400 group-hover:text-azure-glow">
                            {m.title}
                          </h3>
                          {m.edition && <p className="mt-1.5 text-[0.8125rem] text-star-faint">{m.edition}</p>}
                          <p className="label-chart mt-3" data-numeric>
                            <time dateTime={m.published_at}>{published(m)}</time>
                          </p>
                        </Link>
                      </Reveal>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </Shell>
      </main>
      <Footer />
    </>
  );
}
