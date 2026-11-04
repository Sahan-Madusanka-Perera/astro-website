import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminRequest, unauthorized } from '@/lib/admin-auth';
import { cleanMember, errorResponse, InputError, removeImages, revalidateClub } from '@/lib/club/admin';
import { UUID } from '@/lib/club/shared';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string; planetId: string }> };

/**
 * Replaces one planet's team for one board year with the full, ordered lists
 * sent by the editor — any number of directors and managers. People left out
 * are removed, along with portraits nobody uses any more.
 */
export async function PUT(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const { id: boardId, planetId } = await params;
    if (!UUID.test(boardId) || !UUID.test(planetId)) throw new InputError('Unknown board or planet.', 404);

    const body = await request.json().catch(() => null);
    if (!body) throw new InputError('Nothing to save.');
    const list = (v: unknown) => (Array.isArray(v) ? v.slice(0, 100) : []);

    const [{ data: planet }, { data: board }] = await Promise.all([
      supabaseAdmin.from('club_planets').select('id,name').eq('id', planetId).maybeSingle(),
      supabaseAdmin.from('club_boards').select('id').eq('id', boardId).maybeSingle(),
    ]);
    if (!planet || !board) throw new InputError('Unknown board or planet.', 404);

    const where = planet.name as string;
    const cleaned = [
      ...list(body.directors).map((m, i) => cleanMember(m, 'director', i + 1, where)),
      ...list(body.managers).map((m, i) => cleanMember(m, 'manager', i + 1, where)),
    ];

    const { data: before, error: readError } = await supabaseAdmin
      .from('club_members')
      .select('id,image_url')
      .eq('board_id', boardId)
      .eq('planet_id', planetId);
    if (readError) throw readError;
    const existingIds = new Set((before ?? []).map((m) => m.id));

    const now = new Date().toISOString();
    const rows = cleaned.map((m) => ({
      ...m,
      // An id is only reused if it already belongs to this planet in this year.
      id: m.id && existingIds.has(m.id) ? m.id : crypto.randomUUID(),
      board_id: boardId,
      planet_id: planetId,
      updated_at: now,
    }));

    const keep = new Set(rows.map((r) => r.id));
    const dropped = (before ?? []).filter((m) => !keep.has(m.id));
    if (dropped.length) {
      const { error } = await supabaseAdmin.from('club_members').delete().in('id', dropped.map((m) => m.id));
      if (error) throw error;
    }
    if (rows.length) {
      const { error } = await supabaseAdmin.from('club_members').upsert(rows);
      if (error) throw error;
    }

    const stillUsed = new Set(rows.map((r) => r.image_url));
    await removeImages((before ?? []).map((m) => m.image_url).filter((u) => !stillUsed.has(u)));

    revalidateClub();
    return NextResponse.json(rows);
  } catch (error) {
    return errorResponse(error, 'Could not save the team.');
  }
}
