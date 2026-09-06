'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { eventSchema, type EventFormValues } from '@/lib/validations';
import { EVENT_CATEGORIES } from '@/lib/constants';
import { Field, Check, inputClass } from './form-fields';
import { cn } from '@/lib/utils';
import type { Event } from '@/types/event';

interface EventFormProps {
  event?: Event;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export function EventForm({ event, onSubmit, onCancel }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(event?.image_url ?? null);
  const [dropping, setDropping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          title: event.title,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          category: event.category,
          registration_link: event.registration_link || '',
          is_featured: event.is_featured,
        }
      : { is_featured: false },
  });

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

  const onFormSubmit = async (data: EventFormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, String(value));
      });
      const file = fileRef.current?.files?.[0];
      if (file) formData.append('image', file);

      await onSubmit(formData);
      toast.success(event ? 'Event updated' : 'Event created');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save the event. Try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6" noValidate>
      <Field label="Title" htmlFor="title" error={errors.title?.message}>
        <input
          id="title"
          {...register('title')}
          aria-invalid={!!errors.title}
          className={cn(inputClass, errors.title && 'border-destructive/70')}
          placeholder="Perseid meteor watch"
        />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        error={errors.description?.message}
        hint="Shown in full when someone opens the event. Line breaks are kept."
      >
        <textarea
          id="description"
          rows={5}
          {...register('description')}
          aria-invalid={!!errors.description}
          className={cn(inputClass, 'resize-y', errors.description && 'border-destructive/70')}
          placeholder="What happens, who it's for, and what to bring."
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Date" htmlFor="date" error={errors.date?.message}>
          <input
            id="date"
            type="date"
            {...register('date')}
            aria-invalid={!!errors.date}
            className={cn(inputClass, errors.date && 'border-destructive/70')}
          />
        </Field>
        <Field label="Time" htmlFor="time" error={errors.time?.message}>
          <input
            id="time"
            type="time"
            {...register('time')}
            aria-invalid={!!errors.time}
            className={cn(inputClass, errors.time && 'border-destructive/70')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Location" htmlFor="location" error={errors.location?.message}>
          <input
            id="location"
            {...register('location')}
            aria-invalid={!!errors.location}
            className={cn(inputClass, errors.location && 'border-destructive/70')}
            placeholder="Rooftop, Faculty of Applied Sciences"
          />
        </Field>

        <Field label="Category" htmlFor="category" error={errors.category?.message}>
          <select
            id="category"
            {...register('category')}
            className={cn(inputClass, 'appearance-none')}
          >
            {Object.entries(EVENT_CATEGORIES).map(([key, { label }]) => (
              <option key={key} value={key} className="bg-void-2">
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Registration link"
        htmlFor="registration_link"
        error={errors.registration_link?.message}
        hint="Optional. A Google Form or ticket page — leave empty if there's no sign-up."
      >
        <input
          id="registration_link"
          type="url"
          {...register('registration_link')}
          className={cn(inputClass, errors.registration_link && 'border-destructive/70')}
          placeholder="https://forms.gle/…"
        />
      </Field>

      {/* ── Image ──────────────────────────────────────────────────────── */}
      <Field label="Event image" htmlFor="image" hint="Optional. Landscape crops best — around 1600×900.">
        <input
          ref={fileRef}
          id="image"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => takeFile(e.target.files?.[0])}
        />

        {preview ? (
          <div className="relative overflow-hidden rounded-sm border border-rule">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="aspect-[16/9] w-full object-cover" />
            <div className="flex items-center justify-between gap-3 border-t border-rule bg-void-1 px-4 py-3">
              <span className="label-chart truncate">
                {fileRef.current?.files?.[0]?.name ?? 'Current image'}
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
              'flex w-full flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-6 py-12 transition-colors duration-300',
              dropping
                ? 'border-azure-lit bg-azure/[0.08]'
                : 'border-rule-lit hover:border-azure-lit/55'
            )}
          >
            <ImagePlus className="h-6 w-6 text-star-ghost" strokeWidth={1.5} />
            <span className="text-[0.9375rem] text-star-dim">
              Drop an image here, or choose a file
            </span>
          </button>
        )}
      </Field>

      <Check
        id="is_featured"
        label="Feature on the home page"
        description="Featured events appear at the top of the public events section."
        {...register('is_featured')}
      />

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
          {isSubmitting ? 'Saving' : event ? 'Save changes' : 'Create event'}
        </button>
      </div>
    </form>
  );
}
