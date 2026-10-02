import type { Metadata } from "next";
import { api } from "@/lib/api";
import CategoryChips from "@/components/CategoryChips";
import CouponCodePanel from "@/components/CouponCodePanel";
import CouponRow from "@/components/CouponRow";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import { absoluteUrl } from "@/lib/seo";

const PAGE_SIZE = 20;

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: absoluteUrl("/") } };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; skip?: string }>;
}) {
  const { search, skip: skipParam } = await searchParams;
  const skip = Math.max(Number(skipParam) || 0, 0);

  const [couponsPage, categoriesPage, storesPage] = await Promise.all([
    api.listCoupons({ search, skip, limit: PAGE_SIZE }),
    api.listCategories(),
    // Bounded lookup for display names/logos on the listing. Fine at this
    // scale; once the store count grows past ~100 this should become a
    // backend "include=store" param on /coupons instead of a second fetch.
    api.listStores({ limit: 100 }),
  ]);

  const storeById = new Map(storesPage.items.map((s) => [s.id, s]));
  // Tied to the current page's first result would make the hero panel shift
  // around as people paginate — only show it on the unfiltered first page.
  const exampleCoupon = skip === 0 && !search ? couponsPage.items[0] : undefined;

  // WebSite schema with a SearchAction is what makes a sitelinks search box
  // eligible in Google results — a small, free SEO win for a search-driven
  // product like this one.
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Couponza",
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/")}?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {skip === 0 && !search ? (
        <section className="mb-16 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="font-serif text-4xl leading-tight text-ink md:text-5xl">
              The deals we show you, verified by people — not by whoever paid us most.
            </h1>
            <p className="mt-4 max-w-sm text-ink-soft">
              Every code here carries a real success rate from real reports, and every page
              discloses exactly what we earn if you use it.
            </p>
          </div>
          {exampleCoupon && <CouponCodePanel coupon={exampleCoupon} />}
        </section>
      ) : (
        <h1 className="mb-8 font-serif text-3xl text-ink">
          {search ? `Results for "${search}"` : "All deals"}
        </h1>
      )}

      <section className="mb-8 space-y-4">
        <SearchBar />
        <CategoryChips categories={categoriesPage.items} />
      </section>

      <section>
        {couponsPage.items.length === 0 ? (
          <p className="py-12 text-center text-ink-soft">
            Nothing matches yet. Try a different search, or check back soon.
          </p>
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
        <Pagination
          basePath="/"
          searchParams={{ search }}
          skip={skip}
          limit={PAGE_SIZE}
          total={couponsPage.total}
        />
      </section>
    </div>
  );
}
