import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { resilient } from "@/lib/api";
import { CouponCard } from "@/components/CouponCard";
import SectionTitle from "@/components/SectionTitle";
import EmptyState from "@/components/EmptyState";
import SearchFilters from "./SearchFilters";
import { formatMoney } from "@/lib/format";
import type { CouponPublic, Product, Store } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every store, code, price drop and category Couponbase tracks.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

type SortKey = "relevance" | "verified" | "discount" | "newest" | "expiring";

/**
 * Server-side ordering. Doing it here rather than in the browser means the
 * result list in the HTML is already the list the visitor sees.
 */
function sortCoupons(items: CouponPublic[], sort: SortKey): CouponPublic[] {
  const copy = [...items];
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    case "discount":
      // Only percentage discounts are comparable; fixed amounts across
      // currencies are not, so they never outrank a percentage deal.
      return copy.sort(
        (a, b) => percent(b) - percent(a) || (b.success_rate ?? -1) - (a.success_rate ?? -1),
      );
    case "expiring":
      return copy.sort((a, b) => expiryRank(a) - expiryRank(b));
    case "verified":
      return copy.sort(
        (a, b) =>
          (b.success_rate ?? -1) - (a.success_rate ?? -1) ||
          b.success_count + b.fail_count - (a.success_count + a.fail_count),
      );
    case "relevance":
    default:
      return copy;
  }
}

const percent = (c: CouponPublic) => (c.discount_type === "percentage" ? c.discount_value ?? 0 : 0);
const expiryRank = (c: CouponPublic) => (c.expires_at ? Date.parse(c.expires_at) : Number.POSITIVE_INFINITY);

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const storeSlug = params.store;
  const categorySlug = params.category;
  const type = params.type as CouponPublic["discount_type"] | undefined;
  const sort = (params.sort as SortKey) ?? "relevance";
  const verifiedOnly = params.verified === "true";

  const [storesPage, categoriesPage] = await Promise.all([
    resilient.listStores({ limit: 100 }),
    resilient.listCategories({ limit: 100 }),
  ]);

  const stores = storesPage.items;
  const categories = categoriesPage.items;

  // The API filters by UUID; the URL carries readable slugs so results can be
  // shared and read out loud.
  const storeId = storeSlug ? stores.find((s) => s.slug === storeSlug)?.id : undefined;
  const categoryId = categorySlug ? categories.find((c) => c.slug === categorySlug)?.id : undefined;

  if (query) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SearchBox query={query} />
        <Results
          query={query}
          storeId={storeId}
          categoryId={categoryId}
          type={type}
          sort={sort}
          verifiedOnly={verifiedOnly}
          stores={stores}
          categories={categories}
          storeSlug={storeSlug ?? null}
          categorySlug={categorySlug ?? null}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl text-ink">Find a deal worth trusting</h1>
      <p className="mt-2 max-w-prose text-ink-soft">
        Search by store, brand, product or category. Everything listed here has a verification
        trail — use the filters on the results page to see only codes somebody has actually tried.
      </p>
      <div className="mt-6">
        <SearchBox query="" />
      </div>
      <SuggestedSearches categories={categories} stores={stores} />
    </div>
  );
}

function SearchBox({ query }: { query: string }) {
  return (
    <form action="/search" role="search" className="mb-8">
      <label htmlFor="site-search" className="sr-only">
        Search Couponbase
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        defaultValue={query}
        placeholder="Search stores, brands, products…"
        autoFocus={query.length === 0}
        className="w-full border border-ledger-line bg-paper-raised px-5 py-4 font-mono text-sm text-ink placeholder:text-ink-soft focus:border-inkblue focus:outline-none"
      />
    </form>
  );
}

