import Link from "next/link";

export default function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-[24px] border-2 border-dashed border-ledger-line bg-white px-6 py-14 text-center">
      <span aria-hidden="true" className="bg-brand mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-[var(--shadow-glow)]">
        ∅
      </span>
      <p className="mt-4 font-serif text-xl font-extrabold text-ink">{title}</p>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{body}</p> : null}
      {cta ? (
        <Link href={cta.href} className="btn btn-primary mt-5">
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
