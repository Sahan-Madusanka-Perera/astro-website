'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { gallerySchema, type GalleryFormValues } from '@/lib/validations';
import { Field, inputClass } from './form-fields';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export function ImageUpload({ onSubmit, onCancel }: ImageUploadProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GalleryFormValues>({ resolver: zodResolver(gallerySchema) });

  const takeFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('That file isn’t an image.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onFormSubmit = async (data: GalleryFormValues) => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Choose an image to upload first.');
      return;
    }
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.event_id) formData.append('event_id', data.event_id);
      if (data.tags) formData.append('tags', JSON.stringify(data.tags));
      formData.append('image', file);

      await onSubmit(formData);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6" noValidate>
      <Field label="Image" htmlFor="gallery-image" hint="JPEG or PNG. The gallery keeps the original aspect ratio.">
        <input
          ref={fileRef}
          id="gallery-image"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => takeFile(e.target.files?.[0])}
        />

        {preview ? (
          <div className="relative overflow-hidden rounded-sm border border-rule">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-80 w-full object-contain bg-void-2" />
            <div className="flex items-center justify-between gap-3 border-t border-rule bg-void-1 px-4 py-3">
              <span className="label-chart truncate">
                {fileRef.current?.files?.[0]?.name}
              </span>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-sm border border-rule-lit px-3 py-1.5 text-[0.8125rem] text-star-dim transition-colors hover:border-azure-lit/55 hover:text-starlight"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  aria-label="Remove image"
                  className="grid h-8 w-8 place-items-center rounded-sm border border-rule-lit text-star-faint transition-colors hover:border-destructive/55 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDropping(true); }}
            onDragLeave={() => setDropping(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDropping(false);
              const file = e.dataTransfer.files?.[0];
              if (file && fileRef.current) {
                fileRef.current.files = e.dataTransfer.files;
                takeFile(file);
              }
            }}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-14 transition-colors duration-300',
              dropping ? 'border-azure-lit bg-azure/[0.08]' : 'border-rule-lit hover:border-azure-lit/55'
            )}
          >
            <ImagePlus className="h-6 w-6 text-star-ghost" strokeWidth={1.5} />
            <span className="text-[0.9375rem] text-star-dim">
              Drop an image here, or choose a file
            </span>
          </button>
        )}
      </Field>

      <Field label="Title" htmlFor="title" error={errors.title?.message}>
        <input
          id="title"
          {...register('title')}
          aria-invalid={!!errors.title}
          className={cn(inputClass, errors.title && 'border-destructive/70')}
          placeholder="Orion Nebula, 240s stack"
        />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        hint="Optional. Equipment, exposure, and who took it — the details people actually want."
      >
        <textarea
          id="description"
          rows={3}
          {...register('description')}
          className={cn(inputClass, 'resize-y')}
          placeholder="Shot from the campus roof on a 200mm reflector."
        />
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-rule-lit px-6 py-3 text-[0.9375rem] text-star-dim transition-colors duration-300 hover:border-azure-lit/55 hover:text-starlight"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-azure px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors duration-400 hover:bg-azure-lit disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-azure"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Uploading' : 'Upload image'}
        </button>
      </div>
    </form>
  );
}