function SuggestedSearches({
  stores,
  categories,
}: {
  stores: Store[];
  categories: { slug: string; name: string }[];
}) {
  const suggestions = [
    ...stores.slice(0, 5).map((s) => ({ label: s.name, href: `/stores/${s.slug}` })),
    ...categories.slice(0, 6).map((c) => ({ label: c.name, href: `/categories/${c.slug}` })),
  ];

  if (suggestions.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Try one of these</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="btn-outline text-sm">
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface ResultsProps {
  query: string;
  storeId?: string;
  categoryId?: string;
  type?: CouponPublic["discount_type"];
  sort: SortKey;
  verifiedOnly: boolean;
  stores: Store[];
  categories: { id: string; name: string; slug: string; icon: string | null }[];
  storeSlug: string | null;
  categorySlug: string | null;
}

async function Results({
  query,
  storeId,
  categoryId,
  type,
  sort,
  verifiedOnly,
  stores,
  categories,
}: ResultsProps) {
  const [coupons, products, matchingStores, allCategories] = await Promise.all([
    resilient.listCoupons({
      search: query,
      store_id: storeId,
      category_id: categoryId,
      active_only: true,
      limit: 60,
    }),
    resilient.listProducts({ search: query, store_id: storeId, category_id: categoryId, limit: 20 }),
    resilient.listStores({ search: query, limit: 10 }),
    resilient.listCategories({ limit: 200 }),
  ]);

  const storeById = new Map(stores.map((s) => [s.id, s]));

  const filtered = coupons.items.filter(
    (c) => (!type || c.discount_type === type) && (!verifiedOnly || c.last_verified_at !== null),
  );
  const sorted = sortCoupons(filtered, sort);

  const needle = query.toLowerCase();
  const matchedCategories = allCategories.items
    .filter((c) => c.name.toLowerCase().includes(needle))
    .slice(0, 8);

  const storeHits = matchingStores.items;
  const productHits = products.items;
  const total = sorted.length + storeHits.length + productHits.length + matchedCategories.length;

  if (total === 0) {
    return (
      <EmptyState
        title={`Nothing matches “${query}”.`}
        body="We only list codes someone has confirmed, so a thin result is normal for new stores. Try a broader term, or browse a category."
        cta={{ href: "/categories", label: "Browse categories" }}
      />
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <Suspense fallback={<div className="h-64" />}>
            <SearchFilters
              stores={stores.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
              categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            />
          </Suspense>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="border-b border-ledger-line pb-5">
          <h1 className="font-serif text-2xl text-ink">
            {total} result{total === 1 ? "" : "s"} for “{query}”
          </h1>
          <details className="mt-3 lg:hidden">
            <summary className="btn-outline cursor-pointer list-none">Filters</summary>
            <div className="mt-4 border border-ledger-line bg-paper-raised p-4">
              <Suspense fallback={null}>
                <SearchFilters
                  stores={stores.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
                  categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
                />
              </Suspense>
            </div>
          </details>
        </div>

        {storeHits.length > 0 && (
          <section className="mt-8">
            <SectionTitle hint={String(matchingStores?.total ?? storeHits.length)}>Stores</SectionTitle>
            <ul className="divide-y divide-ledger-line border border-ledger-line">
              {storeHits.map((s) => (
                <li key={s.id}>
                  <StoreRow store={s} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {sorted.length > 0 && (
          <section className="mt-8">
            <SectionTitle hint={String(sorted.length)}>Coupons</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {sorted.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  store={
                    storeById.get(coupon.store_id)
                      ? {
                          id: coupon.store_id,
                          name: storeById.get(coupon.store_id)!.name,
                          slug: storeById.get(coupon.store_id)!.slug,
                          logo_url: storeById.get(coupon.store_id)!.logo_url,
                          currency: storeById.get(coupon.store_id)!.currency,
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}

        {productHits.length > 0 && (
          <section className="mt-8">
            <SectionTitle hint={String(products?.total ?? productHits.length)}>Products</SectionTitle>
            <ul className="divide-y divide-ledger-line border border-ledger-line">
              {productHits.map((product) => (
                <li key={product.id}>
                  <ProductRow product={product} store={storeById.get(product.store_id)} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {matchedCategories.length > 0 && (
          <section className="mt-8">
            <SectionTitle>Categories</SectionTitle>
            <ul className="divide-y divide-ledger-line border border-ledger-line">
              {matchedCategories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/categories/${c.slug}`}
                    className="flex items-center gap-3 px-4 py-3 text-ink transition-colors hover:bg-paper-raised"
                  >
                    {c.icon && (
                      <span className="text-lg" aria-hidden="true">
                        {c.icon}
                      </span>
                    )}
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function StoreRow({ store }: { store: Store }) {
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="flex items-center gap-3 px-4 py-3 text-ink transition-colors hover:bg-paper-raised"
    >
      <StoreGlyph name={store.name} />
      <span className="min-w-0 flex-1 truncate">{store.name}</span>
      {store.country_code && <span className="font-mono text-xs text-ink-soft">{store.country_code}</span>}
    </Link>
  );
}

function StoreGlyph({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-sm text-ink-soft"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function ProductRow({ product, store }: { product: Product; store?: Store }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-paper-raised">
      <div className="min-w-0">
        <p className="truncate text-ink">{product.name}</p>
        <p className="text-xs text-ink-soft">
          {store ? (
            <Link href={`/stores/${store.slug}`} className="hover:text-ink">
              {store.name}
            </Link>
          ) : (
            "Unknown store"
          )}
        </p>
      </div>
      <p className="shrink-0 text-right">
        {product.current_price != null ? (
          <span className="font-mono text-sm text-ink">
            {formatMoney(product.current_price, store?.currency ?? product.currency)}
          </span>
        ) : (
          <span className="text-sm text-ink-soft">No price yet</span>
        )}
        {product.last_price_drop_pct != null && (
          <span className="block font-mono text-xs text-rust">−{product.last_price_drop_pct}%</span>
        )}
      </p>
    </div>
  );
}