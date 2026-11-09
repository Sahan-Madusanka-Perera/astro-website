'use client';

import Link from 'next/link';
import { Linkedin, Mail } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Avatar } from '@/components/people/Avatar';
import { groupByTeam } from '@/lib/club/shared';
import type { BoardLevel, ClubMember, ClubPlanet } from '@/types/club';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   A board year, level by level: advisors, the top board, the planet
   directors, the project heads… Each person carries their own portrait,
   name and position. People in a level who share a group (a project, say)
   sit together under its name. Edited in Admin → Boards.
--------------------------------------------------------------------------- */

interface Card {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  image: string;
  email?: string;
  linkedin?: string;
  href?: string;
}

function Person({ card, large }: { card: Card; large: boolean }) {
  return (
    <li className={cn('flex flex-col items-center text-center', large ? 'w-[9.25rem] sm:w-[13rem]' : 'w-[8.5rem] sm:w-[10.5rem]')}>
      <Avatar
        src={card.image || undefined}
        name={card.name}
        sizes={large ? '160px' : '112px'}
        className={cn(
          'shrink-0 shadow-[0_18px_50px_-18px_rgba(41,163,221,0.55)]',
          large ? 'h-28 w-28 sm:h-40 sm:w-40' : 'h-24 w-24 sm:h-28 sm:w-28'
        )}
      />
      <p className={cn('mt-4 font-medium leading-snug text-starlight', large ? 'text-[1.0625rem]' : 'text-[0.9375rem]')}>{card.name}</p>
      {card.title && <p className="label-chart mt-2 text-azure-glow">{card.title}</p>}
      {card.subtitle &&
        (card.href ? (
          <Link href={card.href} className="mt-1.5 text-[0.8125rem] leading-snug text-star-faint transition-colors hover:text-azure-glow">
            {card.subtitle}
          </Link>
        ) : (
          <p className="mt-1.5 text-[0.8125rem] leading-snug text-star-faint">{card.subtitle}</p>
        ))}
      {(card.email || card.linkedin) && (
        <div className="mt-2.5 flex gap-3">
          {card.email && (
            <a href={`mailto:${card.email}`} aria-label={`Email ${card.name}`} className="text-star-faint transition-colors hover:text-azure-glow">
              <Mail className="h-4 w-4" strokeWidth={1.6} />
            </a>
          )}
          {card.linkedin && (
            <a href={card.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${card.name} on LinkedIn`} className="text-star-faint transition-colors hover:text-azure-glow">
              <Linkedin className="h-4 w-4" strokeWidth={1.6} />
            </a>
          )}
        </div>
      )}
    </li>
  );
}

export function BoardHierarchy({
  levels,
  boardId,
  planets,
  members,
}: {
  levels: BoardLevel[];
  boardId: string;
  planets: ClubPlanet[];
  members: ClubMember[];
}) {
  // The directors level is filled from that year's planet teams, in planet order.
  const directors: Card[] = planets.flatMap((p) =>
    members
      .filter((m) => m.board_id === boardId && m.planet_id === p.id && m.role === 'director')
      .map((m) => ({
        id: m.id,
        name: m.name,
        title: 'Director',
        subtitle: p.name,
        image: m.image_url,
        email: m.email,
        linkedin: m.linkedin,
        href: `/planets/${p.slug}`,
      }))
  );

  const shown = levels
    .map((level) => ({
      level,
      groups:
        level.kind === 'planet_directors'
          ? [{ team: '', people: directors }]
          : groupByTeam(
              level.people.map((p) => ({
                id: p.id,
                name: p.name,
                title: p.title,
                subtitle: p.subtitle,
                image: p.image_url,
                email: p.email,
                linkedin: p.linkedin,
                team: p.team,
              }))
            ),
    }))
    .filter(({ groups }) => groups.some((g) => g.people.length > 0));

  return (
    <div className="mt-12 space-y-20 md:mt-16 md:space-y-28">
      {shown.map(({ level, groups }, i) => {
        const large = i < 2; // the first levels get the larger portraits
        const grouped = groups.some((g) => g.team);
        return (
          <section key={level.id} aria-labelledby={`level-${level.id}`}>
            <div className="rule-h" />
            <div className="mt-8 flex items-baseline gap-4">
              <span className="label-chart" data-numeric>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 id={`level-${level.id}`} className="display text-[clamp(1.6rem,3.6vw,2.25rem)]">
                {level.title}
              </h2>
            </div>

            {grouped ? (
              <div className="mt-10 flex flex-wrap justify-center gap-4 sm:gap-5">
                {groups.map((g, j) => (
                  <Reveal key={`${g.team}-${j}`} delay={j * 60} className="panel px-4 pb-7 pt-5 sm:px-6">
                    {g.team && <p className="label-chart text-center">{g.team}</p>}
                    <ul className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-8 sm:gap-x-6">
                      {g.people.map((c) => (
                        <Person key={c.id} card={c} large={large} />
                      ))}
                    </ul>
                  </Reveal>
                ))}
              </div>
            ) : (
              <Reveal>
                <ul className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-12">
                  {groups[0].people.map((c) => (
                    <Person key={c.id} card={c} large={large} />
                  ))}
                </ul>
              </Reveal>
            )}
          </section>
        );
      })}
    </div>
  );
}
