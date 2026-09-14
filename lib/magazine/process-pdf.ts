import type { MagazineLink, MagazineOutlineItem, MagazinePage } from '@/types/magazine';

/* ---------------------------------------------------------------------------
   PDF → pages, in the admin's browser.

   Readers never download the PDF to read an issue. Each page is rendered here
   once, at the largest size anyone will zoom to, then scaled down twice:

     h  ~3000px long edge  fetched only when a reader zooms in
     m  ~1800px long edge  what a reader normally sees
     t   240px wide        thumbnails and the instant placeholder

   Doing it here needs no server-side PDF tooling and keeps the hosted API
   small. Links and bookmarks are read from the PDF so they still work in the
   flipbook, and the text is kept for search.
--------------------------------------------------------------------------- */

type PdfJs = typeof import('pdfjs-dist');
type PdfDoc = Awaited<ReturnType<PdfJs['getDocument']>['promise']>;

const HD_LONG = 3000;
const MD_LONG = 1800;
const THUMB_W = 240;
/* iOS Safari refuses canvases above ~16.7M pixels. */
const MAX_AREA = 16_000_000;

let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= import('pdfjs-dist').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    return pdfjs;
  });
  return pdfjsPromise;
}

export interface OpenedPdf {
  doc: PdfDoc;
  pageCount: number;
  /** From the PDF's own metadata, if whoever exported it filled it in. */
  title: string | null;
  /** Most interior pages are landscape — the PDF was exported as spreads. */
  looksLikeSpreads: boolean;
  /** Frees the document and its worker. */
  close: () => void;
}

export async function openPdf(file: File): Promise<OpenedPdf> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({ data });
  const doc = await task.promise;

  let title: string | null = null;
  try {
    const meta = await doc.getMetadata();
    const t = (meta.info as { Title?: string } | undefined)?.Title?.trim();
    if (t && !/^untitled|\.(pdf|indd|docx?)$/i.test(t)) title = t;
  } catch {
    /* metadata is optional */
  }

  let landscape = 0;
  const interior = Math.max(0, doc.numPages - 2);
  for (let i = 2; i < doc.numPages; i++) {
    const vp = (await doc.getPage(i)).getViewport({ scale: 1 });
    if (vp.width / vp.height > 1.2) landscape++;
  }

  return {
    doc,
    pageCount: doc.numPages,
    title,
    looksLikeSpreads: interior > 0 && landscape / interior >= 0.6,
    close: () => void task.destroy(),
  };
}

/** A quick, small render of page one for the upload form. */
export async function renderCover(doc: PdfDoc): Promise<string> {
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: 520 / base.width });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvas, viewport, intent: 'print' }).promise;
  const blob = await toBlob(canvas, 'image/jpeg', 0.85);
  page.cleanup();
  return URL.createObjectURL(blob);
}

export interface ProcessedPage {
  meta: MagazinePage;
  images: { t: Blob; m: Blob; h: Blob };
  text: string;
}

export interface ProcessedIssue {
  pages: ProcessedPage[];
  outline: MagazineOutlineItem[];
  ext: 'webp' | 'jpg';
  hasText: boolean;
}

export interface ProcessProgress {
  done: number;
  total: number;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode page'))), type, quality)
  );
}

let webpSupport: Promise<boolean> | null = null;
/* Safari draws WebP but cannot always encode it; it silently hands back a PNG.
   Ask once, and fall back to JPEG rather than upload PNGs ten times the size. */
function canEncodeWebp(): Promise<boolean> {
  webpSupport ??= (async () => {
    const c = document.createElement('canvas');
    c.width = c.height = 2;
    try {
      return (await toBlob(c, 'image/webp', 0.8)).type === 'image/webp';
    } catch {
      return false;
    }
  })();
  return webpSupport;
}

function scaled(src: HTMLCanvasElement, sx: number, sw: number, w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, sx, 0, sw, src.height, 0, 0, c.width, c.height);
  return c;
}

const release = (...canvases: HTMLCanvasElement[]) =>
  canvases.forEach((c) => {
    c.width = 0;
    c.height = 0;
  });

const SAFE_URL = /^(https?:|mailto:)/i;

async function destToPageIndex(doc: PdfDoc, dest: unknown): Promise<number | null> {
  try {
    const explicit = typeof dest === 'string' ? await doc.getDestination(dest) : dest;
    if (!Array.isArray(explicit) || explicit.length === 0) return null;
    const ref = explicit[0];
    if (typeof ref === 'number') return ref;
    if (ref && typeof ref === 'object') return await doc.getPageIndex(ref);
  } catch {
    /* broken destinations are common in exported PDFs */
  }
  return null;
}

