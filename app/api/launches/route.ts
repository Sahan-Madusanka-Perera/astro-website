import { NextResponse } from 'next/server';

/* Upcoming orbital launches, from The Space Devs' Launch Library 2.
   Free and keyless; their rate limit is low, so this caches for 30 minutes. */

export const revalidate = 1800;

type LL2Launch = {
  id: string;
  name: string;
  net: string;
  status?: { abbrev?: string; name?: string };
  launch_service_provider?: { name?: string };
  pad?: { name?: string; location?: { name?: string } };
  mission?: { name?: string; description?: string; type?: string };
  image?: string | null;
};

/* LL2 returns legal entity names — "China Aerospace Science and Technology
   Corporation" — which wrap to three lines in a tracked mono label. These are
   the names people actually use. */
const PROVIDER_SHORT: Record<string, string> = {
  'China Aerospace Science and Technology Corporation': 'CASC',
  'Russian Federal Space Agency (ROSCOSMOS)': 'Roscosmos',
  'National Aeronautics and Space Administration': 'NASA',
  'European Space Agency': 'ESA',
  'Indian Space Research Organization': 'ISRO',
  'Japan Aerospace Exploration Agency': 'JAXA',
  'United Launch Alliance': 'ULA',
  'Rocket Lab': 'Rocket Lab',
  'Space Exploration Technologies Corp.': 'SpaceX',
};

function shortProvider(name?: string | null) {
  if (!name) return null;
  const hit = PROVIDER_SHORT[name];
  if (hit) return hit;
  // Drop a trailing parenthetical, then cap it.
  const stripped = name.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return stripped.length > 26 ? stripped.slice(0, 25).trimEnd() + '…' : stripped;
}

export async function GET() {
  try {
    const r = await fetch(
      'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=4&hide_recent_previous=true',
      { next: { revalidate: 1800 } }
    );
    if (!r.ok) throw new Error('upstream');
    const j = (await r.json()) as { results: LL2Launch[] };

    const launches = (j.results ?? []).map((l) => {
      // LL2 names read "Falcon 9 Block 5 | Starlink Group 12-4" — the vehicle
      // and the mission, which are worth showing as two separate things.
      const [vehicle, mission] = l.name.split('|').map((s) => s.trim());
      return {
        id: l.id,
        vehicle: vehicle || l.name,
        mission: mission || l.mission?.name || null,
        net: l.net,
        status: l.status?.abbrev || null,
        provider: shortProvider(l.launch_service_provider?.name),
        location: l.pad?.location?.name || null,
      };
    });

    return NextResponse.json({ launches });
  } catch {
    return NextResponse.json({ message: 'Launch schedule unavailable' }, { status: 502 });
  }
}
