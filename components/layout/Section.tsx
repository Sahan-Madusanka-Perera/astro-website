import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
   The page's structural grammar. Every section on the site is built from
   these three pieces so the scroll has one rhythm rather than six.

   The heading carries its own weight — there are no eyebrow labels above it.
--------------------------------------------------------------------------- */

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('relative isolate', className)}>
      {children}
    </section>
  );
}

/** The one content measure on the site. */
export function Shell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[80rem] px-6 md:px-10', className)}>
      {children}
    </div>
  );
}

/**
 * An asymmetric heading block: title on the left of the grid, lede offset into
 * the right. Deliberately not centred — centred headings are what every page
 * does, and the offset gives the eye a reading order.
 */
export function SectionHead({
  title,
  lede,
  aside,
  className,
}: {
  title: React.ReactNode;
  lede?: React.ReactNode;
  /** Small right-hand slot: a count, a link, a coordinate. */
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('relative', className)}>
      <div className="rule-h" />
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 pt-8 md:grid-cols-12 md:pt-10">
        <h2 className="display display-xl col-span-1 text-[clamp(2.1rem,6.4vw,4.25rem)] md:col-span-6">
          {title}
        </h2>

        {(lede || aside) && (
          <div className="col-span-1 flex flex-col gap-6 md:col-span-5 md:col-start-8 md:pt-2">
            {lede && (
              <p className="max-w-[46ch] text-[1.0625rem] leading-[1.65] text-star-dim">
                {lede}
              </p>
            )}
            {aside}
          </div>
        )}
      </div>
    </header>
  );
}
