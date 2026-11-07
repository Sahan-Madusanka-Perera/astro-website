/* ---------------------------------------------------------------------------
   NASA's Astronomy Picture of the Day, from two independent sources.

   1. The APOD API (api.nasa.gov). Clean JSON, but rate-limited per key — and
      DEMO_KEY is limited per *IP*, which on shared serverless hosts is shared
      with every other site using it, so it is often exhausted before we ask.
   2. The APOD page itself (apod.nasa.gov/apod/astropix.html). A static HTML
      page whose layout has barely changed since 1995, with no key and no rate
      limit. Used whenever the API fails, including the hours after NASA's day
      rolls over when the API has no entry for "today" yet.

   Nothing here touches Next.js caching; the route decides how long to keep a
   result. Every function throws on failure so a cache never stores a bad day.
--------------------------------------------------------------------------- */

export type ApodMedia = 'image' | 'video' | 'other';

export type Apod = {
  title: string;
  /** YYYY-MM-DD, NASA's (US Eastern) date */
  date: string;
  explanation: string;
  copyright: string | null;
  mediaType: ApodMedia;
  /** A still to show: the picture, or a video's thumbnail. */
  image: string | null;
  /** A directly playable video file (mp4/webm), when the entry is one. */
  video: string | null;
  /** Where clicking the entry goes. */
  link: string;
  source: 'api' | 'page';
};

const APOD_BASE = 'https://apod.nasa.gov/apod/';
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/* ── small helpers ─────────────────────────────────────────────────────── */

/** Resolve relative and protocol-relative URLs, and never serve http. */
export function absoluteUrl(u: string | null | undefined, base = APOD_BASE): string | null {
  if (!u) return null;
  try {
    const url = new URL(u.trim(), base);
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** The APOD page for a given date, e.g. ap261107.html. */
export function pageUrlFor(date: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return m ? `${APOD_BASE}ap${m[1].slice(2)}${m[2]}${m[3]}.html` : `${APOD_BASE}astropix.html`;
}

const isVideoFile = (u: string) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u);

function youtubeThumb(u: string): string | null {
  const m = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/i.exec(u);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  hellip: '…', deg: '°', times: '×', eacute: 'é', ouml: 'ö', uuml: 'ü',
};

export function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[e.toLowerCase()] ?? whole;
  });
}

/** HTML fragment → one line of readable text. */
export function textOf(html: string) {
  return decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?)])/g, '$1')
    .replace(/\(\s+/g, '(')
    .trim();
}

function srcIn(tagOrBlock: string) {
  const m = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(tagOrBlock);
  return m ? m[1] ?? m[2] ?? m[3] : null;
}

/* ── source 1: the API ─────────────────────────────────────────────────── */

type ApiEntry = {
  title?: string;
  date?: string;
  explanation?: string;
  copyright?: string;
  media_type?: string;
  url?: string;
  hdurl?: string;
  thumbnail_url?: string;
};

export function fromApi(j: ApiEntry): Apod {
  if (!j || !j.title || !j.date || !/^\d{4}-\d{2}-\d{2}$/.test(j.date)) {
    throw new Error('APOD API returned an incomplete entry');
  }
  const url = absoluteUrl(j.url);
  const page = pageUrlFor(j.date);
  const base = {
    title: j.title.trim(),
    date: j.date,
    explanation: (j.explanation ?? '').trim(),
    copyright: j.copyright?.replace(/\s+/g, ' ').trim() || null,
    source: 'api' as const,
  };

  if (j.media_type === 'image' && url) {
    /* `url` is the ~1200px web version and `hdurl` the original, which can be
       a 5000px multi-megabyte JPEG — display the former, link the latter. */
    return { ...base, mediaType: 'image', image: url, video: null, link: absoluteUrl(j.hdurl) ?? url };
  }

  if (j.media_type === 'video' && url) {
    const file = isVideoFile(url);
    return {
      ...base,
      mediaType: 'video',
      image: absoluteUrl(j.thumbnail_url) ?? youtubeThumb(url),
      video: file ? url : null,
      link: page,
    };
  }

  return {
    ...base,
    mediaType: 'other',
    image: absoluteUrl(j.thumbnail_url),
    video: null,
    link: page,
  };
}

async function get(url: string, timeoutMs: number) {
  return fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'user-agent': 'astro-club-site (APOD widget)' },
  });
}

export async function fetchFromApi(apiKey: string, timeoutMs = 8000): Promise<Apod> {
  const r = await get(
    `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(apiKey)}&thumbs=true`,
    timeoutMs
  );
  if (!r.ok) {
    throw new Error(
      r.status === 429
        ? `APOD API rate limit reached${apiKey === 'DEMO_KEY' ? ' (DEMO_KEY — set NASA_API_KEY)' : ''}`
        : `APOD API responded ${r.status}`
    );
  }
  return fromApi((await r.json()) as ApiEntry);
}

/* ── source 2: the page ────────────────────────────────────────────────── */

