import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import CouponCard, { CouponCardGrid } from "@/components/CouponCard";
import SectionTitle from "@/components/SectionTitle";
import EmptyState from "@/components/EmptyState";
import { ServerTabs } from "@/components/ui/Tabs";
import { Dropdown } from "@/components/ui/Dropdown";
import type { CouponPublic, Store, Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search",
  description: "Search stores, coupons, deals and categories.",
};

interface SearchPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, store, category, type, sort, verified } = await searchParams;
  const query = (q ?? "").trim();

  // Fetch initial data for filter options
  const [storesList, categoriesList] = await Promise.all([
    api.listStores({ limit: 100 }),
    api.listCategories({ limit: 100 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Search Form */}
      <form action="/search" className="mb-10">
        <input type="hidden" name="store" value={store ?? ""} />
        <input type="hidden" name="category" value={category ?? ""} />
        <input type="hidden" name="type" value={type ?? ""} />
        <input type="hidden" name="sort" value={sort ?? ""} />
        <input type="hidden" name="verified" value={verified ?? ""} />
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

      {query ? (
        <Results
          query={query}
          store={store}
          category={category}
          type={type}
          sort={sort}
          verified={verified === "true"}
          stores={storesList.items}
          categories={categoriesList.items}
        />
      ) : (
        <div className="text-center py-16">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-ledger-line" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <p className="mt-4 text-lg text-ink-soft">Type above and press enter — results appear here.</p>
          <p className="mt-2 text-sm text-ink-soft">Try a store name, a brand, a product, or a category.</p>
        </div>
      )}
    </div>
  );
}

interface ResultsProps {
  query: string;
  store?: string;
  category?: string;
  type?: string;
  sort?: string;
  verified?: boolean;
  stores: Store[];
  categories: Category[];
}

async function Results({ query, store, category, type, sort, verified, stores, categories }: ResultsProps) {
  const [coupons, products, matchingStores, matchingCategories] = await Promise.all([
    api.listCoupons({
      search: query,
      store_id: store,
      category_id: category,
      active_only: true,
      limit: 50,
    }),
    api.listProducts({
      search: query,
      store_id: store,
      category_id: category,
      limit: 20,
    }),
    api.listStores({ search: query, limit: 10 }),
    api.listCategories({ limit: 100 }),
  ]);

  const storeById = new Map(stores.map((s) => [s.id, s]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  // Apply client-side sorting
  let sortedCoupons = [...coupons.items];
  switch (sort) {
    case "newest":
      sortedCoupons.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case "discount":
      sortedCoupons.sort((a, b) => {
        const discountA = a.discount_type === "percentage" ? a.discount_value ?? 0 : 0;
        const discountB = b.discount_type === "percentage" ? b.discount_value ?? 0 : 0;
        return discountB - discountA;
      });
      break;
    case "expiring":
      sortedCoupons.sort((a, b) => {
        if (!a.expires_at && !b.expires_at) return 0;
        if (!a.expires_at) return 1;
        if (!b.expires_at) return -1;
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      });
      break;
    case "verified":
      sortedCoupons.sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0));
      break;
    case "relevance":
    default:
      // Keep API order (relevance)
      break;
  }

  if (verified) {
    sortedCoupons = sortedCoupons.filter((c) => c.last_verified_at !== null);
  }

  // Filter matching categories
  const matchedCategories = matchingCategories.items.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const empty = sortedCoupons.length + matchingStores.items.length + matchedCategories.length + products.items.length === 0;

  if (empty) {
    return (
      <EmptyState
        title={`No results for "${query}".`}
        body="Try a store name, a brand, or a category."
        cta={{ href: "/", label: "Back home" }}
      />
    );
  }

  // Filter options
  const discountTypes = [
    { value: "percentage", label: "Percentage Off" },
    { value: "fixed", label: "Fixed Amount" },
    { value: "deal", label: "Deal (No Code)" },
  ];

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "newest", label: "Newest First" },
    { value: "discount", label: "Highest Discount" },
    { value: "expiring", label: "Expiring Soon" },
    { value: "verified", label: "Best Verified" },
  ];

  const storeOptions = stores.map((s) => ({ value: s.slug, label: s.name }));
  const categoryOptions = categories.map((c) => ({ value: c.slug, label: c.name }));

  return (
    <div className="flex gap-8">
      {/* Sidebar Filters */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24 space-y-6">
          {/* Store Filter */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink-soft mb-3">Store</h3>
            <Dropdown
              trigger={({ open, onClick }) => (
                <button
                  type="button"
                  onClick={onClick}
                  className="btn-outline w-full justify-between"
                  aria-expanded={open}
                >
                  <span>{store ? storeById.get(store)?.name || "All stores" : "All stores"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={open ? "rotate-180" : ""} aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
              options={[
                { value: "", label: "All stores" },
                { divider: true },
                ...storeOptions,
              ]}
              onSelect={(value) => {
                const params = new URLSearchParams(window.location.search);
                if (value) params.set("store", value);
                else params.delete("store");
                window.location.search = params.toString();
              }}
              value={store}
              searchable
              placeholder="Search stores…"
            />
          </section>

          {/* Category Filter */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink-soft mb-3">Category</h3>
            <Dropdown
              trigger={({ open, onClick }) => (
                <button
                  type="button"
                  onClick={onClick}
                  className="btn-outline w-full justify-between"
                  aria-expanded={open}
                >
                  <span>{category ? categoryById.get(category)?.name || "All categories" : "All categories"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={open ? "rotate-180" : ""} aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
              options={[
                { value: "", label: "All categories" },
                { divider: true },
                ...categoryOptions,
              ]}
              onSelect={(value) => {
                const params = new URLSearchParams(window.location.search);
                if (value) params.set("category", value);
                else params.delete("category");
                window.location.search = params.toString();
              }}
              value={category}
              searchable
              placeholder="Search categories…"
            />
          </section>

          {/* Discount Type Filter */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink-soft mb-3">Discount Type</h3>
            <Dropdown
              trigger={({ open, onClick }) => (
                <button
                  type="button"
                  onClick={onClick}
                  className="btn-outline w-full justify-between"
                  aria-expanded={open}
                >
                  <span>{type ? discountTypes.find((d) => d.value === type)?.label || "All types" : "All types"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={open ? "rotate-180" : ""} aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
              options={[
                { value: "", label: "All types" },
                { divider: true },
                ...discountTypes,
              ]}
              onSelect={(value) => {
                const params = new URLSearchParams(window.location.search);
                if (value) params.set("type", value);
                else params.delete("type");
                window.location.search = params.toString();
              }}
              value={type}
            />
          </section>

          {/* Sort Filter */}
          <section>
            <h3 className="font-mono text-xs uppercase tracking-wider text-ink-soft mb-3">Sort By</h3>
            <Dropdown
              trigger={({ open, onClick }) => (
                <button
                  type="button"
                  onClick={onClick}
                  className="btn-outline w-full justify-between"
                  aria-expanded={open}
                >
                  <span>{sortOptions.find((s) => s.value === (sort || "relevance"))?.label || "Relevance"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={open ? "rotate-180" : ""} aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
              options={sortOptions}
              onSelect={(value) => {
                const params = new URLSearchParams(window.location.search);
                if (value && value !== "relevance") params.set("sort", value);
                else params.delete("sort");
                window.location.search = params.toString();
              }}
              value={sort || "relevance"}
            />
          </section>

          {/* Verified Only */}
          <section>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => {
                  const params = new URLSearchParams(window.location.search);
                  if (e.target.checked) params.set("verified", "true");
                  else params.delete("verified");
                  window.location.search = params.toString();
                }}
                className="w-4 h-4 rounded border-ledger-line text-verified focus:ring-verified focus:ring-2"
              />
              <span className="text-sm text-ink">Verified only</span>
            </label>
          </section>

          {/* Clear Filters */}
          {store || category || type || sort || verified ? (
            <button
              type="button"
              onClick={() => (window.location.href = `/search?q=${encodeURIComponent(query)}`)}
              className="btn-ghost w-full text-sm"
            >
              Clear all filters
            </button>
          ) : null}
        </div>
      </aside>

      {/* Results */}
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">Results for "{query}"</h1>
            <p className="text-sm text-ink-soft">
              {coupons.total + matchingStores.total + matchedCategories.length + products.total} result{coupons.total + matchingStores.total + matchedCategories.length + products.total !== 1 ? "s" : ""}
            </p>
          </div>
          {/* Mobile filter button */}
          <button className="lg:hidden btn-outline" aria-label="Open filters">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1" aria-hidden="true">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filters
          </button>
        </div>

        {matchingStores.items.length > 0 && (
          <section className="mb-10">
            <SectionTitle hint={String(matchingStores.total)}>Stores</SectionTitle>
            <ul className="divide-y divide-ledger-line border border-ledger-line rounded-sm overflow-hidden">
              {matchingStores.items.map((s) => (
                <li key={s.id}>
                  <Link href={`/stores/${s.slug}`} className="block px-4 py-3 flex items-center gap-3 text-ink hover:bg-paper-raised">
                    {s.logo_url ? (
                      <Image src={s.logo_url} alt="" width={32} height={32} className="rounded-full border border-ledger-line" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-sm text-ink-soft">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{s.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {sortedCoupons.length > 0 && (
          <section className="mb-10">
            <SectionTitle hint={String(coupons.total)}>Coupons</SectionTitle>
            <CouponCardGrid
              coupons={sortedCoupons}
              stores={stores}
              variant="coupon"
              columns={{ base: 1, sm: 1, lg: 1 }}
            />
          </section>
        )}

        {products.items.length > 0 && (
          <section className="mb-10">
            <SectionTitle hint={String(products.total)}>Products</SectionTitle>
            <ul className="divide-y divide-ledger-line border border-ledger-line rounded-sm overflow-hidden">
              {products.items.map((p) => {
                const store = storeById.get(p.store_id);
                return (
                  <li key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-paper-raised">
                    <div className="flex items-center gap-3 min-w-0">
                      {store?.logo_url ? (
                        <Image src={store.logo_url} alt="" width={32} height={32} className="rounded-full border border-ledger-line" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-sm text-ink-soft">
                          {store?.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link href={`/stores/${store?.slug ?? ""}`} className="font-medium text-ink hover:text-inkblue truncate block">
                          {p.name}
                        </Link>
                        <p className="text-xs text-ink-soft">{store?.name}</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-ink shrink-0 ml-4">
                      {p.current_price != null ? `₹${p.current_price.toLocaleString("en-IN")}` : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {matchedCategories.length > 0 && (
          <section className="mb-10">
            <SectionTitle>Categories</SectionTitle>
            <ul className="divide-y divide-ledger-line border border-ledger-line rounded-sm overflow-hidden">
              {matchedCategories.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link href={`/categories/${c.slug}`} className="block px-4 py-3 flex items-center gap-3 text-ink hover:bg-paper-raised">
                    {c.icon && <span className="text-xl" aria-hidden="true">{c.icon}</span>}
                    <span>{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}