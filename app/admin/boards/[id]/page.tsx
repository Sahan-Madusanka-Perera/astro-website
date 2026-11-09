'use client';

import Link from 'next/link';
import Image from 'next/image';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Check, Field, inputClass } from '@/components/admin/form-fields';
import { BoardPhotos, type DraftImage } from '@/components/admin/club/BoardPhotos';
import { MemberList, type DraftMember } from '@/components/admin/club/MemberList';
import { LevelsEditor, type DraftLevel } from '@/components/admin/club/LevelsEditor';
import { UploadTracker, pillButton, primaryButton, useUploads } from '@/components/admin/club/ui';
import { shortPlanetName } from '@/lib/club/shared';
import type { BoardLayout, BoardLevel, ClubBoard, ClubMember, ClubPlanet } from '@/types/club';
import { cn } from '@/lib/utils';

interface Details {
  year: string;
  note: string;
  is_current: boolean;
  is_published: boolean;
  layout: BoardLayout;
  images: DraftImage[];
}
interface Team {
  directors: DraftMember[];
  managers: DraftMember[];
}
type Teams = Record<string, Team>;

const toDraft = (m: ClubMember): DraftMember => ({
  id: m.id,
  name: m.name,
  image_url: m.image_url,
  email: m.email,
  phone: m.phone,
  linkedin: m.linkedin,
  bio: m.bio,
});

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const toDetails = (board: ClubBoard): Details => ({
  year: board.year,
  note: board.note,
  is_current: board.is_current,
  is_published: board.is_published,
  layout: board.layout,
  images: board.images.map(({ id, url, title, caption }) => ({ id, url, title, caption })),
});

const toLevels = (levels: BoardLevel[]): DraftLevel[] =>
  levels.map((l) => ({
    id: l.id,
    title: l.title,
    kind: l.kind,
    people: l.people.map(({ id, name, title, team, subtitle, image_url, email, linkedin }) => ({
      id,
      name,
      title,
      team,
      subtitle,
      image_url,
      email,
      linkedin,
    })),
  }));

interface Saved {
  details: Details;
  teams: Teams;
  levels: DraftLevel[];
}

