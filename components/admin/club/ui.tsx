'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadClubImage } from '@/lib/club/upload';
import type { ClubUploadFolder } from '@/lib/club/shared';
import { cn } from '@/lib/utils';

/* Small pieces shared by the board and planet editors. */

export const pillButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-rule-lit px-4 py-2 text-[0.8125rem] text-star-dim transition-colors hover:border-azure-lit/55 hover:text-starlight disabled:cursor-not-allowed disabled:opacity-45';
export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-azure px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-azure';
export const iconButton =
  'grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-rule-lit text-star-faint transition-colors hover:border-azure-lit/55 hover:text-starlight disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-rule-lit disabled:hover:text-star-faint';

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function uid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `new-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function OrderControls({
  index,
  count,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button type="button" className={iconButton} disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label={`Move ${label} up`}>
        <ArrowUp className="h-4 w-4" strokeWidth={1.7} />
      </button>
      <button type="button" className={iconButton} disabled={index === count - 1} onClick={() => onMove(index, index + 1)} aria-label={`Move ${label} down`}>
        <ArrowDown className="h-4 w-4" strokeWidth={1.7} />
      </button>
      <button
        type="button"
        className={cn(iconButton, 'hover:border-destructive/60 hover:text-destructive')}
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.7} />
      </button>
    </div>
  );
}

/* ── Upload tracking: Save waits for photos still on their way up ───────── */

const UploadContext = createContext<{ pending: number; track: <T>(p: Promise<T>) => Promise<T> }>({
  pending: 0,
  track: (p) => p,
});

export function UploadTracker({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);
  const track = useCallback(<T,>(p: Promise<T>) => {
    setPending((n) => n + 1);
    return p.finally(() => setPending((n) => n - 1));
  }, []);
  return <UploadContext.Provider value={{ pending, track }}>{children}</UploadContext.Provider>;
}

export const useUploads = () => useContext(UploadContext);

/** One image: preview, upload, replace, remove. */
export function ImagePicker({
  value,
  onChange,
  folder,
  label,
  round = false,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: ClubUploadFolder;
  label: string;
  round?: boolean;
  className?: string;
}) {
  const { track } = useUploads();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await track(uploadClubImage(file, folder)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('flex shrink-0 flex-col items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={value ? `Replace ${label}` : `Upload ${label}`}
        className={cn(
          'relative grid h-28 w-28 place-items-center overflow-hidden border border-dashed border-rule-lit bg-void-2/70 text-star-ghost transition-colors hover:border-azure-lit/60',
          round ? 'rounded-full' : 'rounded-sm'
        )}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-azure-lit" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-2 text-center text-[0.75rem]">
            <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
            {label}
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {value && !busy && (
        <div className="flex gap-3 text-[0.75rem]">
          <button type="button" className="text-star-faint hover:text-starlight" onClick={() => input.current?.click()}>
            Replace
          </button>
          <button type="button" className="text-star-faint hover:text-destructive" onClick={() => onChange('')}>
            Remove
          </button>
        </div>
      )}
      {error && <p className="max-w-[9rem] text-center text-[0.75rem] text-destructive">{error}</p>}
    </div>
  );
}

export function SetupNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-start gap-4 rounded-sm border border-destructive/30 bg-destructive/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="note max-w-[64ch]">{message}</p>
      <button onClick={onRetry} className={pillButton}>
        Try again
      </button>
    </div>
  );
}
