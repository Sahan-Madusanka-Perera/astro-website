'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Field, inputClass } from '@/components/admin/form-fields';
import { SetupNotice, iconButton, primaryButton } from '@/components/admin/club/ui';
import { cn } from '@/lib/utils';

interface Row {
  id: string;
  year: string;
  note: string;
  is_current: boolean;
  is_published: boolean;
  cover: string;
  image_count: number;
  director_count: number;
  manager_count: number;
}

function nextYear(rows: Row[]) {
  const starts = rows.map((r) => parseInt(r.year, 10)).filter(Number.isFinite);
  const y = starts.length ? Math.max(...starts) + 1 : new Date().getFullYear();
  return `${y}/${String((y + 1) % 100).padStart(2, '0')}`;
}

export default function AdminBoardsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/boards', { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Could not load the boards.');
      setRows(body);
      setYear((y) => y || nextYear(body));
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

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message);
      toast.success(`Board ${body.year} created`);
      router.push(`/admin/boards/${body.id}`);
    } catch (err) {
      toast.error((err as Error).message || 'Could not create the board.');
      setCreating(false);
    }
  };

  const remove = async (r: Row) => {
    const people = r.director_count + r.manager_count;
    const typed = prompt(
      `Delete the ${r.year} board? This removes its ${r.image_count} photos and all ${people} directors and managers of that year, and cannot be undone.\n\nType ${r.year} to confirm.`
    );
    if (typed?.trim() !== r.year) return;
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/boards/${r.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message);
      setRows((list) => list.filter((x) => x.id !== r.id));
      toast.success(`Board ${r.year} deleted`);
    } catch (err) {
      toast.error((err as Error).message || 'Could not delete the board.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <header>
        <h1 className="display text-[1.875rem]">Boards</h1>
        <p className="mt-2.5 max-w-[64ch] text-[0.9375rem] text-star-faint">
          One board per year. Each year keeps its own board photos and its own directors and managers for every planet — add a new year
          when the committee changes.
        </p>
      </header>

      {error && !loading && <SetupNotice message={error} onRetry={() => void load()} />}

      {!error && (
        <form onSubmit={create} className="mt-8 flex flex-col gap-4 rounded-sm border border-rule bg-void-1 p-5 sm:flex-row sm:items-end">
          <Field label="New board year" htmlFor="new-year" className="sm:w-60">
            <input id="new-year" className={inputClass} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026/27" />
          </Field>
          <button type="submit" disabled={creating || !year.trim()} className={primaryButton}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add year
          </button>
          <p className="note sm:ml-2 sm:pb-2.5">New years start as drafts, hidden from the site until you publish them.</p>
        </form>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-64 rounded-sm border border-rule bg-white/[0.025]" />
          ))}
        </div>
      ) : (
        !error &&
        (rows.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-16 text-center">
            <Users className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
            <p className="mt-5 text-[1.0625rem] text-starlight">No boards yet</p>
            <p className="note mt-3">Add the first year above.</p>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {rows.map((r) => (
              <li key={r.id} className={cn('overflow-hidden rounded-sm border border-rule bg-void-1 transition-opacity', busy === r.id && 'opacity-60')}>
                <Link href={`/admin/boards/${r.id}`} className="relative block aspect-[16/8] bg-void-2">
                  {r.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="note absolute inset-0 grid place-items-center">No photos yet</span>
                  )}
                </Link>
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2.5">
                      <span className="text-[1.125rem] font-medium text-starlight" data-numeric>
                        {r.year}
                      </span>
                      {r.is_current && <span className="label-chart rounded-full border border-azure-lit/50 px-2 py-0.5 text-azure-glow">Current</span>}
                      {!r.is_published && <span className="label-chart rounded-full border border-sodium/50 px-2 py-0.5 text-sodium">Draft</span>}
                    </p>
                    <p className="label-chart mt-2" data-numeric>
                      {r.image_count} photos <span className="mx-1.5 text-star-ghost">/</span>
                      {r.director_count} directors <span className="mx-1.5 text-star-ghost">/</span>
                      {r.manager_count} managers
                    </p>
                  </div>
                  <Link href={`/admin/boards/${r.id}`} className={primaryButton}>
                    Edit
                  </Link>
                  <button onClick={() => void remove(r)} disabled={busy === r.id} className={cn(iconButton, 'hover:border-destructive/60 hover:text-destructive')} aria-label={`Delete board ${r.year}`}>
                    {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" strokeWidth={1.7} />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))
      )}
    </div>
  );
}
