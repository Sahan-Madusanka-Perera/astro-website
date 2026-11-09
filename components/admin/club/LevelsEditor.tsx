'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, Users } from 'lucide-react';
import { Field, inputClass } from '@/components/admin/form-fields';
import { Avatar } from '@/components/people/Avatar';
import type { LevelKind } from '@/types/club';
import { cn } from '@/lib/utils';
import { ImagePicker, OrderControls, moveItem, pillButton, uid } from './ui';

/* ---------------------------------------------------------------------------
   A board year as a hierarchy: ordered levels (Advisory Panel, Top Board,
   Planet Directors, Project Heads…), each holding as many people as that year
   needs. Every person has their own name, position and photo.
--------------------------------------------------------------------------- */

export interface DraftPerson {
  id: string;
  name: string;
  title: string;
  team: string;
  subtitle: string;
  image_url: string;
  email: string;
  linkedin: string;
}

export interface DraftLevel {
  id: string;
  title: string;
  kind: LevelKind;
  people: DraftPerson[];
}

const POSITIONS = [
  'Senior Advisor',
  'Senior Treasurer',
  'Academic and Inter-university Advisor',
  'President',
  'Secretary',
  'Vice President',
  'Vice Secretary',
  'Junior Treasurer',
  'Media Head',
  'Editor',
  'Project Head',
];

const blankPerson = (title = '', team = ''): DraftPerson => ({
  id: uid(),
  name: '',
  title,
  team,
  subtitle: '',
  image_url: '',
  email: '',
  linkedin: '',
});

