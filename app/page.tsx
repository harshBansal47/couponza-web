import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CouponCardGrid } from "@/components/CouponCard";
import SectionTitle from "@/components/SectionTitle";
import { api } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";
import type { Paginated } from "@/lib/types";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: absoluteUrl("/") } };
}

/**
 * Every fetch on this page is allowed to fail. A storefront must still render
 * (and a static build must still succeed) when the API is down, blank or being
 * redeployed — an error boundary around the whole homepage would take the site
 * offline over a transient 500.
 */
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return promise.catch(() => fallback);
}

const PILLARS = [
  {
    title: "Community-confirmed",
    body: "Every code carries a real success rate from real shopper reports — not a marketing claim.",
    points: ["Worked / didn't-work voting", "Success rate on every code", "Full verification timeline"],
  },
  {
    title: "Commission disclosed",
    body: "We publish what we earn on every store and coupon page. No hidden affiliate incentives.",
    points: ["Per-store commission note", "No pay-to-play placement", "Independent editorial order"],
  },
  {
    title: "Evidence over urgency",
    body: "Freshness is measured by verification activity, not countdown clocks. Expired codes are archived.",
    points: ["Freshness from verification", "Dead codes removed", "Price history per product"],
  },
];

export default async function HomePage() {
  const emptyPage: Paginated<never> = { items: [], total: 0, skip: 0, limit: 0 };

  const [coupons, stores, categories, popularSearches] = await Promise.all([
    safe(api.listCoupons({ active_only: true, limit: 12 }), emptyPage as Paginated<never>),
    safe(api.listStores({ limit: 8 }), emptyPage as Paginated<never>),
    safe(api.listCategories({ limit: 24 }), emptyPage as Paginated<never>),
    safe(
      api.listCoupons({ active_only: true, limit: 60 }),
      emptyPage as Paginated<never>,
    ),
  ]);

  const cardStores = stores.items.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    logo_url: s.logo_url,
    currency: s.currency,
  }));

  // "Verified" means somebody confirmed it, ranked by how well it confirmed.
  const confirmed = coupons.items
    .filter((c) => c.last_verified_at !== null && (c.success_count + c.fail_count) >= 2)
    .sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0))
    .slice(0, 8);

  // Codes with no expiry date, best confirmed first — these are the ones that
  // actually keep working.
  const evergreen = popularSearches.items
    .filter((c) => c.expires_at === null && c.code !== null)
    .sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0))
    .slice(0, 4);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Couponza",
    url: absoluteUrl("/"),
    description:
      "Community-confirmed coupon codes and price drops, with affiliate commission disclosed on every page.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const isEmpty =
    coupons.total === 0 && stores.total === 0 && categories.total === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Find a deal worth trusting.
        </h1>
        <p className="mt-4 text-ink-soft">
          Search stores, brands and products. Every code carries a real success rate from real
          shoppers, and every commission we earn is printed on the page.
        </p>

        <form action="/search" role="search" className="mt-8">
          <label htmlFor="hero-search" className="sr-only">
            Search Couponza
          </label>
          <input
            id="hero-search"
            name="q"
            type="search"
            placeholder="Search Nike, laptops, electronics…"
            className="input px-5 py-4 text-center font-mono text-sm sm:text-left"
          />
        </form>

        {stores.items.length > 0 && (
          <p className="mt-4 text-sm text-ink-soft">
            Popular:{" "}
            {stores.items.slice(0, 5).map((store, i) => (
              <span key={store.id}>
                {i > 0 ? " · " : ""}
                <Link href={`/stores/${store.slug}`} className="text-inkblue hover:underline">
                  {store.name}
                </Link>
              </span>
            ))}
          </p>
        )}
      </section>

      {isEmpty ? (
        <section className="mt-16 border border-dashed border-ledger-line px-6 py-12 text-center">
          <h2 className="font-serif text-xl text-ink">No deals listed yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            The catalogue is empty. That is the honest state — we would rather show nothing than
            pad the page with codes nobody has confirmed.
          </p>
        </section>
      ) : (
        <>
          {confirmed.length > 0 && (
            <section className="mt-16">
              <SectionTitle hint={`${confirmed.length} confirmed`}>Confirmed by shoppers</SectionTitle>
              <CouponCardGrid
                coupons={confirmed}
                stores={cardStores}
                variant="coupon"
                className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              />
            </section>
          )}

          {evergreen.length > 0 && (
            <section className="mt-14">
              <SectionTitle hint="no expiry date">Codes with no expiry</SectionTitle>
              <CouponCardGrid
                coupons={evergreen}
                stores={cardStores}
                variant="featured"
                className="grid-cols-1 sm:grid-cols-2"
              />
            </section>
          )}

          {stores.items.length > 0 && (
            <section className="mt-14">
              <SectionTitle hint={`${stores.total} tracked`}>Stores we track</SectionTitle>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stores.items.map((store) => (
                  <li key={store.id}>
                    <Link
                      href={`/stores/${store.slug}`}
                      className="flex h-full items-center gap-3 border border-ledger-line bg-paper-raised p-3 transition-colors hover:border-inkblue"
                    >
                      {store.logo_url ? (
                        <Image
                          src={store.logo_url}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-full border border-ledger-line bg-paper object-contain"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper font-serif text-ink-soft"
                        >
                          {store.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{store.name}</span>
                        {store.country_code && (
                          <span className="block font-mono text-[10px] text-ink-soft">
                            {store.country_code}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-right text-sm">
                <Link href="/stores" className="text-inkblue hover:underline">
                  All stores →
                </Link>
              </p>
            </section>
          )}

          {categories.items.length > 0 && (
            <section className="mt-14" id="categories">
              <SectionTitle>Browse by category</SectionTitle>
              <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {categories.items.slice(0, 15).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="block border border-ledger-line bg-paper-raised p-3 text-center text-sm text-ink transition-colors hover:border-inkblue hover:text-inkblue"
                    >
                      {category.icon && (
                        <span className="mb-1 block text-xl" aria-hidden="true">
                          {category.icon}
                        </span>
                      )}
                      <span className="line-clamp-2">{category.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-right text-sm">
                <Link href="/categories" className="text-inkblue hover:underline">
                  All categories →
                </Link>
              </p>
            </section>
          )}

          <section className="mt-16">
            <h2 className="text-center font-serif text-xl text-ink">
              Why this is not a red-badge countdown site
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {PILLARS.map((pillar) => (
                <li key={pillar.title} className="border border-ledger-line bg-paper-raised p-6">
                  <h3 className="font-serif text-lg text-ink">{pillar.title}</h3>
                  <p className="mt-2 text-sm text-ink-soft">{pillar.body}</p>
                  <ul className="mt-4 space-y-1.5 text-xs text-ink-soft">
                    {pillar.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="text-verified" aria-hidden="true">
                          ✓
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-16 border border-ledger-line bg-paper-raised p-8 text-center">
            <h2 className="font-serif text-2xl text-ink">Track a price and stop checking back</h2>
            <p className="mx-auto mt-2 max-w-lg text-ink-soft">
              Save the stores you use, follow a product, and we email you when its price drops or a
              confirmed code appears for it.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/account/register" className="btn-primary">
                Create a free account
              </Link>
              <Link href="/search" className="btn-outline">
                Search deals
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}