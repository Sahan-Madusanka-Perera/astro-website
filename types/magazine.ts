/** A link found on a PDF page. Box is in fractions of the page (0–1). */
export interface MagazineLink {
  x: number;
  y: number;
  w: number;
  h: number;
  /** External address. */
  url?: string;
  /** Zero-based page inside the same issue. */
  page?: number;
}

export interface MagazinePage {
  /** Pixel size of the medium rendition — only the ratio matters to layout. */
  w: number;
  h: number;
  links?: MagazineLink[];
}

export interface MagazineOutlineItem {
  title: string;
  /** Zero-based page. */
  page: number;
  items?: MagazineOutlineItem[];
}

export interface Magazine {
  id: string;
  slug: string;
  title: string;
  edition: string | null;
  description: string | null;
  base_url: string;
  image_ext: 'webp' | 'jpg';
  page_count: number;
  pages: MagazinePage[];
  outline: MagazineOutlineItem[];
  has_text: boolean;
  pdf_url: string | null;
  allow_download: boolean;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

/** The three renditions of one page. */
export interface PageImages {
  /** ~240px wide: thumbnails, and the instant placeholder under every page. */
  t: string;
  /** ~1800px long edge: normal reading. */
  m: string;
  /** ~3000px long edge: only fetched when the reader zooms in. */
  h: string;
}

/** Everything the reader needs, whether it came from the database or is a
 *  local preview built from blobs in the admin's browser. */
export interface ReaderIssue {
  title: string;
  edition?: string | null;
  pages: MagazinePage[];
  images: PageImages[];
  outline: MagazineOutlineItem[];
  /** Per-page plain text, for search and screen readers. */
  textUrl?: string | null;
  text?: string[] | null;
  pdfUrl?: string | null;
  shareUrl?: string;
}
