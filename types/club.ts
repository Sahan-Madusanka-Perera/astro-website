/* Boards, planets and the people who run them — all editable from the admin.

   A planet is permanent (its slug is its URL). A board is one academic year.
   A member belongs to one planet *in one board year*, so each year can have
   its own directors and as many or as few managers as it needs. */

export type MemberRole = 'director' | 'manager';

export interface ClubPlanet {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  responsibilities: string[];
  position: number;
}

export interface ClubMember {
  id: string;
  board_id: string;
  planet_id: string;
  role: MemberRole;
  name: string;
  image_url: string;
  email: string;
  phone: string;
  linkedin: string;
  bio: string;
  position: number;
}

export interface BoardImage {
  id: string;
  board_id: string;
  url: string;
  title: string;
  caption: string;
  position: number;
}

export interface ClubBoard {
  id: string;
  year: string;
  note: string;
  is_current: boolean;
  is_published: boolean;
  images: BoardImage[];
}

/** One planet's people in one board year. */
export interface PlanetTeam {
  year: string;
  boardId: string;
  directors: ClubMember[];
  managers: ClubMember[];
}
