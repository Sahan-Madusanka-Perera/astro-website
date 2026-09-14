import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   A cover, as an object rather than a picture.

   A few hairlines of page edge down the fore-edge and a binding shade on the
   spine are enough to read as a magazine lying on the table. Flat at rest; on
   hover of the enclosing `group` it opens a few degrees toward the reader —
   interaction motion only, per the house rules.
--------------------------------------------------------------------------- */

export function IssueCover({
  src,
  aspect,
  alt,
  priority = false,
  className,
}: {
  src: string;
  /** width / height of the cover page */
  aspect: number;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative [perspective:1600px]', className)}>
      <div
        className="relative origin-left transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d] group-hover:[transform:rotateY(-14deg)] motion-reduce:group-hover:[transform:none]"
        style={{ aspectRatio: String(aspect) }}
      >
        {/* The rest of the issue, glimpsed past the cover as it opens. */}
        <div
          aria-hidden
          className="mag-edge absolute inset-y-[0.6%] right-[-3px] w-[5px] opacity-80"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className="relative block h-full w-full rounded-[2px] bg-[#f3f4f6] object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[2px] bg-[linear-gradient(to_right,rgba(0,0,0,0.28),rgba(0,0,0,0.06)_3%,rgba(255,255,255,0.08)_4.5%,rgba(0,0,0,0)_10%)] ring-1 ring-inset ring-black/10"
        />
      </div>
    </div>
  );
}
