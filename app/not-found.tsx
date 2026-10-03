import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <p
        aria-hidden="true"
        className="text-gradient animate-float font-serif text-[8rem] font-extrabold leading-none sm:text-[10rem]"
      >
        404
      </p>
      <h1 className="mt-2 font-serif text-3xl font-extrabold text-ink">That page doesn&apos;t exist</h1>
      <p className="mt-3 text-ink-soft">
        The deal, store, or category you&apos;re looking for isn&apos;t here — it may have expired
        or moved.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary px-6 py-3">
          Back to deals
        </Link>
        <Link href="/search" className="btn btn-outline px-6 py-3">
          Search instead
        </Link>
      </div>
    </div>
  );
}
