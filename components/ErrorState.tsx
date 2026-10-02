import Link from "next/link";

export default function ErrorState({ reset }: { reset?: () => void }) {
  return (
    <div className="border border-dashed border-ledger-line bg-paper-raised px-6 py-14 text-center">
      <p className="font-serif text-lg text-ink">Something went wrong.</p>
      <p className="mt-2 text-sm text-ink-soft">This is on us, not you. Try again in a moment.</p>
      {reset ? (
        <button
          onClick={reset}
          className="mt-4 inline-block border border-ledger-line bg-paper px-4 py-2 text-sm text-inkblue hover:border-inkblue"
        >
          Try again
        </button>
      ) : (
        <Link
          href="/"
          className="mt-4 inline-block border border-ledger-line bg-paper px-4 py-2 text-sm text-inkblue hover:border-inkblue"
        >
          Back to deals
        </Link>
      )}
    </div>
  );
}
