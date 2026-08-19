export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="skeleton h-4 w-10 rounded" />
        <div className="skeleton h-4 w-4 rounded-full" />
      </div>
      <div className="skeleton mx-auto mb-3 h-24 w-24 rounded-xl" />
      <div className="skeleton mx-auto mb-2 h-4 w-2/3 rounded" />
      <div className="flex justify-center gap-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function CardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
