/* Boards, planets and the people who run them — all editable from the admin.

   A board year is shown either as a hierarchy (ordered levels of people:
   advisors, top board, planet directors, project heads…) or, for older years,
   as group photos.

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

/** 'hierarchy': people level by level. 'photos': the older group-photo archive. */
export type BoardLayout = 'hierarchy' | 'photos';

/** 'planet_directors' shows the directors from that year's planet teams instead of its own people. */
export type LevelKind = 'people' | 'planet_directors';

/** One person in a board level — their own name, position and photo. */
export interface BoardPerson {
  id: string;
  level_id: string;
  board_id: string;
  name: string;
  title: string; // the position, e.g. "President"
  team: string; // optional group within the level, e.g. "SPERO Charity Project"
  subtitle: string; // optional line under the position
  image_url: string;
  email: string;
  linkedin: string;
  position: number;
}

export interface BoardLevel {
  id: string;
  board_id: string;
  title: string;
  kind: LevelKind;
  position: number;
  people: BoardPerson[];
}

export interface ClubBoard {
  id: string;
  year: string;
  note: string;
  is_current: boolean;
  is_published: boolean;
  layout: BoardLayout;
  images: BoardImage[];
  levels: BoardLevel[];
}

/** One planet's people in one board year. */
export interface PlanetTeam {
  year: string;
  boardId: string;
  directors: ClubMember[];
  managers: ClubMember[];
}
