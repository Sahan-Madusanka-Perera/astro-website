'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertCircle, ArrowUpRight, BookOpen, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Check, Field, inputClass } from '@/components/admin/form-fields';
import { issueImages } from '@/lib/magazine/shared';
import type { Magazine } from '@/types/magazine';
import { cn } from '@/lib/utils';

type Row = Omit<Magazine, 'outline'>;

export default function AdminMagazinePage() {
  const [issues, setIssues] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; setup: boolean } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/magazines', { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ message: body.message || 'Could not load the magazine.', setup: !!body.missingTable });
        return;
      }
      setIssues(body as Row[]);
      setError(null);
    } catch {
      setError({ message: 'Could not reach the server.', setup: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string, data: Partial<Row>, success?: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/magazines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message);
      setIssues((list) => list.map((m) => (m.id === id ? { ...m, ...body } : m)));
      if (success) toast.success(success);
      return true;
    } catch (err) {
      toast.error((err as Error).message || 'Could not save the change.');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const remove = async (m: Row) => {
    if (!confirm(`Delete “${m.title}”? Its pages are removed from the site immediately and this cannot be undone.`)) return;
    setBusy(m.id);
    try {
      const res = await fetch(`/api/magazines/${m.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setIssues((list) => list.filter((x) => x.id !== m.id));
      toast.success('Issue deleted');
    } catch {
      toast.error('Could not delete the issue. Try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="display text-[1.875rem]">Magazine</h1>
          <p className="mt-2.5 text-[0.9375rem] text-star-faint">
            {loading
              ? 'Loading…'
              : error
                ? 'Not connected.'
                : `${issues.filter((m) => m.is_published).length} published, ${issues.filter((m) => !m.is_published).length} draft.`}
          </p>
        </div>
        <Link
          href="/admin/magazine/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-azure px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit"
        >
          <Plus className="h-4 w-4" />
          Upload issue
        </Link>
      </header>

      {error && !loading && (
        <div className="mt-8 flex flex-col items-start gap-4 rounded-sm border border-destructive/30 bg-destructive/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" strokeWidth={1.6} />
            <div>
              <p className="text-[0.9375rem] text-starlight">
                {error.setup ? 'One step left before the first upload.' : 'Couldn’t load the magazine.'}
              </p>
              <p className="note mt-2 max-w-[60ch]">{error.message}</p>
            </div>
          </div>
          <button
            onClick={() => void load()}
            className="shrink-0 rounded-full border border-rule-lit px-5 py-2.5 text-[0.875rem] text-star-dim transition-colors hover:border-azure-lit/55 hover:text-starlight"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-9 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-sm border border-rule bg-white/[0.025]" />
          ))}
        </div>
      ) : !error && issues.length === 0 ? (
        <div className="mt-9 flex flex-col items-center rounded-sm border border-dashed border-rule-lit px-6 py-20 text-center">
          <BookOpen className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
          <p className="mt-5 text-[1.0625rem] text-starlight">No issues yet</p>
          <p className="note mt-3 max-w-[46ch]">
            Upload the magazine as a PDF. It turns into a flipbook on the public site — nothing else to prepare.
          </p>
          <Link
            href="/admin/magazine/new"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-azure px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit"
          >
            <Plus className="h-4 w-4" />
            Upload the first issue
          </Link>
        </div>
      ) : (
        <ul className="mt-9 divide-y divide-[var(--color-rule)] overflow-hidden rounded-sm border border-rule bg-void-1">
          {issues.map((m) => (
            <li key={m.id} className={cn('transition-opacity', busy === m.id && 'opacity-60')}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-4 p-4 sm:flex-nowrap sm:p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={issueImages(m)[0].t}
                  alt=""
                  className="w-14 shrink-0 rounded-[2px] bg-[#f3f4f6] ring-1 ring-white/10"
                  style={{ aspectRatio: m.pages?.[0] ? `${m.pages[0].w} / ${m.pages[0].h}` : '0.707' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-medium text-starlight">{m.title}</p>
                  {m.edition && <p className="mt-1 truncate text-[0.8125rem] text-star-faint">{m.edition}</p>}
                  <p className="label-chart mt-2.5" data-numeric>
                    {m.page_count} pages
                    <span className="mx-2 text-star-ghost">/</span>
                    <time dateTime={m.published_at}>{format(parseISO(m.published_at), 'dd MMM yyyy')}</time>
                    <span className="mx-2 text-star-ghost">/</span>
                    <span className={m.is_published ? 'text-azure-glow' : ''}>
                      {m.is_published ? 'Published' : 'Draft'}
                    </span>
                  </p>
                </div>
                <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                  <button
                    onClick={() =>
                      void patch(m.id, { is_published: !m.is_published }, m.is_published ? 'Moved to drafts' : 'Published')
                    }
                    disabled={busy === m.id}
                    className="rounded-full border border-rule-lit px-4 py-2 text-[0.8125rem] text-star-dim transition-colors hover:border-azure-lit/55 hover:text-starlight"
                  >
                    {m.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  {m.is_published && (
                    <a
                      href={`/magazine/${m.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${m.title} on the site`}
                      className="grid h-9 w-9 place-items-center rounded-sm border border-rule-lit text-star-faint transition-colors hover:border-azure-lit/55 hover:text-azure-glow"
                    >
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.7} />
                    </a>
                  )}
                  <button
                    onClick={() => setEditing(editing === m.id ? null : m.id)}
                    aria-label={`Edit ${m.title}`}
                    aria-expanded={editing === m.id}
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-sm border text-star-faint transition-colors hover:border-azure-lit/55 hover:text-starlight',
                      editing === m.id ? 'border-azure-lit/55 text-starlight' : 'border-rule-lit'
                    )}
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                  <button
                    onClick={() => void remove(m)}
                    disabled={busy === m.id}
                    aria-label={`Delete ${m.title}`}
                    className="grid h-9 w-9 place-items-center rounded-sm border border-rule-lit text-star-faint transition-colors hover:border-destructive/60 hover:text-destructive"
                  >
                    {busy === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" strokeWidth={1.7} />}
                  </button>
                </div>
              </div>

              {editing === m.id && (
                <EditIssue
                  issue={m}
                  saving={busy === m.id}
                  onCancel={() => setEditing(null)}
                  onSave={async (data) => {
                    if (await patch(m.id, data, 'Changes saved')) setEditing(null);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditIssue({
  issue,
  saving,
  onSave,
  onCancel,
}: {
  issue: Row;
  saving: boolean;
  onSave: (data: Partial<Row>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(issue.title);
  const [edition, setEdition] = useState(issue.edition ?? '');
  const [description, setDescription] = useState(issue.description ?? '');
  const [download, setDownload] = useState(issue.allow_download);

  return (
    <form
      className="space-y-5 border-t border-rule bg-void px-4 py-6 sm:px-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({ title, edition, description, ...(issue.pdf_url ? { allow_download: download } : {}) });
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Title" htmlFor={`t-${issue.id}`} error={title.trim() ? undefined : 'An issue needs a title.'}>
          <input id={`t-${issue.id}`} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Edition" htmlFor={`e-${issue.id}`}>
          <input id={`e-${issue.id}`} value={edition} onChange={(e) => setEdition(e.target.value)} className={inputClass} placeholder="Issue 04 · 2026" />
        </Field>
      </div>
      <Field label="Description" htmlFor={`d-${issue.id}`}>
        <textarea id={`d-${issue.id}`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={cn(inputClass, 'resize-y')} />
      </Field>
      {issue.pdf_url ? (
        <Check
          id={`dl-${issue.id}`}
          label="Offer the PDF as a download"
          description="Readers get a download button in the flipbook."
          checked={download}
          onChange={(e) => setDownload(e.target.checked)}
        />
      ) : (
        <p className="note">The PDF wasn’t kept for this issue, so it can only be read as a flipbook.</p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-rule-lit px-6 py-2.5 text-[0.9375rem] text-star-dim transition-colors duration-300 hover:border-azure-lit/55 hover:text-starlight"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-azure px-6 py-2.5 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit disabled:opacity-55"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </div>
    </form>
  );
}
