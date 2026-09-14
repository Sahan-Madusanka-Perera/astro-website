import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Section, Shell, SectionHead } from '@/components/layout/Section';
import { IssueCover } from '@/components/magazine/IssueCover';
import { getPublishedIssues } from '@/lib/magazine/queries';
import { issueImages } from '@/lib/magazine/shared';

/* The latest issue on the home page. Until the club publishes one the section
   simply isn't there — an empty shelf on the front page says less than none. */

export async function MagazineSection() {
  const issues = await getPublishedIssues();
  const latest = issues[0];
  if (!latest) return null;

  const aspect = latest.pages?.[0] ? latest.pages[0].w / latest.pages[0].h : 0.707;

  return (
    <Section id="magazine" className="bg-void py-28 md:py-40">
      <Shell>
        <SectionHead
          title={<>Read the magazine.</>}
          lede="The club's e-magazine — observing reports, astrophotography and the people behind them. It opens right here and turns like paper."
          aside={
            issues.length > 1 ? (
              <Link
                href="/magazine"
                className="label-chart inline-flex items-center gap-1.5 transition-colors hover:text-azure-glow"
                data-numeric
              >
                All {issues.length} issues
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : undefined
          }
        />

        <Link
          href={`/magazine/${latest.slug}`}
          className="group mt-16 grid grid-cols-1 items-center gap-x-10 gap-y-10 rounded-sm md:mt-20 md:grid-cols-12"
        >
          <IssueCover
            src={issueImages(latest)[0].m}
            aspect={aspect}
            alt={`Cover of ${latest.title}`}
            className="mx-auto w-full max-w-[18rem] md:col-span-4 md:max-w-none"
          />
          <div className="md:col-span-6 md:col-start-6">
            <h3 className="display text-[clamp(1.75rem,4vw,2.75rem)] transition-colors duration-500 group-hover:text-azure-glow">
              {latest.title}
            </h3>
            {latest.edition && <p className="mt-3 text-[1.0625rem] text-star-dim">{latest.edition}</p>}
            {latest.description && (
              <p className="mt-5 max-w-[50ch] leading-[1.7] text-star-dim">{latest.description}</p>
            )}
            <p className="label-chart mt-7 border-t border-rule pt-5" data-numeric>
              {latest.page_count} pages
              <span className="mx-2 text-star-ghost">/</span>
              <time dateTime={latest.published_at}>{format(parseISO(latest.published_at), 'MMMM yyyy')}</time>
            </p>
            <span className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-azure px-7 py-3.5 text-[0.9375rem] font-medium text-white transition-[background-color,transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:bg-azure-lit group-hover:shadow-[0_10px_40px_-8px_rgba(41,163,221,0.65)]">
              Open the issue
              <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </Shell>
    </Section>
  );
}
