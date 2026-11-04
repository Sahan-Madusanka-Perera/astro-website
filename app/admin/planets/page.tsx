'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, ChevronDown, Loader2, Orbit, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Field, inputClass } from '@/components/admin/form-fields';
import { ImagePicker, OrderControls, SetupNotice, UploadTracker, moveItem, pillButton, primaryButton, useUploads } from '@/components/admin/club/ui';
import { shortPlanetName, slugify } from '@/lib/club/shared';
import type { ClubPlanet } from '@/types/club';
import { cn } from '@/lib/utils';

interface Draft {
  name: string;
  slug: string;
  description: string;
  icon_url: string;
  responsibilities: string; // one per line in the editor
}

const toDraft = (p: ClubPlanet): Draft => ({
  name: p.name,
  slug: p.slug,
  description: p.description,
  icon_url: p.icon_url,
  responsibilities: p.responsibilities.join('\n'),
});

function PlanetCard({
  planet,
  index,
  count,
  startOpen,
  onSaved,
  onMove,
  onDelete,
}: {
  planet: ClubPlanet;
  index: number;
  count: number;
  startOpen: boolean;
  onSaved: (p: ClubPlanet) => void;
  onMove: (from: number, to: number) => void;
  onDelete: () => void;
}) {
  const { pending } = useUploads();
  const [open, setOpen] = useState(startOpen);
  const [draft, setDraft] = useState(() => toDraft(planet));
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(planet));
  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft((d) => ({ ...d, [key]: e.target.value }));
  const fid = (k: string) => `${planet.id}-${k}`;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/planets/${planet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, responsibilities: draft.responsibilities.split('\n') }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Could not save the planet.');
      onSaved(body);
      setDraft(toDraft(body));
      toast.success(`${shortPlanetName(body.name)} saved`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-sm border border-rule bg-void-1">
      <div className="flex items-center gap-4 p-4">
        <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-void-2 ring-1 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {draft.icon_url && <img src={draft.icon_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        </span>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[0.9375rem] font-medium text-starlight">{planet.name}</span>
          <span className="label-chart mt-1 block truncate">
            /planets/{planet.slug}
            {dirty && <span className="ml-2 text-sodium">• unsaved</span>}
          </span>
        </button>
        <button type="button" className={pillButton} onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Edit'}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </button>
        <OrderControls index={index} count={count} label={planet.name} onMove={onMove} onRemove={onDelete} />
      </div>

      {open && (
        <div className="border-t border-rule p-4 sm:p-5">
          <div className="flex flex-col gap-6 sm:flex-row">
            <ImagePicker value={draft.icon_url} onChange={(icon_url) => setDraft((d) => ({ ...d, icon_url }))} folder="planets" label="Logo" round />
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Name" htmlFor={fid('name')}>
                <input id={fid('name')} className={inputClass} value={draft.name} onChange={set('name')} placeholder="Planet of Observation" />
              </Field>
              <Field label="Web address" htmlFor={fid('slug')} hint={`/planets/${slugify(draft.slug || draft.name) || '…'} — changing it breaks old links.`}>
                <input id={fid('slug')} className={inputClass} value={draft.slug} onChange={set('slug')} />
              </Field>
              <Field label="Description" htmlFor={fid('description')} className="md:col-span-2">
                <textarea id={fid('description')} rows={2} className={cn(inputClass, 'resize-y')} value={draft.description} onChange={set('description')} />
              </Field>
              <Field label="Responsibilities" htmlFor={fid('resp')} className="md:col-span-2" hint="One per line.">
                <textarea id={fid('resp')} rows={4} className={cn(inputClass, 'resize-y')} value={draft.responsibilities} onChange={set('responsibilities')} />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-rule pt-4">
            <p className="note mr-auto">
              Directors and managers are set per year in{' '}
              <Link href="/admin/boards" className="text-azure-lit hover:text-azure-glow">
                Boards
              </Link>
              .
            </p>
            <a href={`/planets/${planet.slug}`} target="_blank" rel="noopener noreferrer" className={pillButton}>
              View <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <button type="button" className={pillButton} disabled={!dirty || saving} onClick={() => setDraft(toDraft(planet))}>
              Discard
            </button>
            <button type="button" className={primaryButton} disabled={!dirty || saving || pending > 0} onClick={() => void save()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save planet
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function PlanetsAdmin() {
  const [planets, setPlanets] = useState<ClubPlanet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/planets', { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Could not load the planets.');
      setPlanets(body);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch('/api/admin/planets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message);
      setAdded((s) => new Set(s).add(body.id));
      setPlanets((list) => [...list, body]);
      setName('');
      toast.success(`${shortPlanetName(body.name)} added — add its logo and description below`);
    } catch (err) {
      toast.error((err as Error).message || 'Could not add the planet.');
    } finally {
      setAdding(false);
    }
  };

  const move = async (from: number, to: number) => {
    const before = planets;
    const next = moveItem(planets, from, to);
    setPlanets(next);
    const res = await fetch('/api/admin/planets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((p) => p.id) }),
    });
    if (!res.ok) {
      setPlanets(before);
      toast.error('Could not save the new order.');
    }
  };

  const remove = async (p: ClubPlanet) => {
    const typed = prompt(
      `Delete ${p.name}? Its page and its directors and managers in every year are removed. This cannot be undone.\n\nType DELETE to confirm.`
    );
    if (typed?.trim() !== 'DELETE') return;
    const res = await fetch(`/api/admin/planets/${p.id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error((await res.json().catch(() => ({}))).message || 'Could not delete the planet.');
      return;
    }
    setPlanets((list) => list.filter((x) => x.id !== p.id));
    toast.success(`${shortPlanetName(p.name)} deleted`);
  };

  return (
    <div>
      <header>
        <h1 className="display text-[1.875rem]">Planets</h1>
        <p className="mt-2.5 max-w-[64ch] text-[0.9375rem] text-star-faint">
          The club’s divisions: name, logo, description and responsibilities, and the order they appear on the home page. Each year’s
          directors and managers are managed under <Link href="/admin/boards" className="text-azure-lit hover:text-azure-glow">Boards</Link>.
        </p>
      </header>

      {error && !loading && <SetupNotice message={error} onRetry={() => void load()} />}

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-sm border border-rule bg-white/[0.025]" />
          ))}
        </div>
      ) : (
        !error && (
          <>
            {planets.length === 0 ? (
              <div className="mt-8 flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-16 text-center">
                <Orbit className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
                <p className="mt-5 text-[1.0625rem] text-starlight">No planets yet</p>
              </div>
            ) : (
              <ul className="mt-8 space-y-3">
                {planets.map((p, i) => (
                  <PlanetCard
                    key={p.id}
                    planet={p}
                    index={i}
                    count={planets.length}
                    startOpen={added.has(p.id)}
                    onSaved={(saved) => setPlanets((list) => list.map((x) => (x.id === saved.id ? saved : x)))}
                    onMove={(from, to) => void move(from, to)}
                    onDelete={() => void remove(p)}
                  />
                ))}
              </ul>
            )}
            <form onSubmit={add} className="mt-6 flex flex-col gap-3 rounded-sm border border-rule bg-void-1 p-5 sm:flex-row sm:items-end">
              <Field label="New planet" htmlFor="new-planet" className="flex-1">
                <input id="new-planet" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Planet of Astrophotography" />
              </Field>
              <button type="submit" className={primaryButton} disabled={adding || !name.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add planet
              </button>
            </form>
          </>
        )
      )}
    </div>
  );
}

export default function AdminPlanetsPage() {
  return (
    <UploadTracker>
      <PlanetsAdmin />
    </UploadTracker>
  );
}
