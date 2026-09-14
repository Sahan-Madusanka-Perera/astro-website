import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Reader } from '@/components/magazine/Reader';
import { getIssueBySlug } from '@/lib/magazine/queries';
import { issueImages, toReaderIssue } from '@/lib/magazine/shared';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getIssueBySlug(slug);
  if (!issue) return { title: 'Issue not found' };
  const cover = issueImages(issue)[0].m;
  const description =
    issue.description ?? `${issue.edition ? `${issue.edition}. ` : ''}Read it as a flipbook, in the browser.`;
  return {
    title: issue.title,
    description,
    openGraph: {
      title: issue.title,
      description,
      url: `/magazine/${issue.slug}`,
      type: 'article',
      images: [{ url: cover, width: issue.pages[0]?.w, height: issue.pages[0]?.h }],
    },
    twitter: { card: 'summary_large_image', images: [cover] },
  };
}

export default async function IssuePage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const issue = await getIssueBySlug(slug);
  if (!issue) notFound();

  const requested = Number.parseInt(page ?? '', 10);
  const initialPage = Number.isFinite(requested)
    ? Math.min(issue.page_count - 1, Math.max(0, requested - 1))
    : 0;

  return (
    <main id="main">
      <Reader issue={toReaderIssue(issue, `/magazine/${issue.slug}`)} initialPage={initialPage} />
    </main>
  );
}