function parseDate(text: string): string | null {
  const m = /(\d{4})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\b/i.exec(text);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase()) + 1;
  return `${m[1]}-${String(month).padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

export function parseApodPage(html: string, pageUrl = `${APOD_BASE}astropix.html`): Apod {
  const titleTag = textOf(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');

  // Everything that describes the picture sits above "Explanation:".
  const explIdx = html.search(/Explanation\s*:?\s*<\/b>/i);
  const head = explIdx >= 0 ? html.slice(0, explIdx) : html;

  const date = parseDate(titleTag) ?? parseDate(textOf(head));
  if (!date) throw new Error('APOD page: no date found');

  // Title: the tag reads "APOD: 2026 November 7 - The Title".
  let title = /\d{4}\s+[A-Za-z]+\s+\d{1,2}\s*[-–—]\s*(.+)$/.exec(titleTag)?.[1]?.trim() ?? '';


  // The media: whichever of <video>, <iframe>, <img> appears first.
  const candidates: { at: number; kind: 'video' | 'iframe' | 'img'; src: string | null }[] = [];
  const video = /<video\b[\s\S]*?<\/video>/i.exec(head);
  if (video) candidates.push({ at: video.index, kind: 'video', src: srcIn(video[0]) });
  const iframe = /<iframe\b[^>]*>/i.exec(head);
  if (iframe) candidates.push({ at: iframe.index, kind: 'iframe', src: srcIn(iframe[0]) });
  const img = /<img\b[^>]*>/i.exec(head);
  if (img) candidates.push({ at: img.index, kind: 'img', src: srcIn(img[0]) });
  const media = candidates.filter((c) => c.src).sort((a, b) => a.at - b.at)[0];

  // Otherwise it is the first bold line in a <center> after the media.
  if (!title) {
    const bold = /<center>\s*<b>([\s\S]*?)<\/b>/i.exec(head.slice(media?.at ?? 0));
    title = bold ? textOf(bold[1]) : '';
  }
  if (!title) throw new Error('APOD page: no title found');

  let mediaType: ApodMedia = 'other';
  let image: string | null = null;
  let videoFile: string | null = null;
  let link = pageUrlFor(date);

  if (media?.kind === 'img') {
    image = absoluteUrl(media.src, pageUrl);
    // The picture is wrapped in a link to the full-size original.
    const before = head.slice(0, media.at);
    const wrap = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>\s*$/i.exec(before);
    const big = wrap ? absoluteUrl(wrap[1] ?? wrap[2] ?? wrap[3], pageUrl) : null;
    if (image) {
      mediaType = 'image';
      link = big && /\.(jpe?g|png|gif|webp|tiff?)(\?|$)/i.test(big) ? big : image;
    }
  } else if (media?.kind === 'video') {
    const src = absoluteUrl(media.src, pageUrl);
    mediaType = 'video';
    videoFile = src && isVideoFile(src) ? src : null;
    image = absoluteUrl(/\bposter\s*=\s*["']?([^"'\s>]+)/i.exec(video?.[0] ?? '')?.[1], pageUrl);
  } else if (media?.kind === 'iframe') {
    const src = absoluteUrl(media.src, pageUrl) ?? '';
    const isPlayer = /youtube|youtu\.be|vimeo/i.test(src);
    mediaType = isPlayer ? 'video' : 'other';
    image = youtubeThumb(src);
  }

  // Explanation: up to the footer ("Tomorrow's picture", the closing centre).
  let explanation = '';
  if (explIdx >= 0) {
    const rest = html.slice(explIdx).replace(/^Explanation\s*:?\s*<\/b>/i, '');
    const end = rest.search(/<p>\s*<center>|Tomorrow'?s picture|<\/body>/i);
    explanation = textOf(end >= 0 ? rest.slice(0, end) : rest);
  }

  // Credit line: "<b> Image Credit & <a>Copyright</a>: </b> Name </center>".
  const credit = /Credit[^<]*(?:<a\b[^>]*>[^<]*<\/a>[^<]*)?<\/b>([\s\S]*?)(?:<\/center>|<p>)/i.exec(head);
  const copyright = credit ? textOf(credit[1]) || null : null;

  return {
    title,
    date,
    explanation,
    copyright,
    mediaType,
    image,
    video: videoFile,
    link,
    source: 'page',
  };
}

export async function fetchFromPage(timeoutMs = 8000): Promise<Apod> {
  const url = `${APOD_BASE}astropix.html`;
  const r = await get(url, timeoutMs);
  if (!r.ok) throw new Error(`APOD page responded ${r.status}`);
  return parseApodPage(await r.text(), url);
}

/* ── both ──────────────────────────────────────────────────────────────── */

/** Today's entry from whichever source answers. Throws only if both fail. */
export async function loadApod(apiKey: string): Promise<Apod> {
  const problems: string[] = [];
  try {
    return await fetchFromApi(apiKey);
  } catch (e) {
    problems.push(e instanceof Error ? e.message : String(e));
  }
  try {
    return await fetchFromPage();
  } catch (e) {
    problems.push(e instanceof Error ? e.message : String(e));
  }
  throw new Error(problems.join('; '));
}
