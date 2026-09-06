'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   A portrait that degrades honestly.

   Most planets point at team photographs that haven't been taken yet, so the
   page used to render a column of broken-image glyphs. When the file is
   missing this falls back to the person's initials on a plate cut from the
   same azure — a placeholder that looks deliberate rather than failed.
--------------------------------------------------------------------------- */

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-z]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

/** A stable hue offset per person so a row of placeholders isn't uniform. */
function tilt(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % 26;
}

export function Avatar({
  src,
  name,
  className,
  sizes = '160px',
}: {
  src?: string;
  name: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;

  return (
    <span
      // container query unit below sizes the initials to whatever box we're in
      style={{ containerType: 'inline-size' }}
      className={cn(
        'relative block overflow-hidden rounded-full ring-1 ring-white/[0.12]',
        className
      )}
    >
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          sizes={sizes}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span
          className="absolute inset-0 grid place-items-center"
          style={{
            background: `linear-gradient(${140 + tilt(name) * 3}deg, #0b2036, #10395a 55%, #0d2b45)`,
          }}
          aria-label={name}
          role="img"
        >
          <span className="font-display text-[clamp(0.9rem,26cqw,2.5rem)] font-medium tracking-[0.06em] text-azure-glow/80">
            {initials(name) || '★'}
          </span>
        </span>
      )}
    </span>
  );
}
