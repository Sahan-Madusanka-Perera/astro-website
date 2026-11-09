import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminRequest, unauthorized } from '@/lib/admin-auth';
import { errorResponse, imageUrl, InputError, removeImages, revalidateClub, text } from '@/lib/club/admin';
import { layoutOf, levelsByBoard, UUID } from '@/lib/club/shared';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

async function boardId(params: Ctx['params']) {
  const { id } = await params;
  if (!UUID.test(id)) throw new InputError('Unknown board.', 404);
  return id;
}

/** The board with its photos and levels, every planet, and this year's members of every planet. */
export async function GET(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const id = await boardId(params);
    const [board, images, planets, members, levels, people] = await Promise.all([
      supabaseAdmin.from('club_boards').select('*').eq('id', id).maybeSingle(),
      supabaseAdmin.from('club_board_images').select('*').eq('board_id', id).order('position'),
      supabaseAdmin.from('club_planets').select('*').order('position'),
      supabaseAdmin.from('club_members').select('*').eq('board_id', id).order('position'),
      supabaseAdmin.from('club_board_levels').select('*').eq('board_id', id),
      supabaseAdmin.from('club_board_people').select('*').eq('board_id', id),
    ]);
    const error = board.error || images.error || planets.error || members.error || levels.error || people.error;
    if (error) throw error;
    if (!board.data) throw new InputError('Unknown board.', 404);
    return NextResponse.json({
      board: {
        ...board.data,
        layout: layoutOf(board.data),
        images: images.data ?? [],
        levels: levelsByBoard(levels.data ?? [], people.data ?? []).get(id) ?? [],
      },
      planets: planets.data ?? [],
      members: members.data ?? [],
    });
  } catch (error) {
    return errorResponse(error, 'Could not load the board.');
  }
}

/** Saves the year's details, how it is shown, and its full, ordered list of board photos. */
export async function PUT(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const id = await boardId(params);
    const body = await request.json().catch(() => null);
    if (!body) throw new InputError('Nothing to save.');

    const year = text(body.year, 20);
    if (!year) throw new InputError('The board needs a year, e.g. 2025/26.');
    const isCurrent = body.is_current === true;

    const incoming = (Array.isArray(body.images) ? body.images : []).slice(0, 100);
    const { data: before, error: readError } = await supabaseAdmin
      .from('club_board_images')
      .select('id,url')
      .eq('board_id', id);
    if (readError) throw readError;
    const existingIds = new Set((before ?? []).map((i) => i.id));

    const images = incoming.map((img: Record<string, unknown>, i: number) => {
      const url = imageUrl(img.url, `Photo ${i + 1}`);
      if (!url) throw new InputError(`Photo ${i + 1} has no image.`);
      return {
        id: typeof img.id === 'string' && existingIds.has(img.id) ? img.id : crypto.randomUUID(),
        board_id: id,
        url,
        title: text(img.title, 120),
        caption: text(img.caption, 300),
        position: i + 1,
      };
    });

    const { data: saved, error: boardError } = await supabaseAdmin
      .from('club_boards')
      .update({
        year,
        note: text(body.note, 2000),
        is_published: body.is_published === true,
        layout: body.layout === 'photos' ? 'photos' : 'hierarchy',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (boardError) {
      if (boardError.code === '23505') throw new InputError(`There is already a board for ${year}.`, 409);
      throw boardError;
    }
    if (!saved) throw new InputError('Unknown board.', 404);

    // Only one board can be current, so clear the flag elsewhere before setting it here.
    if (isCurrent && !saved.is_current) {
      const { error } = await supabaseAdmin.from('club_boards').update({ is_current: false }).eq('is_current', true);
      if (error) throw error;
    }
    if (isCurrent !== saved.is_current) {
      const { error } = await supabaseAdmin.from('club_boards').update({ is_current: isCurrent }).eq('id', id);
      if (error) throw error;
    }
    const board = { ...saved, is_current: isCurrent };

    const keep = new Set(images.map((i: { id: string }) => i.id));
    const dropped = (before ?? []).filter((i) => !keep.has(i.id));
    if (dropped.length) {
      const { error } = await supabaseAdmin.from('club_board_images').delete().in('id', dropped.map((i) => i.id));
      if (error) throw error;
    }
    if (images.length) {
      const { error } = await supabaseAdmin.from('club_board_images').upsert(images);
      if (error) throw error;
    }

    const stillUsed = new Set(images.map((i: { url: string }) => i.url));
    await removeImages((before ?? []).map((i) => i.url).filter((u) => !stillUsed.has(u)));

    revalidateClub();
    return NextResponse.json({ ...board, images });
  } catch (error) {
    return errorResponse(error, 'Could not save the board.');
  }
}

/** Deletes the year with its photos, its levels and people, and every member of every planet that year. */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const id = await boardId(params);
    const [images, members, people] = await Promise.all([
      supabaseAdmin.from('club_board_images').select('url').eq('board_id', id),
      supabaseAdmin.from('club_members').select('image_url').eq('board_id', id),
      supabaseAdmin.from('club_board_people').select('image_url').eq('board_id', id),
    ]);
    const { error } = await supabaseAdmin.from('club_boards').delete().eq('id', id);
    if (error) throw error;
    await removeImages([
      ...(images.data ?? []).map((i) => i.url),
      ...(members.data ?? []).map((m) => m.image_url),
      ...(people.data ?? []).map((p) => p.image_url),
    ]);
    revalidateClub();
    return NextResponse.json({ message: 'Board deleted' });
  } catch (error) {
    return errorResponse(error, 'Could not delete the board.');
  }
}
