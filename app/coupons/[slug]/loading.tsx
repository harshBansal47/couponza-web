import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-56 w-full !rounded-[26px]" />
      <Skeleton className="mt-8 h-48 w-full !rounded-[22px]" />
      <Skeleton className="mt-8 h-32 w-full !rounded-[22px]" />
    </div>
  );
}
