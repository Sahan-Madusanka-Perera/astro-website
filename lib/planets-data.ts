import type { ClubBoard, ClubMember, ClubPlanet } from '@/types/club';

/* ---------------------------------------------------------------------------
   Fallback content.

   Boards, planets and members now live in Supabase and are edited from the
   admin (Admin → Boards / Planets). This copy is only used when those tables
   don't exist yet — before db/boards-and-planets.sql has been run — so the
   public site never renders empty. It mirrors that file's seed data.
--------------------------------------------------------------------------- */

const P = (
  position: number,
  slug: string,
  name: string,
  icon: string,
  description: string,
  responsibilities: string[]
): ClubPlanet => ({ id: `fallback-${slug}`, slug, name, description, icon_url: icon, responsibilities, position });

export const FALLBACK_PLANETS: ClubPlanet[] = [
  P(1, 'education', 'Planet of Education', '/images/planet_of_education.png',
    'Fostering knowledge and learning through workshops, seminars, and educational programs.',
    ['Organize astronomy workshops and seminars', 'Conduct training sessions for members', 'Develop educational content and resources', 'Coordinate with academic institutions']),
  P(2, 'research', 'Planet of Research', '/images/planet_of_research.png',
    'Advancing astronomical research and fostering scientific curiosity among members.',
    ['Conduct astronomical research projects', 'Collaborate with research institutions', 'Publish research findings', 'Mentor students in research methodologies']),
  P(3, 'media-marketing', 'Planet of Media & Marketing', '/images/planet_of_media.png',
    'Managing club communications, social media presence, and promotional activities.',
    ['Manage social media accounts', 'Create promotional content', 'Design marketing materials', 'Handle public relations']),
  P(4, 'management-finance', 'Planet of Management & Finance', '/images/planet_of_management.png',
    'Overseeing financial operations, budgeting, and administrative management.',
    ['Manage club finances and budgets', 'Handle administrative tasks', 'Coordinate resource allocation', 'Maintain financial records']),
  P(5, 'observation', 'Planet of Observation', '/images/planet_of_observation.png',
    'Organizing stargazing sessions, telescope operations, and observational activities.',
    ['Organize stargazing events', 'Maintain and operate telescopes', 'Plan observation sessions', 'Document celestial observations']),
  P(6, 'organizing', 'Planet of Organizing', '/images/planet_of_organizing.png',
    'Planning and executing club events, trips, and various activities.',
    ['Plan and execute club events', 'Organize astronomy trips', 'Coordinate logistics for activities', 'Manage event registrations']),
];

const img = (board: string, position: number, url: string, title: string, caption: string) => ({
  id: `fallback-${board}-${position}`,
  board_id: `fallback-${board}`,
  url,
  title,
  caption,
  position,
});

export const FALLBACK_BOARDS: ClubBoard[] = [
  {
    id: 'fallback-2025',
    year: '2025/26',
    note: 'The current board. Elected at the annual general meeting and running the club through to the next.',
    is_current: true,
    is_published: true,
    images: [
      img('2025', 1, '/images/top_board.jpg', 'Top Board', 'President, secretary and treasurer'),
      img('2025', 2, '/images/board.jpg', 'Executive Board', 'Directors and managers of all six planets'),
    ],
  },
  {
    id: 'fallback-2024',
    year: '2024/25',
    note: 'The board that took the club through its busiest observation season to date.',
    is_current: false,
    is_published: true,
    images: [
      img('2024', 1, '/images/boards/2024_top_board.jpg', 'Top Board', 'President, secretary and treasurer'),
      img('2024', 2, '/images/boards/2024_board.jpg', 'Executive Board', 'Directors and managers of all six planets'),
    ],
  },
];

const M = (
  slug: string,
  role: ClubMember['role'],
  position: number,
  name: string,
  image_url: string,
  email: string,
  bio = ''
): ClubMember => ({
  id: `fallback-${slug}-${role}-${position}`,
  board_id: 'fallback-2025',
  planet_id: `fallback-${slug}`,
  role,
  name,
  image_url,
  email,
  phone: '',
  linkedin: '',
  bio,
  position,
});

export const FALLBACK_MEMBERS: ClubMember[] = [
  M('education', 'director', 1, 'Chamudi Kaushika', '/images/education_planet/chamudi.jpg', 'education.director@usjastro.lk', 'Leading the educational initiatives of the astronomy club.'),
  M('education', 'manager', 1, 'Pathmanadan Thashmidha', '/images/education_planet/pathmanadan.jpg', 'manager1.education@usjastro.lk'),
  M('education', 'manager', 2, 'Paboda Kaumadi', '/images/education_planet/paboda.jpg', 'manager2.education@usjastro.lk'),
  M('education', 'manager', 3, 'Nethmi Chamathka', '/images/education_planet/nethmi.jpeg', 'manager3.education@usjastro.lk'),
  M('research', 'director', 1, 'Raneesha Jayasena', '/images/research_planet/raneesha.jpg', 'research.director@usjastro.lk', 'Leading research initiatives and projects.'),
  M('research', 'manager', 1, 'Thilini Maduwanthi', '/images/research_planet/thilini.jpg', 'manager1.research@usjastro.lk'),
  M('research', 'manager', 2, 'Vishwa Sasintha', '/images/research_planet/vishwa.jpg', 'manager2.research@usjastro.lk'),
  M('research', 'manager', 3, 'Chirath Chamuditha', '/images/research_planet/chirath.png', 'manager3.research@usjastro.lk'),
  M('media-marketing', 'director', 1, 'Sahan Perera', '', 'media.director@usjastro.lk', 'Managing media relations and marketing strategies.'),
  M('media-marketing', 'manager', 1, 'Nethmi Bhayogya', '', 'manager1.media@usjastro.lk'),
  M('media-marketing', 'manager', 2, 'Chalusha', '', 'manager2.media@usjastro.lk'),
];
