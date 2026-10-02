import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import CouponRow from "@/components/CouponRow";
import SectionTitle from "@/components/SectionTitle";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "Search",
  description: "Search stores, coupons, deals and categories.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <form action="/search" className="mb-10">
        <label htmlFor="site-search" className="sr-only">Search Couponza</label>
        <input
          id="site-search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search Nike, laptops, Amazon…"
          className="w-full border border-ledger-line bg-paper-raised px-5 py-4 font-mono text-sm text-ink focus:border-inkblue"
        />
      </form>
      {query ? <Results query={query} /> : (
        <p className="text-sm text-ink-soft">Type above and press enter — results appear here.</p>
      )}
    </div>
  );
}

async function Results({ query }: { query: string }) {
  const [coupons, stores, categories, products] = await Promise.all([
    api.listCoupons({ search: query, limit: 8 }),
    api.listStores({ search: query, limit: 8 }),
    api.listCategories({ limit: 100 }),
    api.listProducts({ search: query, limit: 8 }),
  ]);
  const matchingCategories = categories.items.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );
  const storeById = new Map((await api.listStores({ limit: 100 })).items.map((s) => [s.id, s]));
  const empty =
    coupons.items.length + stores.items.length + matchingCategories.length + products.items.length === 0;

  if (empty) {
    return (
      <EmptyState
        title={`No results for "${query}".`}
        body="Try a store name, a brand, or a category."
        cta={{ href: "/", label: "Back home" }}
      />
    );
  }

  return (
    <div className="space-y-12">
      {stores.items.length > 0 && (
        <section>
          <SectionTitle hint={String(stores.total)}>Stores</SectionTitle>
          <ul className="divide-y divide-ledger-line border-y border-ledger-line">
            {stores.items.map((s) => (
              <li key={s.id}>
                <Link href={`/stores/${s.slug}`} className="block py-3 text-ink hover:text-inkblue">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {coupons.items.length > 0 && (
        <section>
          <SectionTitle hint={String(coupons.total)}>Coupons</SectionTitle>
          {coupons.items.map((c) => {
            const store = storeById.get(c.store_id);
            return (
              <CouponRow key={c.id} coupon={c} store={store ? { name: store.name, logoUrl: store.logo_url } : undefined} />
            );
          })}
        </section>
      )}
      {products.items.length > 0 && (
        <section>
          <SectionTitle hint={String(products.total)}>Deals</SectionTitle>
          <ul className="divide-y divide-ledger-line border-y border-ledger-line">
            {products.items.map((p) => (
              <li key={p.id} className="flex items-baseline justify-between py-3">
                <Link href={`/stores/${storeById.get(p.store_id)?.slug ?? ""}`} className="text-ink hover:text-inkblue">
                  {p.name}
                </Link>
                <span className="font-mono text-sm text-ink">
                  {p.current_price != null ? `₹${p.current_price.toLocaleString("en-IN")}` : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {matchingCategories.length > 0 && (
        <section>
          <SectionTitle>Categories</SectionTitle>
          <ul className="divide-y divide-ledger-line border-y border-ledger-line">
            {matchingCategories.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link href={`/categories/${c.slug}`} className="block py-3 text-ink hover:text-inkblue">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
