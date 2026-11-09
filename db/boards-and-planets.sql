-- ---------------------------------------------------------------------------
-- Boards, planets and members for the admin panel.
--
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to run again, and running the newest version upgrades a database set
-- up with an older one: tables and columns are only added when missing and
-- seed rows are skipped when they already exist. Nothing you have edited in
-- the admin is overwritten.
--
-- Seeds the planets, the 2024/25 board photos, and the 2025/26 board as a
-- hierarchy of levels (advisors, top board, planet directors, project heads).
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
  -- 'hierarchy': people shown level by level. 'photos': the older group-photo archive.
  layout       text not null default 'hierarchy' check (layout in ('hierarchy', 'photos')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Upgrade from the first version of this file, which had no layout: earlier
-- boards keep their photos, the current board moves to the hierarchy and its
-- two old group photos are dropped.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'club_boards' and column_name = 'layout'
  ) then
    alter table public.club_boards
      add column layout text not null default 'hierarchy' check (layout in ('hierarchy', 'photos'));
    update public.club_boards
      set layout = 'photos'
      where year < coalesce((select year from public.club_boards where is_current), '');
    delete from public.club_board_images i
      using public.club_boards b
      where i.board_id = b.id and b.layout = 'hierarchy'
        and i.url in ('/images/top_board.jpg', '/images/board.jpg');
  end if;
end $$;

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

