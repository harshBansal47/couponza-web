import type { Metadata } from "next";
import Link from "next/link";
import { resilient } from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Stores",
  description: "Browse every store on Couponza.",
  alternates: { canonical: absoluteUrl("/stores") },
};

export default async function StoresIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { q } = await searchParams;
  const { items } = await resilient.listStores({ search: q, limit: 100 });

  const groups = new Map<string, typeof items>();
  for (const store of items) {
    const letter = store.name[0]?.toUpperCase() ?? "#";
    const key = /[A-Z]/.test(letter) ? letter : "#";
    groups.set(key, [...(groups.get(key) ?? []), store]);
  }
  const letters = [...groups.keys()].sort();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 font-serif text-3xl text-ink">Stores</h1>
      <form action="/stores" className="mb-10 max-w-md">
        <label htmlFor="store-filter" className="sr-only">Filter stores</label>
        <input
          id="store-filter"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Filter stores…"
          className="w-full border border-ledger-line bg-paper-raised px-4 py-3 font-mono text-sm text-ink focus:border-inkblue"
        />
      </form>

      {letters.length > 0 && (
        <nav className="mb-8 flex flex-wrap gap-2 font-mono text-sm" aria-label="Alphabet">
          {letters.map((l) => (
            <a key={l} href={`#letter-${l}`} className="border border-ledger-line px-2.5 py-1 text-ink-soft hover:border-inkblue hover:text-inkblue">
              {l}
            </a>
          ))}
        </nav>
      )}

      {items.length === 0 ? (
        <EmptyState title="No stores found." body="Try a different filter." cta={{ href: "/stores", label: "All stores" }} />
      ) : (
        letters.map((l) => (
          <section key={l} id={`letter-${l}`} className="mb-10">
            <h2 className="mb-3 border-b border-ledger-line pb-1 font-mono text-sm uppercase tracking-widest text-ink-soft">{l}</h2>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
              {groups.get(l)!.map((s) => (
                <li key={s.id}>
                  <Link href={`/stores/${s.slug}`} className="text-ink hover:text-inkblue">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
