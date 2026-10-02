import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import CouponRow from "@/components/CouponRow";
import SectionTitle from "@/components/SectionTitle";
import { absoluteUrl } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: absoluteUrl("/") } };
}

export default async function HomePage() {
  const [couponsPage, categoriesPage, storesPage] = await Promise.all([
    api.listCoupons({ skip: 0, limit: 12 }),
    api.listCategories({ limit: 100 }),
    api.listStores({ limit: 12 }),
  ]);

  const storeById = new Map(storesPage.items.map((s) => [s.id, s]));
  const verifiedDeals = couponsPage.items
    .filter((c) => c.last_verified_at !== null)
    .sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0))
    .slice(0, 4);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Couponza",
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/")}search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="font-serif text-4xl leading-tight text-ink md:text-5xl">
          Find a deal worth trusting.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          Search stores, products, coupons and deals — every code carries a real community success rate,
          and every commission we earn is disclosed on the page.
        </p>
        <form action="/search" className="mx-auto mt-8 max-w-2xl">
          <label htmlFor="hero-search" className="sr-only">Search</label>
          <input
            id="hero-search"
            name="q"
            type="search"
            placeholder="Search Nike, laptops, Amazon…"
            className="w-full border border-ledger-line bg-paper-raised px-5 py-4 font-mono text-sm text-ink shadow-sm focus:border-inkblue"
          />
        </form>
        <p className="mt-4 text-sm text-ink-soft">
          Popular:{" "}
          {storesPage.items.slice(0, 4).map((s, i) => (
            <span key={s.id}>
              {i > 0 ? " · " : ""}
              <Link href={`/stores/${s.slug}`} className="text-inkblue hover:underline">
                {s.name}
              </Link>
            </span>
          ))}
        </p>
      </section>

      {/* Verified deals */}
      <section className="mb-16">
        <SectionTitle hint={`${verifiedDeals.length} of ${couponsPage.total}`}>Verified deals</SectionTitle>
        {verifiedDeals.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">
            No verified deals yet — reports from shoppers land here first.
          </p>
        ) : (
          <div>
            {verifiedDeals.map((coupon) => {
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
        <p className="mt-4 text-right text-sm">
          <Link href="/coupons" className="text-inkblue hover:underline">All coupons →</Link>
        </p>
      </section>

      {/* Popular stores */}
      <section className="mb-16">
        <SectionTitle>Popular stores</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {storesPage.items.slice(0, 8).map((s) => (
            <Link
              key={s.id}
              href={`/stores/${s.slug}`}
              className="border border-ledger-line bg-paper-raised px-4 py-6 text-center text-sm text-ink transition-colors hover:border-inkblue hover:text-inkblue"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mb-16" id="categories">
        <SectionTitle>Browse by category</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {categoriesPage.items.slice(0, 9).map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="border border-ledger-line bg-paper-raised px-4 py-4 text-sm text-ink transition-colors hover:border-inkblue hover:text-inkblue"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="grid gap-6 border-t border-ledger-line pt-10 sm:grid-cols-3">
        {[
          ["Community verified", "Every code carries a real success rate from real reports."],
          ["Transparent commissions", "We disclose exactly what we earn on every page."],
          ["Evidence-based deals", "Freshness is measured by verification, not marketing."],
        ].map(([title, body]) => (
          <div key={title}>
            <p className="font-mono text-xs uppercase tracking-wider text-verified">✓ {title}</p>
            <p className="mt-2 text-sm text-ink-soft">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
