import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdminRequest, unauthorized } from '@/lib/admin-auth';
import { cleanPerson, errorResponse, InputError, removeImages, revalidateClub, text } from '@/lib/club/admin';
import { levelsByBoard, UUID } from '@/lib/club/shared';
import type { BoardPerson, LevelKind } from '@/types/club';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Replaces a board's hierarchy with the full, ordered list from the editor:
 * { levels: [{ id?, title, kind, people: [{ id?, name, title, team, … }] }] }.
 * Levels and people that are left out are removed, along with photos nobody
 * uses any more. Any level can hold any number of people.
 */
export async function PUT(request: NextRequest, { params }: Ctx) {
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const { id: boardId } = await params;
    if (!UUID.test(boardId)) throw new InputError('Unknown board.', 404);
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.levels)) throw new InputError('Nothing to save.');
    if (body.levels.length > 20) throw new InputError('A board can have at most 20 levels.');

    const { data: board } = await supabaseAdmin.from('club_boards').select('id').eq('id', boardId).maybeSingle();
    if (!board) throw new InputError('Unknown board.', 404);

    const [{ data: oldLevels, error: e1 }, { data: oldPeople, error: e2 }] = await Promise.all([
      supabaseAdmin.from('club_board_levels').select('id').eq('board_id', boardId),
      supabaseAdmin.from('club_board_people').select('id,image_url').eq('board_id', boardId),
    ]);
    if (e1 || e2) throw e1 || e2;
    const levelIds = new Set((oldLevels ?? []).map((l) => l.id));
    const personIds = new Set((oldPeople ?? []).map((p) => p.id));

    let directorLevels = 0;
    const now = new Date().toISOString();
    const levels: { id: string; board_id: string; title: string; kind: LevelKind; position: number }[] = [];
    const people: Record<string, unknown>[] = [];

    (body.levels as Record<string, unknown>[]).forEach((input, i) => {
      const title = text(input?.title, 120);
      if (!title) throw new InputError(`Level ${i + 1} needs a name.`);
      const kind: LevelKind = input.kind === 'planet_directors' ? 'planet_directors' : 'people';
      if (kind === 'planet_directors' && ++directorLevels > 1) {
        throw new InputError('Only one level can show the planet directors.');
      }
      // Ids are only reused when they already belong to this board.
      const id = typeof input.id === 'string' && levelIds.has(input.id) ? input.id : crypto.randomUUID();
      levels.push({ id, board_id: boardId, title, kind, position: i + 1 });

      if (kind === 'people') {
        const list = Array.isArray(input.people) ? input.people.slice(0, 100) : [];
        list.forEach((p: unknown, j: number) => {
          const person = cleanPerson(p, j + 1, `“${title}”`);
          people.push({
            ...person,
            id: person.id && personIds.has(person.id) ? person.id : crypto.randomUUID(),
            level_id: id,
            board_id: boardId,
            updated_at: now,
          });
        });
      }
    });

    const keepLevels = new Set(levels.map((l) => l.id));
    const keepPeople = new Set(people.map((p) => p.id as string));
    const droppedPeople = (oldPeople ?? []).filter((p) => !keepPeople.has(p.id)).map((p) => p.id);
    const droppedLevels = (oldLevels ?? []).filter((l) => !keepLevels.has(l.id)).map((l) => l.id);

    if (droppedPeople.length) {
      const { error } = await supabaseAdmin.from('club_board_people').delete().in('id', droppedPeople);
      if (error) throw error;
    }
    if (droppedLevels.length) {
      const { error } = await supabaseAdmin.from('club_board_levels').delete().in('id', droppedLevels);
      if (error) throw error;
    }
    if (levels.length) {
      const { error } = await supabaseAdmin.from('club_board_levels').upsert(levels);
      if (error) throw error;
    }
    if (people.length) {
      const { error } = await supabaseAdmin.from('club_board_people').upsert(people);
      if (error) throw error;
    }

    const stillUsed = new Set(people.map((p) => p.image_url as string));
    await removeImages((oldPeople ?? []).map((p) => p.image_url).filter((u) => !stillUsed.has(u)));

    revalidateClub();
    const saved = levelsByBoard(levels, people as unknown as BoardPerson[]).get(boardId) ?? [];
    return NextResponse.json(saved);
  } catch (error) {
    return errorResponse(error, 'Could not save the board levels.');
  }
}
