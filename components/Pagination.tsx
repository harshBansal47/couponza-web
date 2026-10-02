import Link from "next/link";

interface PaginationProps {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  skip: number;
  limit: number;
  total: number;
}

export default function Pagination({ basePath, searchParams, skip, limit, total }: PaginationProps) {
  if (total <= limit && skip === 0) return null;

  function buildHref(newSkip: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (newSkip > 0) params.set("skip", String(newSkip));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + limit, total);
  const hasPrev = skip > 0;
  const hasNext = skip + limit < total;

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex items-center justify-between border-t border-ledger-line pt-4 text-sm"
    >
      <p className="text-ink-soft">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-4">
        {hasPrev ? (
          <Link href={buildHref(Math.max(skip - limit, 0))} className="text-inkblue hover:underline">
            Previous
          </Link>
        ) : (
          <span aria-disabled className="text-ledger-line">
            Previous
          </span>
        )}
        {hasNext ? (
          <Link href={buildHref(skip + limit)} className="text-inkblue hover:underline">
            Next
          </Link>
        ) : (
          <span aria-disabled className="text-ledger-line">
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
