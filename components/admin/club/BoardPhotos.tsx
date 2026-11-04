'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, RefreshCw, Star, Trash2 } from 'lucide-react';
import { uploadClubImage } from '@/lib/club/upload';
import { inputClass } from '@/components/admin/form-fields';
import { cn } from '@/lib/utils';
import { iconButton, moveItem, pillButton, uid, useUploads } from './ui';

export interface DraftImage {
  id: string;
  url: string;
  title: string;
  caption: string;
}

/** The year's board photographs: upload several at once, title, caption, reorder, replace, remove. */
export function BoardPhotos({ images, onChange }: { images: DraftImage[]; onChange: (images: DraftImage[]) => void }) {
  const { track } = useUploads();
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replacing = useRef<string | null>(null);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [dropping, setDropping] = useState(false);

  // Uploads finish one after another; keep the newest list so none overwrite each other.
  const latest = useRef(images);
  useEffect(() => {
    latest.current = images;
  }, [images]);
  const commit = (next: DraftImage[]) => {
    latest.current = next;
    onChange(next);
  };

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    const failed: string[] = [];
    await track(
      (async () => {
        for (const [i, file] of files.entries()) {
          setStatus(`Uploading ${i + 1} of ${files.length}`);
          try {
            const url = await uploadClubImage(file, 'boards');
            commit([...latest.current, { id: uid(), url, title: '', caption: '' }]);
          } catch (err) {
            failed.push((err as Error).message);
          }
        }
      })()
    );
    setStatus('');
    setErrors(failed);
  };

  const replace = async (file?: File) => {
    const id = replacing.current;
    replacing.current = null;
    if (!file || !id) return;
    setStatus('Replacing photo');
    try {
      const url = await track(uploadClubImage(file, 'boards'));
      commit(latest.current.map((img) => (img.id === id ? { ...img, url } : img)));
      setErrors([]);
    } catch (err) {
      setErrors([(err as Error).message]);
    }
    setStatus('');
  };

  const update = (id: string, patch: Partial<DraftImage>) => commit(images.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div>
      <button
        type="button"
        disabled={!!status}
        onClick={() => addInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDropping(false);
          void addFiles([...e.dataTransfer.files].filter((f) => f.type.startsWith('image/')));
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2.5 rounded-sm border border-dashed px-6 py-10 transition-colors duration-300 disabled:cursor-progress',
          dropping ? 'border-azure-lit bg-azure/[0.08]' : 'border-rule-lit hover:border-azure-lit/55'
        )}
      >
        {status ? <Loader2 className="h-6 w-6 animate-spin text-azure-lit" /> : <ImagePlus className="h-6 w-6 text-star-ghost" strokeWidth={1.5} />}
        <span className="text-[0.9375rem] text-star-dim">{status || 'Drop board photos here, or choose files'}</span>
        <span className="note">Several at once is fine. Large photos are resized automatically. The first photo is the year’s cover.</span>
      </button>
      <input
        ref={addInput}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void addFiles([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
      <input
        ref={replaceInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void replace(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {errors.map((m, i) => (
        <p key={i} className="mt-2 text-[0.8125rem] text-destructive">
          {m}
        </p>
      ))}

      {images.length > 0 && (
        <ul className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {images.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-sm border border-rule bg-void-1">
              <div className="relative aspect-video bg-void-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.title} className="absolute inset-0 h-full w-full object-contain" />
                {i === 0 && (
                  <span className="label-chart absolute left-3 top-3 rounded-full border border-white/15 bg-void/70 px-2.5 py-1 text-azure-haze backdrop-blur-md">
                    Cover
                  </span>
                )}
              </div>
              <div className="space-y-3 p-4">
                <input
                  aria-label={`Title of photo ${i + 1}`}
                  className={inputClass}
                  placeholder="Title — e.g. Top Board"
                  value={img.title}
                  onChange={(e) => update(img.id, { title: e.target.value })}
                />
                <input
                  aria-label={`Caption of photo ${i + 1}`}
                  className={inputClass}
                  placeholder="Caption — e.g. President, secretary and treasurer"
                  value={img.caption}
                  onChange={(e) => update(img.id, { caption: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <button type="button" className={iconButton} disabled={i === 0} onClick={() => commit(moveItem(images, i, i - 1))} aria-label="Move earlier">
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                  <button type="button" className={iconButton} disabled={i === images.length - 1} onClick={() => commit(moveItem(images, i, i + 1))} aria-label="Move later">
                    <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                  {i > 0 && (
                    <button type="button" className={pillButton} onClick={() => commit(moveItem(images, i, 0))}>
                      <Star className="h-3.5 w-3.5" /> Make cover
                    </button>
                  )}
                  <button
                    type="button"
                    className={pillButton}
                    disabled={!!status}
                    onClick={() => {
                      replacing.current = img.id;
                      replaceInput.current?.click();
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Replace
                  </button>
                  <button
                    type="button"
                    className={cn(iconButton, 'ml-auto hover:border-destructive/60 hover:text-destructive')}
                    onClick={() => confirm('Remove this photo?') && commit(images.filter((x) => x.id !== img.id))}
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
