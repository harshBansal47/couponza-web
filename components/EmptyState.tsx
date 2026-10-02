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
    <div className="border border-dashed border-ledger-line bg-paper-raised px-6 py-14 text-center">
      <p className="font-serif text-lg text-ink">{title}</p>
      {body ? <p className="mt-2 text-sm text-ink-soft">{body}</p> : null}
      {cta ? (
        <Link
          href={cta.href}
          className="mt-4 inline-block border border-ledger-line bg-paper px-4 py-2 text-sm text-inkblue hover:border-inkblue"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
