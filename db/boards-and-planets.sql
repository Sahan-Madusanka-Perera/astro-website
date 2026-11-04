-- ---------------------------------------------------------------------------
-- Boards, planets and members for the admin panel.
--
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to run again: tables are created only if missing and the seed rows are
-- skipped when they already exist.
--
-- Seeds the data that used to be hard-coded in lib/planets-data.ts and
-- app/board/page.tsx, so the site looks the same right after running it.
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

create table if not exists public.club_planets (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  description      text not null default '',
  icon_url         text not null default '',
  responsibilities text[] not null default '{}',
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.club_boards (
  id           uuid primary key default gen_random_uuid(),
  year         text not null unique,          -- e.g. '2025/26'
  note         text not null default '',
  is_current   boolean not null default false,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- At most one board can be the current one.
create unique index if not exists club_boards_one_current on public.club_boards (is_current) where is_current;

create table if not exists public.club_board_images (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.club_boards (id) on delete cascade,
  url        text not null,
  title      text not null default '',
  caption    text not null default '',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists club_board_images_board on public.club_board_images (board_id, position);

create table if not exists public.club_members (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.club_boards (id) on delete cascade,
  planet_id  uuid not null references public.club_planets (id) on delete cascade,
  role       text not null check (role in ('director', 'manager')),
  name       text not null,
  image_url  text not null default '',
  email      text not null default '',
  phone      text not null default '',
  linkedin   text not null default '',
  bio        text not null default '',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists club_members_board_planet on public.club_members (board_id, planet_id, role, position);

-- The site reads and writes these through the server (service role key), so
-- the public anon key gets no access at all.
alter table public.club_planets      enable row level security;
alter table public.club_boards       enable row level security;
alter table public.club_board_images enable row level security;
alter table public.club_members      enable row level security;

-- ---------------------------------------------------------------------------
-- Seed: the existing planets, boards and 2025/26 teams.
-- ---------------------------------------------------------------------------

insert into public.club_planets (slug, name, description, icon_url, responsibilities, position) values
  ('education', 'Planet of Education',
   'Fostering knowledge and learning through workshops, seminars, and educational programs.',
   '/images/planet_of_education.png',
   array['Organize astronomy workshops and seminars','Conduct training sessions for members','Develop educational content and resources','Coordinate with academic institutions'], 1),
  ('research', 'Planet of Research',
   'Advancing astronomical research and fostering scientific curiosity among members.',
   '/images/planet_of_research.png',
   array['Conduct astronomical research projects','Collaborate with research institutions','Publish research findings','Mentor students in research methodologies'], 2),
  ('media-marketing', 'Planet of Media & Marketing',
   'Managing club communications, social media presence, and promotional activities.',
   '/images/planet_of_media.png',
   array['Manage social media accounts','Create promotional content','Design marketing materials','Handle public relations'], 3),
  ('management-finance', 'Planet of Management & Finance',
   'Overseeing financial operations, budgeting, and administrative management.',
   '/images/planet_of_management.png',
   array['Manage club finances and budgets','Handle administrative tasks','Coordinate resource allocation','Maintain financial records'], 4),
  ('observation', 'Planet of Observation',
   'Organizing stargazing sessions, telescope operations, and observational activities.',
   '/images/planet_of_observation.png',
   array['Organize stargazing events','Maintain and operate telescopes','Plan observation sessions','Document celestial observations'], 5),
  ('organizing', 'Planet of Organizing',
   'Planning and executing club events, trips, and various activities.',
   '/images/planet_of_organizing.png',
   array['Plan and execute club events','Organize astronomy trips','Coordinate logistics for activities','Manage event registrations'], 6)
on conflict (slug) do nothing;

insert into public.club_boards (year, note, is_current) values
  ('2025/26', 'The current board. Elected at the annual general meeting and running the club through to the next.', true),
  ('2024/25', 'The board that took the club through its busiest observation season to date.', false)
on conflict (year) do nothing;

insert into public.club_board_images (board_id, url, title, caption, position)
select b.id, v.url, v.title, v.caption, v.position
from (values
  ('2025/26', '/images/top_board.jpg',              'Top Board',       'President, secretary and treasurer',      1),
  ('2025/26', '/images/board.jpg',                  'Executive Board', 'Directors and managers of all six planets', 2),
  ('2024/25', '/images/boards/2024_top_board.jpg',  'Top Board',       'President, secretary and treasurer',      1),
  ('2024/25', '/images/boards/2024_board.jpg',      'Executive Board', 'Directors and managers of all six planets', 2)
) as v(year, url, title, caption, position)
join public.club_boards b on b.year = v.year
where not exists (select 1 from public.club_board_images i where i.board_id = b.id);

insert into public.club_members (board_id, planet_id, role, name, image_url, email, bio, position)
select b.id, p.id, v.role, v.name, v.image_url, v.email, v.bio, v.position
from (values
  ('education', 'director', 'Chamudi Kaushika',       '/images/education_planet/chamudi.jpg',     'education.director@usjastro.lk', 'Leading the educational initiatives of the astronomy club.', 1),
  ('education', 'manager',  'Pathmanadan Thashmidha', '/images/education_planet/pathmanadan.jpg', 'manager1.education@usjastro.lk', '', 1),
  ('education', 'manager',  'Paboda Kaumadi',         '/images/education_planet/paboda.jpg',      'manager2.education@usjastro.lk', '', 2),
  ('education', 'manager',  'Nethmi Chamathka',       '/images/education_planet/nethmi.jpeg',     'manager3.education@usjastro.lk', '', 3),
  ('research',  'director', 'Raneesha Jayasena',      '/images/research_planet/raneesha.jpg',     'research.director@usjastro.lk',  'Leading research initiatives and projects.', 1),
  ('research',  'manager',  'Thilini Maduwanthi',     '/images/research_planet/thilini.jpg',      'manager1.research@usjastro.lk',  '', 1),
  ('research',  'manager',  'Vishwa Sasintha',        '/images/research_planet/vishwa.jpg',       'manager2.research@usjastro.lk',  '', 2),
  ('research',  'manager',  'Chirath Chamuditha',     '/images/research_planet/chirath.png',      'manager3.research@usjastro.lk',  '', 3),
  ('media-marketing', 'director', 'Sahan Perera',     '', 'media.director@usjastro.lk',  'Managing media relations and marketing strategies.', 1),
  ('media-marketing', 'manager',  'Nethmi Bhayogya',  '', 'manager1.media@usjastro.lk',  '', 1),
  ('media-marketing', 'manager',  'Chalusha',         '', 'manager2.media@usjastro.lk',  '', 2)
) as v(slug, role, name, image_url, email, bio, position)
join public.club_planets p on p.slug = v.slug
join public.club_boards  b on b.year = '2025/26'
where not exists (select 1 from public.club_members m where m.board_id = b.id);