function Section({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-rule bg-void-1 p-5 sm:p-6">
      <h2 className="text-[1.125rem] font-medium text-starlight">{title}</h2>
      {lede && <p className="note mt-1.5 max-w-[70ch]">{lede}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function PlanetTeam({
  planet,
  team,
  dirty,
  onChange,
}: {
  planet: ClubPlanet;
  team: Team;
  dirty: boolean;
  onChange: (t: Team) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-sm border border-rule bg-void">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-4 p-4 text-left">
        <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-full bg-void-2 ring-1 ring-white/10">
          {planet.icon_url && <Image src={planet.icon_url} alt="" fill sizes="44px" className="object-cover" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-medium text-starlight">{shortPlanetName(planet.name)}</span>
          <span className="label-chart mt-1 block" data-numeric>
            {team.directors.length} {team.directors.length === 1 ? 'director' : 'directors'}
            <span className="mx-1.5 text-star-ghost">/</span>
            {team.managers.length} {team.managers.length === 1 ? 'manager' : 'managers'}
            {dirty && <span className="ml-2 text-sodium">• unsaved</span>}
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-star-faint transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="space-y-6 border-t border-rule p-4 sm:p-5">
          <MemberList role="director" members={team.directors} onChange={(directors) => onChange({ ...team, directors })} />
          <MemberList role="manager" members={team.managers} onChange={(managers) => onChange({ ...team, managers })} />
        </div>
      )}
    </li>
  );
}

function Editor({ id, initial, planets }: { id: string; initial: Saved; planets: ClubPlanet[] }) {
  const { pending } = useUploads();
  const [details, setDetails] = useState(initial.details);
  const [teams, setTeams] = useState(initial.teams);
  const [levels, setLevels] = useState(initial.levels);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const detailsDirty = !same(details, saved.details);
  const dirtyPlanets = useMemo(() => planets.filter((p) => !same(teams[p.id], saved.teams[p.id])).map((p) => p.id), [planets, teams, saved]);
  const levelsDirty = !same(levels, saved.levels);
  const dirty = detailsDirty || levelsDirty || dirtyPlanets.length > 0;
  const set = <K extends keyof Details>(key: K, value: Details[K]) => setDetails((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = useCallback(async () => {
    setSaving(true);
    setError('');
    const put = async (url: string, body: unknown) => {
      const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('Your session has ended. Sign in again in another tab, then save.');
      if (!res.ok) throw new Error(json.message || 'Could not save.');
      return json;
    };
    let next = saved;
    try {
      if (detailsDirty) {
        const board = (await put(`/api/admin/boards/${id}`, details)) as ClubBoard;
        const saveDetails = toDetails({ ...board, layout: board.layout ?? details.layout });
        next = { ...next, details: saveDetails };
        setDetails(saveDetails);
      }
      if (levelsDirty) {
        const saveLevels = toLevels((await put(`/api/admin/boards/${id}/levels`, { levels })) as BoardLevel[]);
        next = { ...next, levels: saveLevels };
        setLevels(saveLevels);
      }
      for (const planetId of dirtyPlanets) {
        const rows = (await put(`/api/admin/boards/${id}/team/${planetId}`, teams[planetId])) as ClubMember[];
        const team = {
          directors: rows.filter((r) => r.role === 'director').map(toDraft),
          managers: rows.filter((r) => r.role === 'manager').map(toDraft),
        };
        next = { ...next, teams: { ...next.teams, [planetId]: team } };
        setTeams((t) => ({ ...t, [planetId]: team }));
      }
      toast.success('Saved');
    } catch (err) {
      setError((err as Error).message);
      toast.error((err as Error).message);
    } finally {
      setSaved(next); // whatever made it through is saved, even if a later part failed
      setSaving(false);
    }
  }, [id, details, teams, levels, saved, detailsDirty, levelsDirty, dirtyPlanets]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (dirty && !saving && !pending) void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, saving, pending, save]);

  const people = Object.values(teams).reduce((n, t) => n + t.directors.length + t.managers.length, 0);
  const officials = levels.reduce((n, l) => n + l.people.length, 0);
  // The planet directors level shows whatever is in the planet teams right now, saved or not.
  const directors = planets.flatMap((p) =>
    (teams[p.id]?.directors ?? []).filter((d) => d.name).map((d) => ({ name: d.name, planet: shortPlanetName(p.name) }))
  );

  return (
    <div className="pb-6">
      <Link href="/admin/boards" className="group inline-flex items-center gap-2 text-[0.875rem] text-star-faint transition-colors hover:text-azure-glow">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        All boards
      </Link>
      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.875rem]" data-numeric>
            Board {saved.details.year}
          </h1>
          <p className="label-chart mt-2.5" data-numeric>
            {details.layout === 'hierarchy' ? `${levels.length} levels, ${officials} people` : `${details.images.length} photos`}
            <span className="mx-1.5 text-star-ghost">/</span>
            {people} in planet teams
            <span className="mx-1.5 text-star-ghost">/</span>
            <span className={saved.details.is_published ? 'text-azure-glow' : 'text-sodium'}>{saved.details.is_published ? 'Published' : 'Draft'}</span>
          </p>
        </div>
        {saved.details.is_published && (
          <a href="/board" target="_blank" rel="noopener noreferrer" className={pillButton}>
            View on site <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </header>

      <div className="mt-8 space-y-6">
        <Section title="Year details">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label="Year" htmlFor="year" hint="Shown on the year switcher, e.g. 2025/26.">
              <input id="year" className={inputClass} value={details.year} onChange={(e) => set('year', e.target.value)} />
            </Field>
            <Field label="Note" htmlFor="note" className="md:col-span-2" hint="Optional. A line or two shown at the top of this year.">
              <textarea id="note" rows={2} className={cn(inputClass, 'resize-y')} value={details.note} onChange={(e) => set('note', e.target.value)} />
            </Field>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Check
              id="published"
              label="Published"
              description="Shown on the Board page and the planet pages."
              checked={details.is_published}
              onChange={(e) => set('is_published', e.target.checked)}
            />
            <Check
              id="current"
              label="Current board"
              description="Opens first on the Board page, and its teams are the ones shown on the home page and planet pages."
              checked={details.is_current}
              onChange={(e) => set('is_current', e.target.checked)}
            />
          </div>
          <fieldset className="mt-5">
            <legend className="label-chart">How this year is shown</legend>
            <div className="mt-2.5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {(
                [
                  ['hierarchy', 'Hierarchy', 'Level by level — advisors, top board, directors, project heads — each person with their own photo.'],
                  ['photos', 'Group photos', 'The older archive style: one or more group photographs.'],
                ] as const
              ).map(([value, label, description]) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3.5 rounded-sm border p-4 transition-colors duration-300',
                    details.layout === value ? 'border-azure-lit/60 bg-azure/[0.07]' : 'border-rule hover:border-rule-lit'
                  )}
                >
                  <input
                    type="radio"
                    name="layout"
                    value={value}
                    checked={details.layout === value}
                    onChange={() => set('layout', value)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-azure)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[0.9375rem] leading-snug text-starlight">{label}</span>
                    <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-star-faint">{description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Section>

        {details.layout === 'hierarchy' ? (
          <Section
            title="Board hierarchy"
            lede="The levels shown on the Board page, top to bottom. Add, rename, reorder or remove levels, and put as many people in each as this year needs."
          >
            <LevelsEditor levels={levels} onChange={setLevels} directors={directors} />
          </Section>
        ) : (
          <Section title="Board photos" lede="Top board, executive board, or any other group photos for this year — as many as you like.">
            <BoardPhotos images={details.images} onChange={(images) => set('images', images)} />
          </Section>
        )}

        <Section
          title="Planet teams"
          lede="This year’s directors and managers for each planet. Add, remove or reorder people freely — the number of managers can be different every year."
        >
          {planets.length === 0 ? (
            <p className="note">
              No planets yet. <Link href="/admin/planets" className="text-azure-lit hover:text-azure-glow">Add planets</Link> first.
            </p>
          ) : (
            <ul className="space-y-3">
              {planets.map((p) => (
                <PlanetTeam
                  key={p.id}
                  planet={p}
                  team={teams[p.id]}
                  dirty={dirtyPlanets.includes(p.id)}
                  onChange={(t) => setTeams((all) => ({ ...all, [p.id]: t }))}
                />
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="sticky bottom-0 z-20 -mx-5 mt-8 border-t border-rule bg-void/95 px-5 py-3.5 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={cn('text-[0.875rem]', error ? 'text-destructive' : dirty ? 'text-sodium' : 'text-star-faint')} role="status">
            {pending > 0 ? `Uploading ${pending} photo${pending > 1 ? 's' : ''}…` : error || (dirty ? 'You have unsaved changes.' : 'Everything is saved.')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={pillButton}
              disabled={!dirty || saving}
              onClick={() => {
                if (!confirm('Discard all unsaved changes?')) return;
                setDetails(saved.details);
                setTeams(saved.teams);
                setLevels(saved.levels);
                setError('');
              }}
            >
              Discard
            </button>
            <button type="button" className={primaryButton} disabled={!dirty || saving || pending > 0} onClick={() => void save()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<(Saved & { planets: ClubPlanet[] }) | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/boards/${id}`, { cache: 'no-store' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message || 'Could not load the board.');
        const board = body.board as ClubBoard;
        const members = body.members as ClubMember[];
        const planets = body.planets as ClubPlanet[];
        const teams: Teams = {};
        for (const p of planets) {
          const mine = members.filter((m) => m.planet_id === p.id);
          teams[p.id] = {
            directors: mine.filter((m) => m.role === 'director').map(toDraft),
            managers: mine.filter((m) => m.role === 'manager').map(toDraft),
          };
        }
        setData({ planets, teams, details: toDetails(board), levels: toLevels(board.levels) });
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [id]);

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-destructive">{error}</p>
        <Link href="/admin/boards" className="mt-4 inline-block text-azure-lit hover:text-azure-glow">
          Back to boards
        </Link>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center gap-3 py-24">
        <Loader2 className="h-5 w-5 animate-spin text-azure-lit" />
        <span className="label-chart">Loading board</span>
      </div>
    );
  }
  return (
    <UploadTracker>
      <Editor id={id} initial={{ details: data.details, teams: data.teams, levels: data.levels }} planets={data.planets} />
    </UploadTracker>
  );
}
