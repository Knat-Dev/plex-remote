/** Shimmering placeholder grid shown while a library loads. */
export function PosterSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="aspect-2/3 w-full animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--color-surface-2)]" />
        </div>
      ))}
    </div>
  );
}
