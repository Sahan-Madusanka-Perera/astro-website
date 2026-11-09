import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminRequest, unauthorized } from '@/lib/admin-auth';
import { DEFAULT_LEVELS, errorResponse, InputError, revalidateClub, text } from '@/lib/club/admin';
import { byYearDesc, layoutOf, UUID } from '@/lib/club/shared';

export const dynamic = 'force-dynamic';

/** Every board (drafts included) with what the list screen shows about it. */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const [boards, images, members, levels, people] = await Promise.all([
      supabaseAdmin.from('club_boards').select('*'),
      supabaseAdmin.from('club_board_images').select('board_id,url,position').order('position'),
      supabaseAdmin.from('club_members').select('board_id,role,image_url'),
      supabaseAdmin.from('club_board_levels').select('id,board_id,title,kind'),
      supabaseAdmin.from('club_board_people').select('board_id,image_url').order('position'),
    ]);
    const error = boards.error || images.error || members.error || levels.error || people.error;
    if (error) throw error;

    const list = (boards.data ?? [])
      .map((b) => {
        const imgs = (images.data ?? []).filter((i) => i.board_id === b.id);
        const team = (members.data ?? []).filter((m) => m.board_id === b.id);
        const ranks = (levels.data ?? []).filter((l) => l.board_id === b.id);
        const officials = (people.data ?? []).filter((p) => p.board_id === b.id);
        const layout = layoutOf(b);
        return {
          ...b,
          layout,
          cover: layout === 'photos' ? imgs[0]?.url ?? '' : '',
          faces: officials.map((p) => p.image_url).filter(Boolean).slice(0, 6),
          image_count: imgs.length,
          level_count: ranks.length,
          people_count: officials.length,
          director_count: team.filter((m) => m.role === 'director').length,
          manager_count: team.filter((m) => m.role === 'manager').length,
        };
      })
      .sort(byYearDesc);

    // Lets the "new year" form offer to reuse an earlier year's levels.
    const templates = list
      .filter((b) => b.level_count > 0)
      .map((b) => ({
        id: b.id,
        year: b.year,
        levels: (levels.data ?? []).filter((l) => l.board_id === b.id).map((l) => l.title),
      }));
    return NextResponse.json({ boards: list, templates });
  } catch (error) {
    return errorResponse(error, 'Could not load the boards.');
  }
}

/**
 * Starts a new year as a draft, so it can be filled in before it shows on the
 * site. Its levels (names only, no people) come from an earlier year, from
 * the default set, or it starts with none: { copyLevelsFrom: id | 'default' | 'none' }.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const year = text(body.year, 20);
    if (!year) throw new InputError('Enter the board year, e.g. 2026/27.');

    let levels: { title: string; kind: string }[] = [...DEFAULT_LEVELS];
    if (body.copyLevelsFrom === 'none') levels = [];
    else if (typeof body.copyLevelsFrom === 'string' && UUID.test(body.copyLevelsFrom)) {
      const { data, error } = await supabaseAdmin
        .from('club_board_levels')
        .select('title,kind')
        .eq('board_id', body.copyLevelsFrom)
        .order('position');
      if (error) throw error;
      levels = data ?? [];
    }

    const { data, error } = await supabaseAdmin
      .from('club_boards')
      .insert([{ year, note: text(body.note, 2000), is_published: false, is_current: false, layout: 'hierarchy' }])
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new InputError(`There is already a board for ${year}.`, 409);
      throw error;
    }
    if (levels.length) {
      const { error: levelError } = await supabaseAdmin
        .from('club_board_levels')
        .insert(levels.map((l, i) => ({ board_id: data.id, title: l.title, kind: l.kind, position: i + 1 })));
      if (levelError) throw levelError;
    }
    revalidateClub();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Could not create the board.');
  }
}
