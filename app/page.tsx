import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import CouponCard, { CouponCardGrid } from "@/components/CouponCard";
import SectionTitle from "@/components/SectionTitle";
import { absoluteUrl } from "@/lib/seo";
import type { Store, Category } from "@/lib/types";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: absoluteUrl("/") } };
}

export default async function HomePage() {
  const [couponsPage, categoriesPage, storesPage, featuredCoupons] = await Promise.all([
    api.listCoupons({ skip: 0, limit: 12 }),
    api.listCategories({ limit: 100 }),
    api.listStores({ limit: 12 }),
    api.listCoupons({ skip: 0, limit: 4 }), // For featured section
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

      {/* Newsletter / Deal Alert Signup */}
      <section className="mb-16 rounded-lg border border-ledger-line bg-paper-raised p-6 md:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-2xl text-ink">Never miss a price drop</h2>
          <p className="mt-2 text-ink-soft">
            Get notified when prices fall on products you're watching, or when new verified coupons land for your favorite stores.
          </p>
          <form action="/account/register" method="POST" className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <label htmlFor="email-signup" className="sr-only">Email address</label>
            <input
              id="email-signup"
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              className="input flex-1 text-center sm:text-left"
            />
            <button type="submit" className="btn-verified whitespace-nowrap">
              Get Alerts
            </button>
          </form>
          <p className="mt-3 text-xs text-ink-soft">No spam, unsubscribe anytime. By signing up you agree to our <Link href="/privacy" className="underline hover:text-ink">Privacy Policy</Link>.</p>
        </div>
      </section>

      {/* Featured Deals - Stronger section using CouponCard */}
      <section className="mb-16">
        <SectionTitle hint={`${featuredCoupons.total} active`}>Featured Deals</SectionTitle>
        {featuredCoupons.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">No featured deals at the moment.</p>
        ) : (
          <CouponCardGrid
            coupons={featuredCoupons.items}
            stores={storesPage.items.map(s => ({ name: s.name, logo_url: s.logo_url, slug: s.slug }))}
            variant="featured"
            columns={{ base: 1, sm: 2, lg: 2 }}
          />
        )}
      </section>

      {/* Verified Deals */}
      <section className="mb-16">
        <SectionTitle hint={`${verifiedDeals.length} of ${couponsPage.total}`}>Verified Deals</SectionTitle>
        {verifiedDeals.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">
            No verified deals yet — reports from shoppers land here first.
          </p>
        ) : (
          <CouponCardGrid
            coupons={verifiedDeals}
            stores={storesPage.items.map(s => ({ name: s.name, logo_url: s.logo_url, slug: s.slug }))}
            variant="coupon"
            columns={{ base: 1, sm: 1, lg: 1 }}
          />
        )}
        <p className="mt-4 text-right text-sm">
          <Link href="/coupons" className="text-inkblue hover:underline">All coupons →</Link>
        </p>
      </section>

      {/* Popular Stores - Polished with logos and stats */}
      <section className="mb-16">
        <SectionTitle>Popular Stores</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {storesPage.items.map((s) => (
            <Link
              key={s.id}
              href={`/stores/${s.slug}`}
              className="group border border-ledger-line bg-paper-raised p-4 transition-colors hover:border-inkblue hover:text-inkblue hover:shadow-[var(--shadow-raised)]"
            >
              <div className="flex items-center gap-3 mb-3">
                {s.logo_url ? (
                  <Image
                    src={s.logo_url}
                    alt={`${s.name} logo`}
                    width={48}
                    height={48}
                    className="shrink-0 rounded-full border border-ledger-line object-contain bg-paper-raised"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-xl text-ink-soft">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate group-hover:text-inkblue transition-colors">{s.name}</p>
                  {s.description && <p className="text-xs text-ink-soft truncate">{s.description}</p>}
                </div>
              </div>
              <div className="pt-2 border-t border-ledger-line flex items-center justify-between text-xs text-ink-soft">
                <span>Verified deals</span>
                <span className="font-mono">—</span>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-right text-sm">
          <Link href="/stores" className="text-inkblue hover:underline">All stores →</Link>
        </p>
      </section>

      {/* Categories - Polished with icons */}
      <section className="mb-16" id="categories">
        <SectionTitle>Browse by Category</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {categoriesPage.items.slice(0, 15).map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="group border border-ledger-line bg-paper-raised p-4 text-center transition-colors hover:border-inkblue hover:text-inkblue hover:shadow-[var(--shadow-raised)]"
            >
              {c.icon && <span className="text-2xl mb-2 block" aria-hidden="true">{c.icon}</span>}
              <p className="font-medium text-sm text-ink group-hover:text-inkblue transition-colors">{c.name}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-right text-sm">
          <Link href="/categories" className="text-inkblue hover:underline">All categories →</Link>
        </p>
      </section>

      {/* Trust Strip - Expanded */}
      <section className="mb-16">
        <h2 className="font-serif text-xl text-ink text-center mb-8">Why Couponza is different</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ),
              title: "Community Verified",
              body: "Every coupon carries a real success rate from real shopper reports — not marketing claims.",
              details: [
                "Worked / Didn't work voting",
                "Success rate % shown on every coupon",
                "Verification history timeline",
              ],
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
              title: "Transparent Commissions",
              body: "We disclose exactly what we earn on every store and coupon page — no hidden affiliate motives.",
              details: [
                "Per-store commission disclosure",
                "Per-coupon earnings transparency",
                "No pay-to-play placement",
              ],
            },
            {
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
              title: "Evidence-Based Deals",
              body: "Freshness measured by verification activity, not marketing calendars or merchant feeds.",
              details: [
                "Recent verification = fresh deal",
                "Expired coupons auto-archived",
                "Price history tracking",
              ],
            },
          ].map(({ icon, title, body, details }) => (
            <div key={title} className="rounded-md border border-ledger-line bg-paper-raised p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-verified/10 text-verified mb-4" aria-hidden="true">
                {icon}
              </div>
              <h3 className="font-serif text-lg text-ink mb-2">{title}</h3>
              <p className="text-sm text-ink-soft mb-4">{body}</p>
              <ul className="space-y-1 text-xs text-ink-soft">
                {details.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-verified">✓</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How it works / CTA */}
      <section className="rounded-lg border border-ledger-line bg-paper-raised p-6 md:p-8 text-center">
        <h2 className="font-serif text-2xl text-ink">Ready to save smarter?</h2>
        <p className="mt-2 text-ink-soft max-w-xl mx-auto">
          Join thousands of shoppers who trust Couponza for verified deals, transparent commissions, and price-drop alerts.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Search Deals
          </Link>
          <Link href="/account/register" className="btn-outline">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}