export async function processPdf(
  doc: PdfDoc,
  opts: {
    splitSpreads: boolean;
    onProgress?: (p: ProcessProgress) => void;
    signal?: AbortSignal;
  }
): Promise<ProcessedIssue> {
  const webp = await canEncodeWebp();
  const type = webp ? 'image/webp' : 'image/jpeg';
  const ext = webp ? 'webp' : 'jpg';

  // First pass: which PDF pages become two reader pages.
  const halves: number[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const vp = (await doc.getPage(i)).getViewport({ scale: 1 });
    // A cover or back cover exported alone stays whole.
    halves.push(opts.splitSpreads && vp.width / vp.height > 1.2 ? 2 : 1);
  }
  const firstLogical: number[] = [];
  halves.reduce((acc, n, i) => ((firstLogical[i] = acc), acc + n), 0);
  const total = halves.reduce((a, b) => a + b, 0);

  const pages: ProcessedPage[] = [];
  let hasText = false;

  for (let i = 0; i < doc.numPages; i++) {
    if (opts.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');

    const page = await doc.getPage(i + 1);
    const base = page.getViewport({ scale: 1 });
    const parts = halves[i];
    const outW = base.width / parts;
    const long = Math.max(outW, base.height);

    let scale = HD_LONG / long;
    scale = Math.min(scale, Math.sqrt(MAX_AREA / (base.width * base.height)));
    const viewport = page.getViewport({ scale });

    const full = document.createElement('canvas');
    full.width = Math.round(viewport.width);
    full.height = Math.round(viewport.height);
    // 'print' renders straight through. The default 'display' intent waits
    // for an animation frame between chunks, and a background tab gets none —
    // an editor who switched tabs would find the pages had stopped preparing.
    await page.render({ canvas: full, viewport, intent: 'print' }).promise;

    // Links, in fractions of the whole PDF page.
    const links: (MagazineLink & { cx: number })[] = [];
    try {
      const annots = await page.getAnnotations({ intent: 'display' });
      for (const a of annots) {
        if (a.subtype !== 'Link' || !Array.isArray(a.rect)) continue;
        const [x1, y1, x2, y2] = a.rect as number[];
        const t = viewport.transform;
        const px = (x: number, y: number) => [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]];
        const [ax, ay] = px(x1, y1);
        const [bx, by] = px(x2, y2);
        const link: MagazineLink & { cx: number } = {
          x: Math.min(ax, bx) / viewport.width,
          y: Math.min(ay, by) / viewport.height,
          w: Math.abs(bx - ax) / viewport.width,
          h: Math.abs(by - ay) / viewport.height,
          cx: (ax + bx) / 2 / viewport.width,
        };
        const url = a.url ?? a.unsafeUrl;
        if (typeof url === 'string' && SAFE_URL.test(url)) link.url = url;
        else if (a.dest) {
          const idx = await destToPageIndex(doc, a.dest);
          if (idx !== null && idx < doc.numPages) link.page = firstLogical[idx];
        }
        if ((link.url || link.page !== undefined) && link.w > 0.002 && link.h > 0.002) links.push(link);
      }
    } catch {
      /* a page whose annotations fail to parse still renders */
    }

    // Text, split by which half of the sheet it sits on.
    const texts: string[] = Array.from({ length: parts }, () => '');
    try {
      const content = await page.getTextContent();
      const [vx0, , vx1] = page.view;
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const half = parts === 2 && item.transform[4] >= (vx0 + vx1) / 2 ? 1 : 0;
        texts[half] += item.str + (item.hasEOL ? '\n' : ' ');
      }
    } catch {
      /* scanned pages have no text layer */
    }

    for (let k = 0; k < parts; k++) {
      const sx = (full.width / parts) * k;
      const sw = full.width / parts;
      const hd = parts === 1 ? full : scaled(full, sx, sw, sw, full.height);
      const mdScale = Math.min(1, MD_LONG / Math.max(hd.width, hd.height));
      const md = scaled(hd, 0, hd.width, hd.width * mdScale, hd.height * mdScale);
      const th = scaled(md, 0, md.width, THUMB_W, (md.height * THUMB_W) / md.width);

      const [h, m, t] = await Promise.all([
        toBlob(hd, type, 0.8),
        toBlob(md, type, 0.84),
        toBlob(th, type, 0.72),
      ]);

      const pageLinks: MagazineLink[] = links
        .filter((l) => parts === 1 || (k === 0 ? l.cx < 0.5 : l.cx >= 0.5))
        .map(({ x, y, w, h, url, page }) => {
          const l: MagazineLink = { x, y, w, h, ...(url ? { url } : {}), ...(page !== undefined ? { page } : {}) };
          return parts === 1 ? l : { ...l, x: Math.max(0, (x - k * 0.5) * 2), w: w * 2 };
        });

      const text = texts[k].replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
      if (text) hasText = true;

      pages.push({
        meta: { w: md.width, h: md.height, ...(pageLinks.length ? { links: pageLinks } : {}) },
        images: { t, m, h },
        text,
      });

      release(md, th);
      if (hd !== full) release(hd);
      opts.onProgress?.({ done: pages.length, total });
    }

    release(full);
    page.cleanup();
    // Let the progress bar paint between pages.
    await new Promise((r) => setTimeout(r, 0));
  }

  const outline: MagazineOutlineItem[] = [];
  try {
    const raw = await doc.getOutline();
    const walk = async (items: typeof raw, depth: number): Promise<MagazineOutlineItem[]> => {
      const out: MagazineOutlineItem[] = [];
      for (const item of items ?? []) {
        const idx = await destToPageIndex(doc, item.dest);
        const children = depth < 2 && item.items?.length ? await walk(item.items, depth + 1) : [];
        if (idx === null || !item.title?.trim()) {
          out.push(...children);
          continue;
        }
        out.push({
          title: item.title.trim(),
          page: firstLogical[idx],
          ...(children.length ? { items: children } : {}),
        });
      }
      return out;
    };
    outline.push(...(await walk(raw, 0)));
  } catch {
    /* no bookmarks */
  }

  return { pages, outline, ext, hasText };
}
