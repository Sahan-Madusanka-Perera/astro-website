import { NextResponse } from 'next/server';
import { SITE } from '@/lib/site-location';
import { phaseOf } from '@/lib/moon';

/* ---------------------------------------------------------------------------
   Tonight's observing conditions over the club's own coordinates.

   Two free, keyless sources:
     · sunrise-sunset.org  → astronomical twilight, i.e. when it is properly
       dark rather than merely after sunset. That is the window that matters.
     · open-meteo.com      → hourly cloud cover across that window.

   The moon comes from lib/moon.ts, so the forecast and the glyphs on the page
   agree. Everything is returned as UTC ISO; the client formats to Colombo.
--------------------------------------------------------------------------- */

export const revalidate = 1800; // half an hour is plenty for a night forecast

type SunResult = {
  astronomical_twilight_begin: string;
  astronomical_twilight_end: string;
  sunset: string;
  sunrise: string;
};

async function sun(date: string): Promise<SunResult | null> {
  try {
    const r = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${SITE.lat}&lng=${SITE.lon}&date=${date}&formatted=0`,
      { next: { revalidate: 1800 } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    return j.status === 'OK' ? (j.results as SunResult) : null;
  } catch {
    return null;
  }
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);

  const [today, next, meteo] = await Promise.all([
    sun(isoDate(now)),
    sun(isoDate(tomorrow)),
    (async () => {
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${SITE.lat}&longitude=${SITE.lon}` +
            `&hourly=cloud_cover&timezone=UTC&forecast_days=2`,
          { next: { revalidate: 1800 } }
        );
        if (!r.ok) return null;
        return (await r.json()) as {
          hourly: { time: string[]; cloud_cover: number[] };
        };
      } catch {
        return null;
      }
    })(),
  ]);

  if (!today || !next) {
    return NextResponse.json({ message: 'Sky data unavailable' }, { status: 502 });
  }

  // The dark window: astronomical twilight ends tonight, begins again tomorrow.
  const darkStart = new Date(today.astronomical_twilight_end);
  const darkEnd = new Date(next.astronomical_twilight_begin);

  // Sample cloud cover hour by hour across that window.
  const samples: Array<{ t: string; cloud: number }> = [];
  if (meteo?.hourly) {
    const { time, cloud_cover } = meteo.hourly;
    for (let i = 0; i < time.length; i++) {
      const t = new Date(`${time[i]}Z`);
      if (t >= darkStart && t <= darkEnd) {
        samples.push({ t: t.toISOString(), cloud: cloud_cover[i] });
      }
    }
  }

  const mean = samples.length
    ? Math.round(samples.reduce((a, s) => a + s.cloud, 0) / samples.length)
    : null;

  // The clearest hour is the one worth telling someone about.
  const best = samples.length
    ? samples.reduce((a, s) => (s.cloud < a.cloud ? s : a))
    : null;

  const moon = phaseOf(now);

  /* A verdict in the club's own terms. Cloud decides whether to go at all;
     the moon decides what is worth pointing at once you are there. */
  let verdict: string;
  if (mean === null) verdict = 'Cloud forecast unavailable — check the sky yourself.';
  else if (mean < 25) verdict = 'Clear. Worth going out.';
  else if (mean < 55) verdict = 'Broken cloud. Worth a look between gaps.';
  else if (mean < 80) verdict = 'Mostly cloudy. Planets and the Moon only.';
  else verdict = 'Overcast. Not a night for it.';

  let moonNote: string | null = null;
  if (mean !== null && mean < 55) {
    if (moon.illumination > 0.65)
      moonNote = 'A bright moon will wash out anything faint.';
    else if (moon.illumination < 0.2)
      moonNote = 'Dark moon — the best of the month for deep sky.';
  }

  return NextResponse.json({
    site: { label: SITE.label, lat: SITE.lat, lon: SITE.lon, timeZone: SITE.timeZone },
    darkStart: darkStart.toISOString(),
    darkEnd: darkEnd.toISOString(),
    sunset: today.sunset,
    cloud: { mean, samples: samples.slice(0, 14), best },
    moon: {
      illumination: moon.illumination,
      name: moon.name,
      toNew: moon.toNew,
      p: moon.p,
    },
    verdict,
    moonNote,
  });
}
