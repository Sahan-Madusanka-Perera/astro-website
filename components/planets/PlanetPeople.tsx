'use client';

import { useState } from 'react';
import { Linkedin, Mail } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { Avatar } from '@/components/people/Avatar';
import type { ClubMember, PlanetTeam } from '@/types/club';
import { cn } from '@/lib/utils';

/* Who runs a planet, year by year. Opens on the current board's team; older
   years are one tap away. Teams come from Admin → Boards. */

function Director({ d }: { d: ClubMember }) {
  return (
    <div className="panel flex flex-col items-center gap-8 p-7 text-center sm:flex-row sm:items-start sm:gap-10 sm:p-9 sm:text-left">
      <Avatar
        src={d.image_url || undefined}
        name={d.name}
        sizes="176px"
        className="h-36 w-36 shrink-0 shadow-[0_18px_50px_-16px_rgba(41,163,221,0.6)] sm:h-44 sm:w-44"
      />
      <div className="min-w-0 flex-1">
        <p className="label-chart">Director</p>
        <h3 className="display mt-3 text-[clamp(1.4rem,3.2vw,2rem)]">{d.name}</h3>
        {d.bio && <p className="mt-4 max-w-[58ch] leading-[1.7] text-star-dim">{d.bio}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2.5 sm:justify-start">
          {d.email && (
            <a
              href={`mailto:${d.email}`}
              className="inline-flex items-center gap-2.5 rounded-full border border-rule-lit px-5 py-2.5 text-[0.875rem] text-star-dim transition-colors duration-500 hover:border-azure-lit/60 hover:text-starlight"
            >
              <Mail className="h-4 w-4" strokeWidth={1.6} />
              Email {d.name.split(' ')[0]}
            </a>
          )}
          {d.linkedin && (
            <a
              href={d.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full border border-rule-lit px-5 py-2.5 text-[0.875rem] text-star-dim transition-colors duration-500 hover:border-azure-lit/60 hover:text-starlight"
            >
              <Linkedin className="h-4 w-4" strokeWidth={1.6} />
              LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlanetPeople({ teams, initialYear }: { teams: PlanetTeam[]; initialYear?: string }) {
  const [year, setYear] = useState(initialYear ?? teams[0]?.year);
  const team = teams.find((t) => t.year === year) ?? teams[0];

  if (!team) {
    return <p className="mt-10 text-[1.0625rem] text-star-dim">This planet’s team will be announced soon.</p>;
  }

  return (
    <>
      {teams.length > 1 && (
        <div role="tablist" aria-label="Year" className="mt-8 flex flex-wrap gap-2">
          {teams.map((t) => (
            <button
              key={t.boardId}
              role="tab"
              aria-selected={t.year === team.year}
              onClick={() => setYear(t.year)}
              data-numeric
              className={cn(
                'rounded-full border px-4 py-2 text-[0.875rem] transition-colors duration-500',
                t.year === team.year ? 'border-azure-lit/60 bg-azure/16 text-starlight' : 'border-rule text-star-faint hover:border-rule-lit hover:text-star-dim'
              )}
            >
              {t.year}
            </button>
          ))}
        </div>
      )}

      {/* Directors — given the room the role deserves. */}
      <div className="mt-10 space-y-5" key={team.boardId}>
        {team.directors.map((d) => (
          <Reveal key={d.id}>
            <Director d={d} />
          </Reveal>
        ))}
      </div>

      {team.managers.length > 0 && (
        <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" key={`${team.boardId}-m`}>
          {team.managers.map((m, i) => (
            <Reveal as="li" key={m.id} delay={i * 65}>
              <div className="panel panel-lift flex h-full items-center gap-5 p-5">
                <Avatar src={m.image_url || undefined} name={m.name} sizes="80px" className="h-[4.5rem] w-[4.5rem] shrink-0" />
                <div className="min-w-0">
                  <p className="label-chart">Manager</p>
                  <h3 className="mt-2 text-[1.0625rem] font-medium leading-snug text-starlight">{m.name}</h3>
                  {(m.email || m.linkedin) && (
                    <div className="mt-2.5 flex gap-4">
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 text-[0.8125rem] text-azure-lit transition-colors hover:text-azure-glow">
                          <Mail className="h-3.5 w-3.5" strokeWidth={1.6} />
                          Contact
                        </a>
                      )}
                      {m.linkedin && (
                        <a
                          href={m.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[0.8125rem] text-azure-lit transition-colors hover:text-azure-glow"
                        >
                          <Linkedin className="h-3.5 w-3.5" strokeWidth={1.6} />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      )}
    </>
  );
}
