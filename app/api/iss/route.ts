import { NextResponse } from 'next/server';

/* Live position of the ISS. Free, keyless, and the figure on the hero's limb
   is drawn from it — which is what stops that figure being decoration. */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const r = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
      cache: 'no-store',
    });
    if (!r.ok) throw new Error('upstream');
    const j = await r.json();
    return NextResponse.json(
      {
        lat: j.latitude,
        lon: j.longitude,
        altitude: j.altitude,   // km
        velocity: j.velocity,   // km/h
        visibility: j.visibility, // 'daylight' | 'eclipsed'
        timestamp: j.timestamp,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ message: 'ISS position unavailable' }, { status: 502 });
  }
}
