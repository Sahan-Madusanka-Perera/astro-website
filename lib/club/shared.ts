/* Shared by the server routes and the admin screens. */

import type { BoardLayout, BoardLevel, BoardPerson } from '@/types/club';

export const CLUB_BUCKET = 'club';
export const CLUB_UPLOAD_FOLDERS = ['boards', 'members', 'planets'] as const;
export type ClubUploadFolder = (typeof CLUB_UPLOAD_FOLDERS)[number];

export const MISSING_CLUB_TABLES_MESSAGE =
  'The board and planet tables do not exist yet. Run db/boards-and-planets.sql in the Supabase SQL editor, then try again.';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

/** "Six", "Seven"… for headings; digits past twelve. */
export function countWord(n: number) {
  return WORDS[n] ?? String(n);
}

export function shortPlanetName(name: string) {
  return name.replace(/^Planet of\s+/i, '');
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^planet of\s+/, '')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Sorts "2025/26" before "2024/25". */
export function byYearDesc<T extends { year: string }>(a: T, b: T) {
  return b.year.localeCompare(a.year, undefined, { numeric: true });
}

/** Groups level and person rows into each board's ordered levels. */
export function levelsByBoard(levels: Omit<BoardLevel, 'people'>[], people: BoardPerson[]) {
  const map = new Map<string, BoardLevel[]>();
  for (const l of [...levels].sort((a, b) => a.position - b.position)) {
    const level: BoardLevel = {
      ...l,
      people: people.filter((p) => p.level_id === l.id).sort((a, b) => a.position - b.position),
    };
    map.set(l.board_id, [...(map.get(l.board_id) ?? []), level]);
  }
  return map;
}

/** Boards saved before layouts existed have no layout column: they show photos. */
export const layoutOf = (b: { layout?: string | null }): BoardLayout => (b.layout === 'hierarchy' ? 'hierarchy' : 'photos');

/** Splits a level's people into consecutive groups by team, keeping their order. */
export function groupByTeam<T extends { team: string }>(people: T[]): { team: string; people: T[] }[] {
  const groups: { team: string; people: T[] }[] = [];
  for (const p of people) {
    const last = groups[groups.length - 1];
    if (last && last.team === p.team) last.people.push(p);
    else groups.push({ team: p.team, people: [p] });
  }
  return groups;
}