function PersonRow({
  person,
  index,
  count,
  teams,
  startOpen,
  onChange,
  onMove,
  onRemove,
}: {
  person: DraftPerson;
  index: number;
  count: number;
  teams: string[];
  startOpen: boolean;
  onChange: (p: DraftPerson) => void;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(startOpen);
  const set = (key: keyof DraftPerson) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...person, [key]: e.target.value });
  const fid = (k: string) => `${person.id}-${k}`;

  return (
    <li className="rounded-sm border border-rule bg-void-1">
      <div className="flex items-center gap-3 p-3">
        <Avatar key={person.image_url} src={person.image_url || undefined} name={person.name || '?'} className="h-11 w-11 shrink-0" sizes="44px" />
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className={cn('block truncate text-[0.9375rem]', person.name ? 'text-starlight' : 'italic text-destructive')}>
            {person.name || 'Name required'}
          </span>
          <span className="label-chart mt-1 block truncate">
            {person.title || 'No position'}
            {person.team && <span className="text-star-ghost"> / {person.team}</span>}
          </span>
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className={pillButton} aria-label={open ? 'Close details' : 'Edit details'}>
          {open ? 'Done' : 'Edit'}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </button>
        <OrderControls
          index={index}
          count={count}
          label={person.name || 'person'}
          onMove={onMove}
          onRemove={() => {
            if (!person.name || confirm(`Remove ${person.name}?`)) onRemove();
          }}
        />
      </div>

      {open && (
        <div className="flex flex-col gap-6 border-t border-rule p-4 sm:flex-row sm:p-5">
          <ImagePicker value={person.image_url} onChange={(image_url) => onChange({ ...person, image_url })} folder="members" label="Photo" round />
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name" htmlFor={fid('name')}>
              <input id={fid('name')} className={inputClass} value={person.name} onChange={set('name')} autoFocus={!person.name} placeholder="e.g. Kulamini Amarathunge" />
            </Field>
            <Field label="Position" htmlFor={fid('title')}>
              <input id={fid('title')} list="board-positions" className={inputClass} value={person.title} onChange={set('title')} placeholder="e.g. President" />
            </Field>
            <Field label="Group" htmlFor={fid('team')} hint="Optional. People with the same group are shown together — e.g. a project.">
              <input id={fid('team')} list={`${person.id}-teams`} className={inputClass} value={person.team} onChange={set('team')} placeholder="e.g. SPERO Charity Project" />
              <datalist id={`${person.id}-teams`}>
                {teams.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
            <Field label="Extra line" htmlFor={fid('subtitle')} hint="Optional. Shown under the position, e.g. a department.">
              <input id={fid('subtitle')} className={inputClass} value={person.subtitle} onChange={set('subtitle')} />
            </Field>
            <Field label="Email" htmlFor={fid('email')} hint="Optional.">
              <input id={fid('email')} type="email" className={inputClass} value={person.email} onChange={set('email')} />
            </Field>
            <Field label="LinkedIn" htmlFor={fid('linkedin')} hint="Optional.">
              <input id={fid('linkedin')} className={inputClass} value={person.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/…" />
            </Field>
          </div>
        </div>
      )}
    </li>
  );
}

function LevelCard({
  level,
  index,
  count,
  directors,
  startOpen,
  onChange,
  onMove,
  onRemove,
}: {
  level: DraftLevel;
  index: number;
  count: number;
  directors: { name: string; planet: string }[];
  startOpen: boolean;
  onChange: (l: DraftLevel) => void;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(startOpen);
  const [added, setAdded] = useState<Set<string>>(() => new Set());
  const teams = [...new Set(level.people.map((p) => p.team).filter(Boolean))];
  const people = level.kind === 'planet_directors' ? directors.length : level.people.length;

  const addPerson = () => {
    // A new seat usually repeats the one before it (the next Project Head, the next manager…).
    const last = level.people[level.people.length - 1];
    const p = blankPerson(last?.title ?? '', '');
    setAdded((s) => new Set(s).add(p.id));
    onChange({ ...level, people: [...level.people, p] });
  };

  return (
    <li className="rounded-sm border border-rule bg-void">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span className="label-chart grid h-9 w-9 shrink-0 place-items-center rounded-full border border-rule-lit" data-numeric>
          {index + 1}
        </span>
        <input
          aria-label={`Name of level ${index + 1}`}
          className={cn(inputClass, 'min-w-[10rem] flex-1 sm:max-w-xs')}
          value={level.title}
          onChange={(e) => onChange({ ...level, title: e.target.value })}
          placeholder="Level name, e.g. Top Board"
        />
        <span className="label-chart" data-numeric>
          {people} {people === 1 ? 'person' : 'people'}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={pillButton}>
            {open ? 'Close' : 'Manage'}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </button>
          <OrderControls
            index={index}
            count={count}
            label={level.title || `level ${index + 1}`}
            onMove={onMove}
            onRemove={() => {
              const n = level.people.length;
              if (!n || confirm(`Delete “${level.title}” and the ${n} ${n === 1 ? 'person' : 'people'} in it?`)) onRemove();
            }}
          />
        </span>
      </div>

      {open && (
        <div className="border-t border-rule p-4 sm:p-5">
          {level.kind === 'planet_directors' ? (
            <div className="note">
              <p>
                This level shows each planet’s directors from <strong className="text-star-dim">Planet teams</strong> below, so they’re only entered once.
              </p>
              {directors.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {directors.map((d) => (
                    <li key={d.name + d.planet} className="rounded-full border border-rule px-3 py-1.5 text-[0.8125rem] text-star-dim">
                      {d.name} <span className="text-star-ghost">· {d.planet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sodium">No directors set for this year yet.</p>
              )}
            </div>
          ) : (
            <>
              {level.people.length === 0 ? (
                <p className="note rounded-sm border border-dashed border-rule px-4 py-5 text-center">Nobody in this level yet.</p>
              ) : (
                <ul className="space-y-2">
                  {level.people.map((p, i) => (
                    <PersonRow
                      key={p.id}
                      person={p}
                      index={i}
                      count={level.people.length}
                      teams={teams}
                      startOpen={added.has(p.id)}
                      onChange={(next) => onChange({ ...level, people: level.people.map((x) => (x.id === p.id ? next : x)) })}
                      onMove={(from, to) => onChange({ ...level, people: moveItem(level.people, from, to) })}
                      onRemove={() => onChange({ ...level, people: level.people.filter((x) => x.id !== p.id) })}
                    />
                  ))}
                </ul>
              )}
              <button type="button" className={cn(pillButton, 'mt-3')} onClick={addPerson}>
                <Plus className="h-3.5 w-3.5" /> Add person
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

export function LevelsEditor({
  levels,
  onChange,
  directors,
}: {
  levels: DraftLevel[];
  onChange: (levels: DraftLevel[]) => void;
  directors: { name: string; planet: string }[];
}) {
  const [added, setAdded] = useState<Set<string>>(() => new Set());
  const hasDirectors = levels.some((l) => l.kind === 'planet_directors');

  const add = (kind: LevelKind) => {
    const l: DraftLevel = { id: uid(), title: kind === 'planet_directors' ? 'Planet Directors' : '', kind, people: [] };
    setAdded((s) => new Set(s).add(l.id));
    onChange([...levels, l]);
  };

  return (
    <div>
      <datalist id="board-positions">
        {POSITIONS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      {levels.length === 0 ? (
        <div className="flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-10 text-center">
          <Users className="h-6 w-6 text-star-ghost" strokeWidth={1.5} />
          <p className="note mt-3">No levels yet. Add the first one below.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {levels.map((l, i) => (
            <LevelCard
              key={l.id}
              level={l}
              index={i}
              count={levels.length}
              directors={directors}
              startOpen={added.has(l.id)}
              onChange={(next) => onChange(levels.map((x) => (x.id === l.id ? next : x)))}
              onMove={(from, to) => onChange(moveItem(levels, from, to))}
              onRemove={() => onChange(levels.filter((x) => x.id !== l.id))}
            />
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={pillButton} onClick={() => add('people')}>
          <Plus className="h-3.5 w-3.5" /> Add level
        </button>
        {!hasDirectors && (
          <button type="button" className={pillButton} onClick={() => add('planet_directors')}>
            <Plus className="h-3.5 w-3.5" /> Add planet directors level
          </button>
        )}
      </div>
      <p className="note mt-3">
        Planet managers stay with their planets in <span className="text-star-dim">Planet teams</span> and on each{' '}
        <Link href="/admin/planets" className="text-azure-lit hover:text-azure-glow">
          planet
        </Link>
        ’s page.
      </p>
    </div>
  );
}
