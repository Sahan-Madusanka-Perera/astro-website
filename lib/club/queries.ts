import { supabaseAdmin } from '@/lib/supabase/server';
import { isMissingTable } from '@/lib/admin-auth';
import { FALLBACK_BOARDS, FALLBACK_MEMBERS, FALLBACK_PLANETS } from '@/lib/planets-data';
import type { ClubBoard, ClubMember, ClubPlanet, PlanetTeam } from '@/types/club';
import { byYearDesc } from './shared';

/* Server-side reads for the public pages. Like the magazine, a missing table
   or an unreachable database never takes a page down: until the tables exist
   the site shows the fallback copy in lib/planets-data.ts. */

export interface ClubData {
  planets: ClubPlanet[];
  boards: ClubBoard[]; // published only, newest first
  members: ClubMember[]; // members of published boards
}

const FALLBACK: ClubData = { planets: FALLBACK_PLANETS, boards: FALLBACK_BOARDS, members: FALLBACK_MEMBERS };

export async function getClubData(): Promise<ClubData> {
  try {
    const [planets, boards, images, members] = await Promise.all([
      supabaseAdmin.from('club_planets').select('*').order('position'),
      supabaseAdmin.from('club_boards').select('*').eq('is_published', true),
      supabaseAdmin.from('club_board_images').select('*').order('position'),
      supabaseAdmin.from('club_members').select('*').order('position'),
    ]);
    const error = planets.error || boards.error || images.error || members.error;
    if (error) {
      if (!isMissingTable(error)) console.error('Error fetching boards and planets:', error);
      return FALLBACK;
    }

    const published = new Set((boards.data ?? []).map((b) => b.id as string));
    return {
      planets: (planets.data ?? []) as ClubPlanet[],
      boards: (boards.data ?? [])
        .map((b) => ({
          ...(b as Omit<ClubBoard, 'images'>),
          images: ((images.data ?? []) as ClubBoard['images']).filter((i) => i.board_id === b.id),
        }))
        .sort(byYearDesc),
      members: ((members.data ?? []) as ClubMember[]).filter((m) => published.has(m.board_id)),
    };
  } catch (error) {
    console.error('Error fetching boards and planets:', error);
    return FALLBACK;
  }
}

/** The board shown by default: the one marked current, else the newest. */
export function currentBoard(boards: ClubBoard[]): ClubBoard | null {
  return boards.find((b) => b.is_current) ?? boards[0] ?? null;
}

/** A planet's team for every published year it has people, newest first. */
export function teamsForPlanet(data: ClubData, planetId: string): PlanetTeam[] {
  return data.boards
    .map((b) => {
      const people = data.members.filter((m) => m.board_id === b.id && m.planet_id === planetId);
      return {
        year: b.year,
        boardId: b.id,
        directors: people.filter((m) => m.role === 'director'),
        managers: people.filter((m) => m.role === 'manager'),
      };
    })
    .filter((t) => t.directors.length + t.managers.length > 0);
}
