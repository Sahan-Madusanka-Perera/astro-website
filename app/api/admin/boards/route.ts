import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminRequest, unauthorized } from '@/lib/admin-auth';
import { errorResponse, InputError, revalidateClub, text } from '@/lib/club/admin';
import { byYearDesc } from '@/lib/club/shared';

export const dynamic = 'force-dynamic';

/** Every board (drafts included) with what the list screen shows about it. */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const [boards, images, members] = await Promise.all([
      supabaseAdmin.from('club_boards').select('*'),
      supabaseAdmin.from('club_board_images').select('board_id,url,position').order('position'),
      supabaseAdmin.from('club_members').select('board_id,role'),
    ]);
    const error = boards.error || images.error || members.error;
    if (error) throw error;

    const list = (boards.data ?? [])
      .map((b) => {
        const imgs = (images.data ?? []).filter((i) => i.board_id === b.id);
        const people = (members.data ?? []).filter((m) => m.board_id === b.id);
        return {
          ...b,
          cover: imgs[0]?.url ?? '',
          image_count: imgs.length,
          director_count: people.filter((m) => m.role === 'director').length,
          manager_count: people.filter((m) => m.role === 'manager').length,
        };
      })
      .sort(byYearDesc);
    return NextResponse.json(list);
  } catch (error) {
    return errorResponse(error, 'Could not load the boards.');
  }
}

/** Starts a new year. It begins as a draft so it can be filled in before it shows on the site. */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const body = await request.json().catch(() => ({}));
    const year = text(body.year, 20);
    if (!year) throw new InputError('Enter the board year, e.g. 2026/27.');

    const { data, error } = await supabaseAdmin
      .from('club_boards')
      .insert([{ year, note: text(body.note, 2000), is_published: false, is_current: false }])
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new InputError(`There is already a board for ${year}.`, 409);
      throw error;
    }
    revalidateClub();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Could not create the board.');
  }
}
