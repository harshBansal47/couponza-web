export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12" aria-busy="true" aria-live="polite">
      <div className="h-8 w-56 animate-pulse bg-ledger-line" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-full animate-pulse bg-ledger-line" />
            <div className="h-4 w-2/3 animate-pulse bg-ledger-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
