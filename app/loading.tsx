import Skeleton from "@/components/ui/Skeleton";

/** Skeleton shaped like the real homepage/listing so nothing jumps when content arrives. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-64 w-full !rounded-[28px] sm:h-80" />
      <div className="mt-8 flex justify-center gap-5 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex w-[76px] shrink-0 flex-col items-center gap-2">
            <Skeleton className="h-16 w-16 !rounded-[22px]" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[20px] border border-ledger-line bg-white">
            <Skeleton className="h-24 w-full !rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-10 w-full !rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
