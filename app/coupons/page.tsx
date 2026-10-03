import type { Metadata } from "next";
import { resilient } from "@/lib/api";
import CategoryChips from "@/components/CategoryChips";
import CouponRow from "@/components/CouponRow";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import { absoluteUrl } from "@/lib/seo";

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: "Coupons",
  description: "Every coupon here carries a real community success rate.",
  alternates: { canonical: absoluteUrl("/coupons") },
};

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { search, q, skip: skipParam, category_id } = await searchParams as Record<string, string | undefined>;
  const query = q ?? search;
  const skip = Math.max(Number(skipParam) || 0, 0);

  const [couponsPage, categoriesPage, storesPage] = await Promise.all([
    resilient.listCoupons({ search: query, skip, limit: PAGE_SIZE, category_id }),
    resilient.listCategories({ limit: 100 }),
    resilient.listStores({ limit: 100 }),
  ]);
  const storeById = new Map(storesPage.items.map((s) => [s.id, s]));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 font-serif text-3xl text-ink">
        {query ? `Results for "${query}"` : "All coupons"}
      </h1>
      <section className="mb-8 space-y-4">
        <SearchBar />
        <CategoryChips categories={categoriesPage.items} />
      </section>
      <section>
        {couponsPage.items.length === 0 ? (
          <EmptyState
            title="Nothing matches yet."
            body="Try a different search, or check back soon."
            cta={{ href: "/coupons", label: "Browse all" }}
          />
        ) : (
          <div>
            {couponsPage.items.map((coupon) => {
              const store = storeById.get(coupon.store_id);
              return (
                <CouponRow
                  key={coupon.id}
                  coupon={coupon}
                  store={store ? { name: store.name, logoUrl: store.logo_url } : undefined}
                />
              );
            })}
          </div>
        )}
        <Pagination basePath="/coupons" searchParams={{ q: query, category_id }} skip={skip} limit={PAGE_SIZE} total={couponsPage.total} />
      </section>
    </div>
  );
}
