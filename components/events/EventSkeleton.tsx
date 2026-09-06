/* A loading placeholder shaped like the card it stands in for, so the layout
   doesn't jump when the data lands. The shimmer is one slow sweep, not a
   pulse — closer to a long exposure than to a heartbeat. */
export function EventSkeleton() {
  return (
    <div className="panel overflow-hidden" aria-hidden="true">
      <div className="relative aspect-[16/10] bg-white/[0.035]">
        <div className="absolute inset-0 animate-[shimmer_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      </div>
      <div className="space-y-3.5 p-5 md:p-6">
        <div className="h-4 w-3/4 rounded-full bg-white/[0.06]" />
        <div className="h-2.5 w-1/2 rounded-full bg-white/[0.045]" />
        <div className="h-2.5 w-full rounded-full bg-white/[0.035]" />
        <div className="h-2.5 w-5/6 rounded-full bg-white/[0.035]" />
      </div>
    </div>
  );
}