-- A board's hierarchy: ordered levels, each with any number of people.
-- A 'planet_directors' level holds no people of its own: it shows the
-- directors set in that year's planet teams, so they are only entered once.
create table if not exists public.club_board_levels (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.club_boards (id) on delete cascade,
  title      text not null,
  kind       text not null default 'people' check (kind in ('people', 'planet_directors')),
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists club_board_levels_board on public.club_board_levels (board_id, position);

create table if not exists public.club_board_people (
  id         uuid primary key default gen_random_uuid(),
  level_id   uuid not null references public.club_board_levels (id) on delete cascade,
  board_id   uuid not null references public.club_boards (id) on delete cascade,
  name       text not null,
  title      text not null default '',  -- the position, e.g. 'President', 'Project Head'
  team       text not null default '',  -- optional group inside a level, e.g. 'SPERO Charity Project'
  subtitle   text not null default '',  -- optional line under the position, e.g. a department
  image_url  text not null default '',
  email      text not null default '',
  linkedin   text not null default '',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists club_board_people_level on public.club_board_people (level_id, position);

-- The site reads and writes these through the server (service role key), so
-- the public anon key gets no access at all.
alter table public.club_planets      enable row level security;
alter table public.club_boards       enable row level security;
alter table public.club_board_images enable row level security;
alter table public.club_members      enable row level security;
alter table public.club_board_levels enable row level security;
alter table public.club_board_people enable row level security;

-- ---------------------------------------------------------------------------
-- Seed: the existing planets, boards and 2025/26 teams.
-- ---------------------------------------------------------------------------

insert into public.club_planets (slug, name, description, icon_url, responsibilities, position) values
  ('education', 'Planet of Education',
   'Fostering knowledge and learning through workshops, seminars, and educational programs.',
   '/images/planet_of_education.png',
   array['Organizing educational projects related to astronomy','Carrying out those educational projects'], 1),
  ('research', 'Planet of Research',
   'Advancing astronomical research and fostering scientific curiosity among members.',
   '/images/planet_of_research.png',
   array['Organizing research projects related to astronomy'], 2),
  ('media-marketing', 'Planet of Media & Marketing',
   'Managing club communications, social media presence, and promotional activities.',
   '/images/planet_of_media.png',
   array['Overall media and marketing activities of the club''s projects'], 3),
  ('management-finance', 'Planet of Management & Finance',
   'Overseeing financial operations, budgeting, and administrative management.',
   '/images/planet_of_management.png',
   array['Overall human resource management of the club','Financial activities of the club''s projects','Fund-raising projects'], 4),
  ('observation', 'Planet of Observation',
   'Organizing stargazing sessions, telescope operations, and observational activities.',
   '/images/planet_of_observation.png',
   array['Planning and carrying out the club''s astronomy observation projects','Night camps','Observation sessions'], 5),
  ('organizing', 'Planet of Organizing',
   'Planning and executing club events, trips, and various activities.',
   '/images/planet_of_organizing.png',
   array['Planning and organizing the club''s projects','Supporting the other planet directors in organizing their projects'], 6)
on conflict (slug) do nothing;

insert into public.club_boards (year, note, is_current, layout) values
  ('2025/26', 'The current board. Elected at the annual general meeting and running the club through to the next.', true, 'hierarchy'),
  ('2024/25', 'The board that took the club through its busiest observation season to date.', false, 'photos')
on conflict (year) do nothing;

insert into public.club_board_images (board_id, url, title, caption, position)
select b.id, v.url, v.title, v.caption, v.position
from (values
  ('2024/25', '/images/boards/2024_top_board.jpg',  'Top Board',       'President, secretary and treasurer',      1),
  ('2024/25', '/images/boards/2024_board.jpg',      'Executive Board', 'Directors and managers of all six planets', 2)
) as v(year, url, title, caption, position)
join public.club_boards b on b.year = v.year
where not exists (select 1 from public.club_board_images i where i.board_id = b.id);

insert into public.club_members (board_id, planet_id, role, name, image_url, email, bio, position)
select b.id, p.id, v.role, v.name, v.image_url, v.email, v.bio, v.position
from (values
  ('education', 'director', 'Chamudi Kaushika',       '/images/education_planet/chamudi.jpg',     '', 'Leading the educational initiatives of the astronomy club.', 1),
  ('education', 'manager',  'Pathmanadan Thashmidha', '/images/education_planet/pathmanadan.jpg', '', '', 1),
  ('education', 'manager',  'Paboda Kaumadi',         '/images/education_planet/paboda.jpg',      '', '', 2),
  ('education', 'manager',  'Nethmi Chamathka',       '/images/education_planet/nethmi.jpeg',     '', '', 3),
  ('research',  'director', 'Raneesha Jayasena',      '/images/research_planet/raneesha.jpg',     '',  'Leading research initiatives and projects.', 1),
  ('research',  'manager',  'Thilini Maduwanthi',     '/images/research_planet/thilini.jpg',      '',  '', 1),
  ('research',  'manager',  'Vishwa Sasintha',        '/images/research_planet/vishwa.jpg',       '',  '', 2),
  ('research',  'manager',  'Chirath Chamuditha',     '/images/research_planet/chirath.png',      '',  '', 3),
  ('media-marketing', 'director', 'Sahan Perera',     '/images/boards/2025-26/sahan-perera.webp', '',  'Managing media relations and marketing strategies.', 1),
  ('media-marketing', 'manager',  'Nethmi Bhayogya',  '', '',  '', 1),
  ('media-marketing', 'manager',  'Chalusha',         '', '',  '', 2)
) as v(slug, role, name, image_url, email, bio, position)
join public.club_planets p on p.slug = v.slug
join public.club_boards  b on b.year = '2025/26'
where not exists (select 1 from public.club_members m where m.board_id = b.id);

-- 2025/26 planet directors who weren't in the first version of this file.
insert into public.club_members (board_id, planet_id, role, name, image_url, position)
select b.id, p.id, 'director', v.name, v.image_url, 1
from (values
  ('observation',        'Zenith Heavenly',  '/images/boards/2025-26/zenith-heavenly.webp'),
  ('organizing',         'Lakshika Hansini', '/images/boards/2025-26/lakshika-hansini.webp'),
  ('management-finance', 'Shashini Imasha',  '/images/boards/2025-26/shashini-imasha.webp')
) as v(slug, name, image_url)
join public.club_planets p on p.slug = v.slug
join public.club_boards  b on b.year = '2025/26'
where not exists (
  select 1 from public.club_members m where m.board_id = b.id and m.planet_id = p.id and m.role = 'director'
);

update public.club_members m
set image_url = '/images/boards/2025-26/sahan-perera.webp'
from public.club_boards b
where m.board_id = b.id and b.year = '2025/26' and m.role = 'director' and m.name = 'Sahan Perera' and m.image_url = '';

-- The 2025/26 hierarchy. The Senior Advisor is added from the admin.
insert into public.club_board_levels (board_id, title, kind, position)
select b.id, v.title, v.kind, v.position
from (values
  ('Advisory Panel',   'people',           1),
  ('Top Board',        'people',           2),
  ('Planet Directors', 'planet_directors', 3),
  ('Project Heads',    'people',           4)
) as v(title, kind, position)
join public.club_boards b on b.year = '2025/26'
where not exists (select 1 from public.club_board_levels l where l.board_id = b.id);

insert into public.club_board_people (level_id, board_id, name, title, team, subtitle, image_url, position)
select l.id, b.id, v.name, v.title, v.team, v.subtitle, '/images/boards/2025-26/' || v.photo || '.webp', v.position
from (values
  ('Advisory Panel', 'Dr. S. Kandeepan',        'Senior Treasurer',                      '', 'Senior Lecturer, Department of Physics, University of Sri Jayewardenepura', 's-kandeepan',         1),
  ('Advisory Panel', 'Dr. R.A.D.D. Dharmasiri', 'Academic and Inter-university Advisor', '', 'Senior Lecturer, Department of Physics, University of Sri Jayewardenepura', 'r-a-d-d-dharmasiri',  2),
  ('Top Board', 'Kulamini Amarathunge', 'President',        '', '', 'kulamini-amarathunge', 1),
  ('Top Board', 'Sanugi Thennakoon',    'Secretary',        '', '', 'sanugi-thennakoon',    2),
  ('Top Board', 'Shanaka Lakshan',      'Vice President',   '', '', 'shanaka-lakshan',      3),
  ('Top Board', 'Oshidi Maheshini',     'Vice Secretary',   '', '', 'oshidi-maheshini',     4),
  ('Top Board', 'Siluni Aponso',        'Junior Treasurer', '', '', 'siluni-aponso',        5),
  ('Top Board', 'Imasha Udani',         'Media Head',       '', '', 'imasha-udani',         6),
  ('Top Board', 'Kaushani Udara',       'Editor',           '', '', 'kaushani-udara',       7),
  ('Project Heads', 'Nuwani Supunsara',    'Project Head', 'Article Series',           '', 'nuwani-supunsara',    1),
  ('Project Heads', 'Tharushi Thambavita', 'Project Head', 'YouTube',                  '', 'tharushi-thambavita', 2),
  ('Project Heads', 'Hashini Malsha',      'Project Head', 'Social Media Post Series', '', 'hashini-malsha',      3),
  ('Project Heads', 'Dasuni Thathsarani',  'Project Head', 'Social Media Post Series', '', 'dasuni-thathsarani',  4),
  ('Project Heads', 'Shehani Arunika',     'Project Head', 'Event Post Series',        '', 'shehani-arunika',     5),
  ('Project Heads', 'Dumindu Hasaranga',   'Project Head', 'Event Post Series',        '', 'dumindu-hasaranga',   6),
  ('Project Heads', 'Erandi Disanayake',   'Project Head', 'SPERO Charity Project',    '', 'erandi-disanayake',   7),
  ('Project Heads', 'Achira Tharaka',      'Project Head', 'SPERO Charity Project',    '', 'achira-tharaka',      8),
  ('Project Heads', 'Sudheera Isuru',      'Project Head', 'SPERO Charity Project',    '', 'sudheera-isuru',      9)
) as v(level, name, title, team, subtitle, photo, position)
join public.club_boards b on b.year = '2025/26'
join public.club_board_levels l on l.board_id = b.id and l.title = v.level
where not exists (select 1 from public.club_board_people x where x.board_id = b.id);

-- The first version of this file seeded made-up addresses (…@usjastro.lk).
-- Clear any that are still there; addresses entered in the admin are kept.
update public.club_members set email = '' where email like '%@usjastro.lk';

-- Planet responsibilities from the club constitution (4th edition), for
-- databases seeded with the first version's placeholder lists. Lists edited
-- in the admin are left alone.
update public.club_planets set responsibilities = array['Organizing educational projects related to astronomy','Carrying out those educational projects']
  where slug = 'education' and responsibilities = array['Organize astronomy workshops and seminars','Conduct training sessions for members','Develop educational content and resources','Coordinate with academic institutions'];
update public.club_planets set responsibilities = array['Organizing research projects related to astronomy']
  where slug = 'research' and responsibilities = array['Conduct astronomical research projects','Collaborate with research institutions','Publish research findings','Mentor students in research methodologies'];
update public.club_planets set responsibilities = array['Overall media and marketing activities of the club''s projects']
  where slug = 'media-marketing' and responsibilities = array['Manage social media accounts','Create promotional content','Design marketing materials','Handle public relations'];
update public.club_planets set responsibilities = array['Overall human resource management of the club','Financial activities of the club''s projects','Fund-raising projects']
  where slug = 'management-finance' and responsibilities = array['Manage club finances and budgets','Handle administrative tasks','Coordinate resource allocation','Maintain financial records'];
update public.club_planets set responsibilities = array['Planning and carrying out the club''s astronomy observation projects','Night camps','Observation sessions']
  where slug = 'observation' and responsibilities = array['Organize stargazing events','Maintain and operate telescopes','Plan observation sessions','Document celestial observations'];
update public.club_planets set responsibilities = array['Planning and organizing the club''s projects','Supporting the other planet directors in organizing their projects']
  where slug = 'organizing' and responsibilities = array['Plan and execute club events','Organize astronomy trips','Coordinate logistics for activities','Manage event registrations'];
