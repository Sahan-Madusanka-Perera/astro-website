'use client';

import { cn } from '@/lib/utils';

/* The admin's one set of form primitives. Every input on every admin screen
   comes from here, so a field looks the same wherever an editor meets it. */

export const inputClass =
  'w-full rounded-sm border border-rule-lit bg-void-2/70 px-3.5 py-2.5 text-[0.9375rem] text-starlight transition-colors duration-300 placeholder:text-star-ghost focus:border-azure-lit focus:outline-none disabled:opacity-55';

export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label-chart block">
        {label}
      </label>
      <div className="mt-2.5">{children}</div>
      {hint && !error && (
        <p className="mt-2 text-[0.8125rem] text-star-faint">{hint}</p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-2 text-[0.8125rem] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** A checkbox with a real hit area and a visible checked state. */
export function Check({
  id,
  label,
  description,
  ...props
}: {
  id: string;
  label: string;
  description?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3.5 rounded-sm border border-rule p-4',
        'transition-colors duration-300 hover:border-rule-lit'
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded-[3px] border border-rule-lit bg-void-2 accent-[var(--color-azure)]"
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-[0.9375rem] leading-snug text-starlight">{label}</span>
        {description && (
          <span className="mt-1.5 block text-[0.8125rem] leading-relaxed text-star-faint">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
