'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check as CheckIcon, Eye, FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Check, Field, inputClass } from './form-fields';
import { Reader } from '@/components/magazine/Reader';
import {
  openPdf,
  processPdf,
  renderCover,
  type OpenedPdf,
  type ProcessProgress,
  type ProcessedIssue,
} from '@/lib/magazine/process-pdf';
import { signUploads, uploadAll, type UploadItem } from '@/lib/magazine/upload';
import { PDF_PATH, TEXT_PATH, pagePath } from '@/lib/magazine/shared';
import type { ReaderIssue } from '@/types/magazine';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   PDF in, flipbook out.

   The whole job is one screen: drop the file and the pages start preparing
   straight away while the editor types the title. Preview opens the real
   reader on the prepared pages before anything is uploaded, so what the
   editor checks is exactly what readers will get.
--------------------------------------------------------------------------- */

type Stage = 'empty' | 'reading' | 'ready' | 'publishing' | 'done';

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(bytes >= 10 * 1048576 ? 0 : 1)} MB`;

const titleFromFile = (name: string) =>
  name
    .replace(/\.pdf$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function Bar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="h-[2px] overflow-hidden rounded-full bg-rule-lit"
    >
      <div
        className="h-full bg-azure-lit transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

export function MagazineUpload() {
  const [stage, setStage] = useState<Stage>('empty');
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<OpenedPdf | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [split, setSplit] = useState(false);
  const [progress, setProgress] = useState<ProcessProgress | null>(null);
  const [processed, setProcessed] = useState<ProcessedIssue | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [edition, setEdition] = useState('');
  const [description, setDescription] = useState('');
  const [publishNow, setPublishNow] = useState(true);
  const [download, setDownload] = useState(true);

  const [uploaded, setUploaded] = useState(0);
  const [done, setDone] = useState<{ slug: string; title: string; published: boolean } | null>(null);
  const [preview, setPreview] = useState<ReaderIssue | null>(null);
  const [dropping, setDropping] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const uploadAbort = useRef<AbortController | null>(null);
  const previewUrls = useRef<string[]>([]);

  /* ── Take a file ───────────────────────────────────────────────────────── */
  const reset = useCallback(() => {
    uploadAbort.current?.abort();
    setPdf((old) => {
      old?.close();
      return null;
    });
    setCover((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setFile(null);
    setProcessed(null);
    setProgress(null);
    setRenderError(null);
    setTitle('');
    setTitleError(null);
    setEdition('');
    setDescription('');
    setPublishNow(true);
    setDownload(true);
    setUploaded(0);
    setDone(null);
    setStage('empty');
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const takeFile = async (f?: File) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) {
      toast.error('That file isn’t a PDF.');
      return;
    }
    reset();
    setFile(f);
    setStage('reading');
    try {
      const opened = await openPdf(f);
      setPdf(opened);
      setTitle(opened.title ?? titleFromFile(f.name));
      setSplit(opened.looksLikeSpreads);
      setCover(await renderCover(opened.doc));
      setStage('ready');
    } catch (err) {
      console.error(err);
      toast.error('That PDF couldn’t be opened.', {
        description: 'It may be password-protected or damaged. Export it again and retry.',
      });
      setFile(null);
      setStage('empty');
    }
  };

  /* ── Prepare pages in the background ───────────────────────────────────── */
  useEffect(() => {
    if (!pdf) return;
    const ac = new AbortController();
    setProcessed(null);
    setRenderError(null);
    setProgress({ done: 0, total: pdf.pageCount });
    processPdf(pdf.doc, { splitSpreads: split, signal: ac.signal, onProgress: setProgress })
      .then((result) => {
        if (!ac.signal.aborted) setProcessed(result);
      })
      .catch((err) => {
        // Choosing another file destroys this document mid-render, which
        // rejects with its own error; it must not land on the next file.
        if (ac.signal.aborted || (err as Error).name === 'AbortError') return;
        console.error(err);
        setRenderError('A page failed to render. The PDF may use a feature this browser can’t draw.');
      });
    return () => ac.abort();
  }, [pdf, split, attempt]);

  useEffect(() => () => {
    uploadAbort.current?.abort();
    previewUrls.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  /* Leaving mid-way throws the work away — say so. */
  const working = stage === 'publishing' || (stage === 'ready' && !processed && !renderError);
  useEffect(() => {
    if (!working) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [working]);

  const bytes = useMemo(
    () => (processed ? processed.pages.reduce((n, p) => n + p.images.t.size + p.images.m.size + p.images.h.size, 0) : 0),
    [processed]
  );

  /* ── Preview ───────────────────────────────────────────────────────────── */
  const openPreview = () => {
    if (!processed) return;
    const urls: string[] = [];
    const make = (b: Blob) => {
      const u = URL.createObjectURL(b);
      urls.push(u);
      return u;
    };
    previewUrls.current = urls;
    setPreview({
      title: title.trim() || 'Untitled issue',
      edition: edition.trim() || null,
      pages: processed.pages.map((p) => p.meta),
      images: processed.pages.map((p) => ({ t: make(p.images.t), m: make(p.images.m), h: make(p.images.h) })),
      outline: processed.outline,
      text: processed.hasText ? processed.pages.map((p) => p.text) : null,
    });
  };

  const closePreview = () => {
    setPreview(null);
    previewUrls.current.forEach((u) => URL.revokeObjectURL(u));
    previewUrls.current = [];
  };

  /* ── Publish ───────────────────────────────────────────────────────────── */
  const publish = async () => {
    if (!processed || !file) return;
    if (!title.trim()) {
      setTitleError('Give the issue a title.');
      document.getElementById('mag-title')?.focus();
      return;
    }

    setStage('publishing');
    setUploaded(0);
    const ac = new AbortController();
    uploadAbort.current = ac;

    const items: UploadItem[] = [];
    processed.pages.forEach((p, i) =>
      (['t', 'm', 'h'] as const).forEach((size) =>
        items.push({ path: pagePath(i, size, processed.ext), blob: p.images[size] })
      )
    );
    if (processed.hasText) {
      items.push({
        path: TEXT_PATH,
        blob: new Blob([JSON.stringify(processed.pages.map((p) => p.text))], { type: 'application/json' }),
      });
    }
    if (download) items.push({ path: PDF_PATH, blob: file, optional: true });

    let id: string | undefined;
    try {
      const signed = await signUploads(items.map((i) => i.path));
      id = signed.id;
      const { failedOptional } = await uploadAll(items, signed, { onProgress: setUploaded, signal: ac.signal });
      const pdfKept = download && !failedOptional.includes(PDF_PATH);

      const res = await fetch('/api/magazines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          title,
          edition,
          description,
          image_ext: processed.ext,
          pages: processed.pages.map((p) => p.meta),
          outline: processed.outline,
          has_text: processed.hasText,
          has_pdf: pdfKept,
          allow_download: pdfKept,
          is_published: publishNow,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Could not save the issue.');

      if (download && !pdfKept) {
        toast.warning('The PDF itself wasn’t kept', {
          description: `At ${mb(file.size)} it is over the storage file limit. The flipbook works; there is just no download button.`,
        });
      }
      setDone({ slug: body.slug, title: body.title, published: publishNow });
      setStage('done');
    } catch (err) {
      // Nothing half-uploaded is left behind in storage.
      if (id) void fetch(`/api/magazines/${id}`, { method: 'DELETE' });
      if ((err as Error).name === 'AbortError') toast('Upload cancelled');
      else toast.error((err as Error).message || 'Upload failed. Try again.');
      setStage('ready');
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */

  if (stage === 'done' && done) {
    return (
      <div className="max-w-2xl rounded-sm border border-rule bg-void-1 p-6 md:p-8">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-azure/16 text-azure-glow">
          <CheckIcon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <h2 className="mt-6 text-[1.1875rem] font-medium text-starlight">
          {done.published ? `“${done.title}” is live.` : `“${done.title}” is saved as a draft.`}
        </h2>
        <p className="note mt-2 max-w-[52ch]">
          {done.published
            ? 'It is on the magazine page and the home page now.'
            : 'Only the committee can see it. Publish it from the magazine list when it’s ready.'}
        </p>
        <div className="mt-8 flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row">
          {done.published && (
            <a
              href={`/magazine/${done.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-azure px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit"
            >
              Open the issue
              <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
          <Link
            href="/admin/magazine"
            className="inline-flex items-center justify-center rounded-full border border-rule-lit px-6 py-3 text-[0.9375rem] text-star-dim transition-colors duration-300 hover:border-azure-lit/55 hover:text-starlight"
          >
            Back to magazine
          </Link>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-[0.9375rem] text-star-faint transition-colors duration-300 hover:text-starlight"
          >
            Upload another
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'empty' || stage === 'reading') {
    return (
      <div className="max-w-2xl">
        <input
          ref={inputRef}
          id="mag-file"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => void takeFile(e.target.files?.[0])}
        />
        <button
          type="button"
          disabled={stage === 'reading'}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDropping(true);
          }}
          onDragLeave={() => setDropping(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropping(false);
            void takeFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-4 rounded-sm border border-dashed px-6 py-20 text-center transition-colors duration-300',
            dropping ? 'border-azure-lit bg-azure/[0.08]' : 'border-rule-lit hover:border-azure-lit/55'
          )}
        >
          {stage === 'reading' ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-azure-lit" />
              <span className="text-[0.9375rem] text-star-dim">Opening {file?.name}…</span>
            </>
          ) : (
            <>
              <FileUp className="h-7 w-7 text-star-ghost" strokeWidth={1.4} />
              <span className="text-[1.0625rem] text-starlight">Drop the magazine PDF here, or choose a file</span>
              <span className="note max-w-[48ch]">
                One PDF per issue. Pages are prepared in this browser, so keep the tab open until it says the issue is live.
              </span>
            </>
          )}
        </button>
      </div>
    );
  }

  const rendering = !processed && !renderError;
  const publishing = stage === 'publishing';

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-8">
        {/* ── The details ──────────────────────────────────────────────── */}
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void publish();
          }}
          className="order-2 space-y-6 rounded-sm border border-rule bg-void-1 p-6 md:p-8 lg:order-1"
        >
          <Field label="Title" htmlFor="mag-title" error={titleError ?? undefined}>
            <input
              id="mag-title"
              value={title}
              disabled={publishing}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              aria-invalid={!!titleError}
              className={cn(inputClass, titleError && 'border-destructive/70')}
              placeholder="Cosmos"
            />
          </Field>
          <Field label="Edition" htmlFor="mag-edition" hint="Optional. Shown under the title.">
            <input
              id="mag-edition"
              value={edition}
              disabled={publishing}
              onChange={(e) => setEdition(e.target.value)}
              className={inputClass}
              placeholder="Issue 04 · September 2026"
            />
          </Field>
          <Field
            label="Description"
            htmlFor="mag-description"
            hint="Optional. A sentence or two for the magazine page and for link previews."
          >
            <textarea
              id="mag-description"
              rows={3}
              value={description}
              disabled={publishing}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(inputClass, 'resize-y')}
              placeholder="The monsoon observing season, a night at Hanthana, and the members' best Milky Way shots."
            />
          </Field>

          <div className="space-y-3">
            <Check
              id="mag-publish"
              label="Publish straight away"
              description="Off keeps it as a draft that only the committee can see."
              checked={publishNow}
              disabled={publishing}
              onChange={(e) => setPublishNow(e.target.checked)}
            />
            <Check
              id="mag-download"
              label="Offer the PDF as a download"
              description={`Readers get a download button${file ? ` (${mb(file.size)})` : ''}. The flipbook works either way.`}
              checked={download}
              disabled={publishing}
              onChange={(e) => setDownload(e.target.checked)}
            />
          </div>

          <div className="border-t border-rule pt-6">
            {publishing && (
              <div className="mb-5">
                <div className="mb-2.5 flex items-baseline justify-between gap-4">
                  <p className="text-[0.875rem] text-star-dim">Uploading pages</p>
                  <p className="label-chart" data-numeric>
                    {Math.round(uploaded * 100)}%
                  </p>
                </div>
                <Bar value={uploaded} label="Upload progress" />
              </div>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              {publishing ? (
                <button
                  type="button"
                  onClick={() => uploadAbort.current?.abort()}
                  className="rounded-full border border-rule-lit px-6 py-3 text-[0.9375rem] text-star-dim transition-colors duration-300 hover:border-destructive/55 hover:text-destructive"
                >
                  Cancel upload
                </button>
              ) : (
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full border border-rule-lit px-6 py-3 text-[0.9375rem] text-star-dim transition-colors duration-300 hover:border-azure-lit/55 hover:text-starlight"
                >
                  Choose another PDF
                </button>
              )}
              <button
                type="submit"
                disabled={!processed || publishing}
                className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-azure px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-azure"
              >
                {(publishing || rendering) && <Loader2 className="h-4 w-4 animate-spin" />}
                {publishing
                  ? 'Publishing'
                  : rendering
                    ? 'Preparing pages'
                    : publishNow
                      ? 'Publish issue'
                      : 'Save as draft'}
              </button>
            </div>
          </div>
        </form>

        {/* ── The file ─────────────────────────────────────────────────── */}
        <aside className="order-1 rounded-sm border border-rule bg-void-1 lg:order-2 lg:self-start">
          <div className="flex items-start gap-4 p-5 lg:block">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt="Cover"
                className="w-24 shrink-0 rounded-[2px] bg-[#f3f4f6] ring-1 ring-white/10 lg:w-full"
              />
            )}
            <div className="min-w-0 lg:mt-5">
              <p className="truncate text-[0.875rem] text-starlight" title={file?.name}>
                {file?.name}
              </p>
              <p className="label-chart mt-2" data-numeric>
                {pdf?.pageCount} {pdf?.pageCount === 1 ? 'page' : 'pages'}
                <span className="mx-2 text-star-ghost">/</span>
                {file ? mb(file.size) : ''}
              </p>
            </div>
          </div>

          {pdf?.looksLikeSpreads && (
            <div className="border-t border-rule p-5">
              <Check
                id="mag-split"
                label="Split spreads into pages"
                description="This PDF looks exported as two-page spreads. Splitting lets each side turn on its own."
                checked={split}
                disabled={publishing}
                onChange={(e) => setSplit(e.target.checked)}
              />
            </div>
          )}

          <div className="border-t border-rule p-5">
            {renderError ? (
              <div>
                <p className="text-[0.875rem] text-destructive">{renderError}</p>
                <button
                  type="button"
                  onClick={() => setAttempt((a) => a + 1)}
                  className="mt-3 rounded-full border border-rule-lit px-4 py-2 text-[0.8125rem] text-star-dim transition-colors hover:border-azure-lit/55 hover:text-starlight"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className="mb-2.5 flex items-baseline justify-between gap-4">
                  <p className="text-[0.875rem] text-star-dim">{processed ? 'Pages ready' : 'Preparing pages'}</p>
                  <p className="label-chart" data-numeric>
                    {processed
                      ? mb(bytes)
                      : `${progress?.done ?? 0} / ${progress?.total ?? pdf?.pageCount ?? 0}`}
                  </p>
                </div>
                <Bar
                  value={processed ? 1 : progress && progress.total ? progress.done / progress.total : 0}
                  label="Page preparation progress"
                />
                {processed && (
                  <p className="note mt-3">
                    {processed.pages.length} pages
                    {processed.outline.length > 0 ? `, ${processed.outline.length} bookmarks` : ''}
                    {processed.pages.some((p) => p.meta.links?.length) ? ', links kept' : ''}
                    {processed.hasText ? ', searchable' : ''}.
                  </p>
                )}
              </>
            )}
            <button
              type="button"
              onClick={openPreview}
              disabled={!processed}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-rule-lit px-5 py-2.5 text-[0.9375rem] text-star-dim transition-colors duration-300 hover:border-azure-lit/55 hover:text-starlight disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Eye className="h-4 w-4" strokeWidth={1.7} />
              Preview flipbook
            </button>
          </div>
        </aside>
      </div>

      {preview && (
        <Reader issue={preview} onClose={closePreview} syncUrl={false} />
      )}
      {preview && (
        <span className="sr-only" aria-live="polite">
          Preview open. Press Escape to close.
        </span>
      )}
    </>
  );
}
