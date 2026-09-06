import { NextResponse } from 'next/server';

/* ---------------------------------------------------------------------------
   NASA's Astronomy Picture of the Day.

   DEMO_KEY works but is rate-limited to roughly 30 requests an hour per IP,
   which a public site will exhaust. Get a free key in about thirty seconds at
   https://api.nasa.gov and put it in .env.local as NASA_API_KEY — no other
   change is needed. The route caches for an hour either way, so even DEMO_KEY
   survives light traffic.
--------------------------------------------------------------------------- */

export const revalidate = 3600;

export async function GET() {
  const key = process.env.NASA_API_KEY || 'DEMO_KEY';
  try {
    const r = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${key}&thumbs=true`,
      { next: { revalidate: 3600 } }
    );
    if (!r.ok) {
      return NextResponse.json(
        {
          message:
            r.status === 429
              ? 'NASA rate limit reached — add a free NASA_API_KEY to .env.local'
              : 'Picture of the day unavailable',
        },
        { status: 502 }
      );
    }
    const j = await r.json();

    /* APOD serves stills and videos; for a video the thumbnail is the image.
       `url` is the ~1200px web version and `hdurl` is the original, which can
       be a 5000px multi-megabyte JPEG — display the former, link the latter. */
    const image =
      j.media_type === 'image' ? j.url : j.thumbnail_url || null;

    return NextResponse.json({
      title: j.title as string,
      date: j.date as string,
      explanation: j.explanation as string,
      copyright: (j.copyright as string | undefined)?.trim() || null,
      mediaType: j.media_type as string,
      image,
      link: j.media_type === 'image' ? j.hdurl || j.url : j.url,
      usingDemoKey: key === 'DEMO_KEY',
    });
  } catch {
    return NextResponse.json({ message: 'Picture of the day unavailable' }, { status: 502 });
  }
}
