'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutGrid,
  ListTree,
  Maximize2,
  Minimize2,
  Search,
  Share2,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { FlipBook, type FlipBookHandle, type FlipBookState } from './FlipBook';
import { preloadPageTurn } from '@/lib/magazine/sound';
import type { MagazineOutlineItem, ReaderIssue } from '@/types/magazine';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   The reading room: the flipbook, and the few instruments around it.

   Everything a hosted flipbook offers — page scrubber with previews, a
   thumbnail spread view, bookmarks, search through the text, zoom, share,
   download, full screen — kept to two hairline bars so the pages stay the
   brightest thing on the screen.
--------------------------------------------------------------------------- */

const EASE = [0.16, 1, 0.3, 1] as const;
const pad = (n: number) => String(n).padStart(2, '0');

type Panel = 'thumbs' | 'contents' | 'search' | null;

function ToolButton({
  label,
  active,
  className,
  children,
  ...props
}: { label: string; active?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full transition-[color,background-color] duration-300 disabled:pointer-events-none disabled:opacity-35',
        active
          ? 'bg-azure/16 text-azure-glow'
          : 'text-star-faint hover:bg-white/[0.06] hover:text-starlight',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function pageLabel(pages: number[]) {
  if (pages.length === 0) return '—';
  if (pages.length === 1) return pad(pages[0] + 1);
  return `${pad(pages[0] + 1)}–${pad(pages[1] + 1)}`;
}

export function Reader({
  issue,
  initialPage = 0,
  backHref = '/magazine',
  onClose,
  syncUrl = true,
}: {
  issue: ReaderIssue;
  initialPage?: number;
  backHref?: string;
  /** Preview mode: a close button instead of a link back. */
  onClose?: () => void;
  syncUrl?: boolean;
}) {
  const n = issue.pages.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const book = useRef<FlipBookHandle>(null);
  const reduced = useReducedMotion();

  const [state, setState] = useState<FlipBookState>({
    pages: [initialPage],
    spread: false,
    canPrev: initialPage > 0,
    canNext: initialPage < n - 1,
    zoom: 1,
  });
  const [panel, setPanel] = useState<Panel>(null);
  const [sound, setSound] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);
  const [hover, setHover] = useState<{ page: number; x: number } | null>(null);

  const [text, setText] = useState<string[] | null>(issue.text ?? null);
  const [textState, setTextState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [query, setQuery] = useState('');

  useEffect(() => {
    // The page-turn clip is small; fetch it now so the first turn isn't late.
    preloadPageTurn();

    // Browser-only facts, read after the first paint so the server render
    // and the hydrating render agree.
    const raf = requestAnimationFrame(() => {
      try {
        if (localStorage.getItem('mag-sound') === 'off') setSound(false);
      } catch {
        /* storage blocked */
      }
      setCanFullscreen(!!document.fullscreenEnabled);
    });
    const onFs = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, []);

  const toggleSound = () =>
    setSound((s) => {
      try {
        localStorage.setItem('mag-sound', s ? 'off' : 'on');
      } catch {
        /* storage blocked */
      }
      return !s;
    });

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen().catch(() => undefined);
  }, []);

  /* The address bar follows the page, so a copied link opens where you are. */
  useEffect(() => {
    if (!syncUrl) return;
    const first = state.pages[0];
    if (first === undefined) return;
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      if (first === 0) url.searchParams.delete('page');
      else url.searchParams.set('page', String(first + 1));
      window.history.replaceState(window.history.state, '', url);
    }, 250);
    return () => clearTimeout(t);
  }, [state.pages, syncUrl]);

  const loadText = useCallback(() => {
    if (text || !issue.textUrl || textState === 'loading') return;
    setTextState('loading');
    fetch(issue.textUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((t: string[]) => {
        setText(t);
        setTextState('idle');
      })
      .catch(() => setTextState('error'));
  }, [text, issue.textUrl, textState]);

  const openPanel = useCallback(
    (p: Panel) => {
      setPanel((cur) => (cur === p ? null : p));
      if (p === 'search') loadText();
    },
    [loadText]
  );

  const goTo = useCallback((page: number, closePanel = false) => {
    book.current?.goTo(page);
    if (closePanel) setPanel(null);
  }, []);

  /* ── Keyboard ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.closest('input, textarea, [contenteditable="true"]');
      if (e.key === 'Escape') {
        if (panel) setPanel(null);
        else if (state.zoom > 1.01) book.current?.resetZoom();
        else if (onClose) onClose();
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          book.current?.next();
          break;
        case ' ':
          if (target.closest('button, a')) return;
          e.preventDefault();
          if (e.shiftKey) book.current?.prev();
          else book.current?.next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          book.current?.prev();
          break;
        case 'Home':
          e.preventDefault();
          book.current?.goTo(0);
          break;
        case 'End':
          e.preventDefault();
          book.current?.goTo(n - 1);
          break;
        case '+':
        case '=':
          book.current?.zoomBy(1.5);
          break;
        case '-':
          book.current?.zoomBy(1 / 1.5);
          break;
        case '0':
          book.current?.resetZoom();
          break;
        case 'f':
          if (canFullscreen) toggleFullscreen();
          break;
        case '/':
          e.preventDefault();
          openPanel('search');
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, state.zoom, onClose, n, canFullscreen, toggleFullscreen, openPanel]);

  /* ── Share / download ──────────────────────────────────────────────────── */
  const share = async () => {
    const url = new URL(issue.shareUrl ?? window.location.href, window.location.href);
    const first = state.pages[0] ?? 0;
    if (first > 0) url.searchParams.set('page', String(first + 1));
    const data = { title: issue.title, url: url.toString() };
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(data.url);
      toast.success('Link copied', { description: first > 0 ? `Opens at page ${first + 1}.` : undefined });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') toast.error('Could not copy the link.');
    }
  };

  /* ── Search ────────────────────────────────────────────────────────────── */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!text || q.length < 2) return [];
    const out: { page: number; count: number; before: string; match: string; after: string }[] = [];
    text.forEach((t, page) => {
      const lower = t.toLowerCase();
      let idx = lower.indexOf(q);
      if (idx === -1) return;
      const first = idx;
      let count = 0;
      while (idx !== -1) {
        count++;
        idx = lower.indexOf(q, idx + q.length);
      }
      const start = Math.max(0, first - 48);
      const end = Math.min(t.length, first + q.length + 64);
      out.push({
        page,
        count,
        before: (start > 0 ? '…' : '') + t.slice(start, first).replace(/\s+/g, ' '),
        match: t.slice(first, first + q.length),
        after: t.slice(first + q.length, end).replace(/\s+/g, ' ') + (end < t.length ? '…' : ''),
      });
    });
    return out;
  }, [text, query]);

  /* ── Derived ───────────────────────────────────────────────────────────── */
  const current = state.pages[0] ?? 0;
  const scrubValue = scrub ?? current;
  const fill = n > 1 ? (scrubValue / (n - 1)) * 100 : 100;
  const hasOutline = issue.outline.length > 0;
  const canSearch = !!(issue.text || issue.textUrl);

  const spreads = useMemo(() => {
    if (!state.spread) return Array.from({ length: n }, (_, i) => [i]);
    const out: number[][] = [[0]];
    for (let i = 1; i < n; i += 2) out.push(i + 1 < n ? [i, i + 1] : [i]);
    return out;
  }, [state.spread, n]);

  const announce =
    state.pages.length === 2
      ? `Pages ${state.pages[0] + 1} and ${state.pages[1] + 1} of ${n}`
      : `Page ${current + 1} of ${n}`;

  const onFlipChange = useCallback((s: FlipBookState) => setState(s), []);

  const visibleText = text ? state.pages.map((p) => text[p]).filter(Boolean).join('\n\n') : '';

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] flex h-[100svh] flex-col bg-void text-star-dim"
      role="region"
      aria-label={`${issue.title} — magazine reader`}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 border-b border-rule px-2 sm:px-4 md:h-16 md:px-5">
        {onClose ? (
          <ToolButton label="Close preview" onClick={onClose}>
            <X className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
          </ToolButton>
        ) : (
          <Link
            href={backHref}
            aria-label="All issues"
            title="All issues"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-star-faint transition-[color,background-color] duration-300 hover:bg-white/[0.06] hover:text-starlight"
          >
            <ArrowLeft className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
          </Link>
        )}

        <div className="min-w-0 flex-1 pl-1">
          <h1 className="truncate text-[0.9375rem] font-medium leading-tight text-starlight">{issue.title}</h1>
          {issue.edition && (
            <p className="mt-0.5 truncate text-[0.8125rem] leading-tight text-star-faint">{issue.edition}</p>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {canSearch && (
            <ToolButton label="Search this issue" active={panel === 'search'} onClick={() => openPanel('search')}>
              <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
            </ToolButton>
          )}
          {hasOutline && (
            <ToolButton label="Contents" active={panel === 'contents'} onClick={() => openPanel('contents')}>
              <ListTree className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
            </ToolButton>
          )}
          {!onClose && (
            <ToolButton label="Share" onClick={share}>
              <Share2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
            </ToolButton>
          )}
          {issue.pdfUrl && (
            <a
              href={issue.pdfUrl}
              download
              target="_blank"
              rel="noopener"
              aria-label="Download PDF"
              title="Download PDF"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-star-faint transition-[color,background-color] duration-300 hover:bg-white/[0.06] hover:text-starlight"
            >
              <Download className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
            </a>
          )}
          {canFullscreen && (
            <ToolButton
              label={fullscreen ? 'Exit full screen' : 'Full screen'}
              onClick={toggleFullscreen}
              className="hidden sm:grid"
            >
              {fullscreen ? (
                <Minimize2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
              ) : (
                <Maximize2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
              )}
            </ToolButton>
          )}
        </div>
      </header>

      {/* ── The book ────────────────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1">
        <FlipBook
          ref={book}
          pages={issue.pages}
          images={issue.images}
          initialPage={initialPage}
          sound={sound}
          onChange={onFlipChange}
        />

        {/* Big, quiet turn targets beside the book on wide screens. */}
        <button
          type="button"
          onClick={() => book.current?.prev()}
          disabled={!state.canPrev || state.zoom > 1.01}
          aria-label="Previous page"
          className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-rule-lit bg-void/60 text-star-dim backdrop-blur-md transition-[color,border-color,opacity] duration-300 hover:border-azure-lit/55 hover:text-starlight disabled:opacity-0 lg:grid"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => book.current?.next()}
          disabled={!state.canNext || state.zoom > 1.01}
          aria-label="Next page"
          className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-rule-lit bg-void/60 text-star-dim backdrop-blur-md transition-[color,border-color,opacity] duration-300 hover:border-azure-lit/55 hover:text-starlight disabled:opacity-0 lg:grid"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* ── Thumbnails ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {panel === 'thumbs' && (
            <motion.div
              key="thumbs"
              initial={{ opacity: 0, y: reduced ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : 16 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute inset-0 z-30 overflow-y-auto bg-void/94 backdrop-blur-xl"
              role="dialog"
              aria-label="All pages"
            >
              <div className="mx-auto max-w-[80rem] px-4 pb-10 pt-5 md:px-8">
                <div className="flex items-center justify-between border-b border-rule pb-4">
                  <p className="label-chart" data-numeric>
                    {n} pages
                  </p>
                  <ToolButton label="Close pages" onClick={() => setPanel(null)}>
                    <X className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
                  </ToolButton>
                </div>
                <ul
                  className={cn(
                    'mt-6 grid gap-x-4 gap-y-6',
                    state.spread
                      ? 'grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]'
                      : 'grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]'
                  )}
                >
                  {spreads.map((group) => {
                    const on = group.some((p) => state.pages.includes(p));
                    return (
                      <li key={group[0]}>
                        <button
                          type="button"
                          onClick={() => goTo(group[0], true)}
                          aria-current={on ? 'page' : undefined}
                          className="group block w-full text-left"
                        >
                          <span
                            className={cn(
                              'flex overflow-hidden rounded-[2px] ring-1 transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5',
                              group.length === 1 && state.spread && group[0] === 0 && 'ml-[50%] w-1/2',
                              group.length === 1 && state.spread && group[0] !== 0 && 'w-1/2',
                              on ? 'ring-2 ring-azure-lit' : 'ring-white/10 group-hover:ring-azure-lit/55'
                            )}
                          >
                            {group.map((p) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={p}
                                src={issue.images[p].t}
                                alt=""
                                loading="lazy"
                                className="block min-w-0 flex-1 bg-[#f3f4f6]"
                                style={{ aspectRatio: `${issue.pages[p].w} / ${issue.pages[p].h}` }}
                              />
                            ))}
                          </span>
                          <span
                            className={cn('label-chart mt-2.5 block', on && 'text-azure-glow')}
                            data-numeric
                          >
                            {group.map((p) => pad(p + 1)).join('–')}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Side panels: contents and search ────────────────────────── */}
        <AnimatePresence>
          {(panel === 'contents' || panel === 'search') && (
            <motion.aside
              key={panel}
              initial={{ opacity: 0, x: reduced ? 0 : 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduced ? 0 : 20 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute inset-y-0 right-0 z-30 flex w-full max-w-[24rem] flex-col border-l border-rule bg-void-1/96 backdrop-blur-xl"
              aria-label={panel === 'contents' ? 'Contents' : 'Search'}
            >
              <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-rule pl-5 pr-2">
                <h2 className="text-[0.9375rem] font-medium text-starlight">
                  {panel === 'contents' ? 'Contents' : 'Search this issue'}
                </h2>
                <ToolButton label="Close panel" onClick={() => setPanel(null)}>
                  <X className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
                </ToolButton>
              </div>

              {panel === 'contents' ? (
                <nav className="min-h-0 flex-1 overflow-y-auto py-2">
                  <OutlineList items={issue.outline} current={state.pages} onGo={(p) => goTo(p, true)} />
                </nav>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="border-b border-rule p-4">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-star-ghost" />
                      <input
                        autoFocus
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Words on the page"
                        aria-label="Search text"
                        className="w-full rounded-sm border border-rule-lit bg-void-2/70 py-2.5 pl-9 pr-3 text-[0.9375rem] text-starlight transition-colors duration-300 placeholder:text-star-ghost focus:border-azure-lit focus:outline-none"
                      />
                    </div>
                    {query.trim().length >= 2 && text && (
                      <p className="label-chart mt-3" data-numeric aria-live="polite">
                        {results.length} {results.length === 1 ? 'page' : 'pages'}
                      </p>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {textState === 'loading' && <p className="note px-5 py-6">Reading the issue…</p>}
                    {textState === 'error' && (
                      <p className="note px-5 py-6">The text for this issue didn&apos;t load. Close the panel and try again.</p>
                    )}
                    {text && query.trim().length >= 2 && results.length === 0 && (
                      <p className="note px-5 py-6">
                        Nothing matches “{query.trim()}”. Pages that are photographs of text can&apos;t be searched.
                      </p>
                    )}
                    <ul className="divide-y divide-[var(--color-rule)]">
                      {results.map((r) => (
                        <li key={r.page}>
                          <button
                            type="button"
                            onClick={() => goTo(r.page, window.innerWidth < 768)}
                            className={cn(
                              'block w-full px-5 py-4 text-left transition-colors duration-300 hover:bg-white/[0.035]',
                              state.pages.includes(r.page) && 'bg-azure/[0.08]'
                            )}
                          >
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="label-chart text-star-dim" data-numeric>
                                Page {pad(r.page + 1)}
                              </span>
                              {r.count > 1 && (
                                <span className="label-chart" data-numeric>
                                  ×{r.count}
                                </span>
                              )}
                            </span>
                            <span className="mt-2 block text-[0.875rem] leading-relaxed text-star-faint">
                              {r.before}
                              <mark className="rounded-[2px] bg-azure/30 px-0.5 text-starlight">{r.match}</mark>
                              {r.after}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <footer className="relative z-20 flex h-14 shrink-0 items-center gap-1 border-t border-rule px-2 sm:gap-3 sm:px-4 md:h-16 md:px-5">
        <ToolButton label="All pages" active={panel === 'thumbs'} onClick={() => openPanel('thumbs')}>
          <LayoutGrid className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
        </ToolButton>

        <ToolButton
          label="Previous page"
          onClick={() => book.current?.prev()}
          disabled={!state.canPrev || state.zoom > 1.01}
          className="lg:hidden"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.7} />
        </ToolButton>

        {/* Scrubber with a page preview riding above the thumb. */}
        <div
          className="relative hidden min-w-0 flex-1 items-center sm:flex"
          onPointerMove={(e) => {
            if (e.pointerType !== 'mouse' || n < 2) return;
            const r = e.currentTarget.getBoundingClientRect();
            const f = clampNum((e.clientX - r.left - 7) / (r.width - 14), 0, 1);
            setHover({ page: Math.round(f * (n - 1)), x: e.clientX - r.left });
          }}
          onPointerLeave={() => setHover(null)}
        >
          <input
            type="range"
            min={0}
            max={Math.max(0, n - 1)}
            step={1}
            value={scrubValue}
            aria-label="Page"
            aria-valuetext={announce}
            onChange={(e) => setScrub(Number(e.target.value))}
            onPointerUp={() => {
              if (scrub !== null) goTo(scrub);
              setScrub(null);
            }}
            onKeyUp={() => {
              if (scrub !== null) goTo(scrub);
              setScrub(null);
            }}
            onBlur={() => setScrub(null)}
            className="mag-range w-full"
            style={{ '--fill': `${fill}%` } as React.CSSProperties}
          />
          <AnimatePresence>
            {(hover || scrub !== null) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="pointer-events-none absolute bottom-[calc(100%+14px)] -translate-x-1/2 overflow-hidden rounded-[2px] border border-rule-lit bg-void-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]"
                style={{
                  left: scrub !== null && !hover ? `calc(${fill}% * 0.98 + 7px)` : hover?.x,
                }}
              >
                {(() => {
                  const p = scrub ?? hover?.page ?? 0;
                  return (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={issue.images[p].t}
                        alt=""
                        className="block w-24 bg-[#f3f4f6]"
                        style={{ aspectRatio: `${issue.pages[p].w} / ${issue.pages[p].h}` }}
                      />
                      <span className="label-chart block px-2 py-1.5 text-center" data-numeric>
                        {pad(p + 1)}
                      </span>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="label-chart min-w-[5.5rem] flex-1 text-center sm:flex-none" data-numeric>
          <span className="text-star-dim">{scrub !== null ? pad(scrub + 1) : pageLabel(state.pages)}</span>
          <span className="mx-1.5 text-star-ghost">/</span>
          {pad(n)}
        </p>

        <ToolButton
          label="Next page"
          onClick={() => book.current?.next()}
          disabled={!state.canNext || state.zoom > 1.01}
          className="lg:hidden"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.7} />
        </ToolButton>

        <div className="hidden items-center gap-0.5 border-l border-rule pl-2 sm:flex">
          <ToolButton label="Zoom out" onClick={() => book.current?.zoomBy(1 / 1.5)} disabled={state.zoom <= 1.01}>
            <ZoomOut className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
          </ToolButton>
          <button
            type="button"
            onClick={() => book.current?.resetZoom()}
            className="label-chart w-11 text-center transition-colors hover:text-starlight"
            aria-label="Reset zoom"
            title="Reset zoom"
            data-numeric
          >
            {Math.round(state.zoom * 100)}%
          </button>
          <ToolButton label="Zoom in" onClick={() => book.current?.zoomBy(1.5)} disabled={state.zoom >= 3.99}>
            <ZoomIn className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
          </ToolButton>
        </div>

        <ToolButton label={sound ? 'Mute page sound' : 'Turn page sound on'} onClick={toggleSound} active={false}>
          {sound ? (
            <Volume2 className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
          ) : (
            <VolumeX className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.7} />
          )}
        </ToolButton>
      </footer>

      {/* What is open, for a screen reader — and its words, once loaded. */}
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>
      {visibleText && <div className="sr-only">{visibleText}</div>}
    </div>
  );
}

const clampNum = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function OutlineList({
  items,
  current,
  onGo,
  depth = 0,
}: {
  items: MagazineOutlineItem[];
  current: number[];
  onGo: (page: number) => void;
  depth?: number;
}) {
  return (
    <ul>
      {items.map((item, i) => {
        const on = current.includes(item.page);
        return (
          <li key={`${item.page}-${i}`}>
            <button
              type="button"
              onClick={() => onGo(item.page)}
              aria-current={on ? 'page' : undefined}
              className={cn(
                'flex w-full items-baseline gap-4 py-3 pr-5 text-left transition-colors duration-300 hover:bg-white/[0.035]',
                on ? 'text-azure-glow' : depth === 0 ? 'text-starlight' : 'text-star-dim'
              )}
              style={{ paddingLeft: `${1.25 + depth * 1}rem` }}
            >
              <span className={cn('min-w-0 flex-1', depth === 0 ? 'text-[0.9375rem]' : 'text-[0.875rem]')}>
                {item.title}
              </span>
              <span className="label-chart shrink-0" data-numeric>
                {pad(item.page + 1)}
              </span>
            </button>
            {item.items && item.items.length > 0 && (
              <OutlineList items={item.items} current={current} onGo={onGo} depth={depth + 1} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
