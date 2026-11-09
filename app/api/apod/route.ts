import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { loadApod, type Apod } from '@/lib/apod';

/* ---------------------------------------------------------------------------
   NASA's Astronomy Picture of the Day, kept on screen even when NASA isn't.

   Set NASA_API_KEY in the hosting provider's environment variables (e.g.
   Vercel → Project → Settings → Environment Variables), not only in
   .env.local, which is never deployed. Free key: https://api.nasa.gov.
   Without one we fall back to DEMO_KEY, and when the API refuses we read the
   APOD page itself instead (see lib/apod.ts), so a key is a nicety rather
   than a requirement.

   Caching, and why it is done this way rather than `export const revalidate`:

   - A route with `revalidate` caches whatever it returns, error responses
     included — one bad hour of NASA replaced the picture with a 502 for an
     hour, and a failure at build time left the route uncached, so every
     visit hit NASA again and kept the rate limit exhausted.
   - `unstable_cache` stores only successful results (loadApod throws on
     failure), and when a refresh fails it keeps serving the last good entry.
     So once one day has loaded, the section never empties; it is at worst an
     hour or so behind.
   - Failures are remembered for a few minutes so a bad spell doesn't turn
     every page view into another request to NASA.
--------------------------------------------------------------------------- */

const REFRESH_SECONDS = 60 * 60;
const FAILURE_BACKOFF_MS = 5 * 60 * 1000;

// Per server instance: the last entry we served, and when we may next ask NASA.
let lastGood: Apod | null = null;
let retryAt = 0;

const getApod = unstable_cache(
  async () => {
    // Also throttles the background refreshes of a stale entry.
    if (Date.now() < retryAt) throw new Error('backing off after a recent failure');
    try {
      return await loadApod(process.env.NASA_API_KEY || 'DEMO_KEY');
    } catch (e) {
      retryAt = Date.now() + FAILURE_BACKOFF_MS;
      console.warn(`[apod] both sources failed: ${e instanceof Error ? e.message : e}`);
      throw e;
    }
  },
  ['nasa-apod', 'v3'],
  { revalidate: REFRESH_SECONDS, tags: ['nasa-apod'] }
);

function ok(apod: Apod, maxAge: number) {
  return NextResponse.json(apod, {
    headers: {
      'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    },
  });
}

function unavailable(message: string) {
  return NextResponse.json(
    { message },
    { status: 502, headers: { 'Cache-Control': 'public, s-maxage=300' } }
  );
}

export async function GET() {
  try {
    const apod = await getApod();
    lastGood = apod;
    return ok(apod, 30 * 60);
  } catch {
    return lastGood ? ok(lastGood, 300) : unavailable('Picture of the day unavailable');
  }
}
