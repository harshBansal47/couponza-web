import type { Metadata } from "next";
import Link from "next/link";
import { resilient } from "@/lib/api";
import CouponRow from "@/components/CouponRow";
import SectionTitle from "@/components/SectionTitle";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Today's deals",
  description: "Verified coupons and recorded price drops across stores.",
  alternates: { canonical: absoluteUrl("/deals") },
};

export default async function DealsPage() {
  const [couponsPage, productsPage, storesPage] = await Promise.all([
    resilient.listCoupons({ limit: 50 }),
    resilient.listProducts({ limit: 50 }),
    resilient.listStores({ limit: 100 }),
  ]);
  const storeById = new Map(storesPage.items.map((s) => [s.id, s]));

  const verified = couponsPage.items
    .filter((c) => c.last_verified_at !== null)
    .sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0))
    .slice(0, 6);

  const priceDrops = productsPage.items
    .filter((p) => p.last_price_drop_pct != null)
    .sort((a, b) => (b.last_price_drop_pct ?? 0) - (a.last_price_drop_pct ?? 0))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-2 font-serif text-3xl text-ink">Today&apos;s deals</h1>
      <p className="mb-12 text-sm text-ink-soft">
        What shoppers most recently confirmed working, and where prices moved.
      </p>

      <section className="mb-16">
        <SectionTitle hint="sorted by community success rate">Verified coupons</SectionTitle>
        {verified.length === 0 ? (
          <p className="py-6 text-sm text-ink-soft">No verified coupons yet.</p>
        ) : (
          verified.map((c) => {
            const store = storeById.get(c.store_id);
            return <CouponRow key={c.id} coupon={c} store={store ? { name: store.name, logoUrl: store.logo_url } : undefined} />;
          })
        )}
      </section>

      <section>
        <SectionTitle hint="from recorded price history">Price drops</SectionTitle>
        {priceDrops.length === 0 ? (
          <p className="py-6 text-sm text-ink-soft">Price drops will appear here as soon as observations come in.</p>
        ) : (
          <ul className="divide-y divide-ledger-line border-y border-ledger-line">
            {priceDrops.map((p) => (
              <li key={p.id} className="flex items-baseline justify-between py-3">
                <span className="text-ink">{p.name}</span>
                <span className="font-mono text-sm">
                  <span className="text-verified">↓{p.last_price_drop_pct}%</span>
                  <span className="ml-3 text-ink">₹{p.current_price?.toLocaleString("en-IN")}</span>
                  {p.lowest_price_90d != null && (
                    <span className="ml-3 text-ink-soft">90d low ₹{p.lowest_price_90d.toLocaleString("en-IN")}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-4 text-right text-sm">
        <Link href="/coupons" className="text-inkblue hover:underline">All coupons →</Link>
      </p>
    </div>
  );
}
