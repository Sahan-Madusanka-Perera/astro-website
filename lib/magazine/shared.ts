import type { Magazine, PageImages, ReaderIssue } from '@/types/magazine';

export const MAGAZINE_BUCKET = 'magazines';

/** Storage paths inside an issue's folder. Pages are 1-based and zero-padded
 *  so a folder listing sorts in reading order. */
export const pagePath = (index: number, size: keyof PageImages, ext: string) =>
  `pages/${String(index + 1).padStart(4, '0')}-${size}.${ext}`;

export const TEXT_PATH = 'text.json';
export const PDF_PATH = 'issue.pdf';

export function issueImages(m: Pick<Magazine, 'base_url' | 'image_ext' | 'page_count'>): PageImages[] {
  return Array.from({ length: m.page_count }, (_, i) => ({
    t: `${m.base_url}/${pagePath(i, 't', m.image_ext)}`,
    m: `${m.base_url}/${pagePath(i, 'm', m.image_ext)}`,
    h: `${m.base_url}/${pagePath(i, 'h', m.image_ext)}`,
  }));
}

export function toReaderIssue(m: Magazine, shareUrl?: string): ReaderIssue {
  return {
    title: m.title,
    edition: m.edition,
    pages: m.pages,
    images: issueImages(m),
    outline: m.outline ?? [],
    textUrl: m.has_text ? `${m.base_url}/${TEXT_PATH}` : null,
    pdfUrl: m.allow_download ? m.pdf_url : null,
    shareUrl,
  };
}

export function slugify(input: string): string {
  return (
    input
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'issue'
  );
}
