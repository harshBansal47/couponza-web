import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-serif text-3xl text-ink">That page doesn&apos;t exist</h1>
      <p className="mt-3 text-ink-soft">
        The deal, store, or category you&apos;re looking for isn&apos;t here — it may have expired
        or moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        Back to deals
      </Link>
    </div>
  );
}
