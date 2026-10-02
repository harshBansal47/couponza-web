import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import AccountShell from "@/components/account/AccountShell";
import { requireAccount } from "@/app/account/actions";
import { resilient } from "@/lib/api";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Your account",
  description: "Saved deals, tracked prices and alert history.",
  alternates: { canonical: absoluteUrl("/account") },
  robots: { index: false, follow: false },
};

export default async function AccountOverviewPage() {
  const { user, stores, coupons, tracked, prefs, alerts } = await requireAccount();

  const storeIds = new Set(stores.filter((s) => s.kind === "store").map((s) => s.item_id));
  const couponIds = new Set(coupons.filter((c) => c.kind === "coupon").map((c) => c.item_id));

  // The /me endpoints return bare ids, so the rows themselves are fetched here.
  const [savedStores, savedCoupons] = await Promise.all([
    Promise.all([...storeIds].map((id) => resilient.getStoreById(id))),
    Promise.all([...couponIds].map((id) => resilient.getCouponById(id))),
  ]);

  // A saved row whose catalogue entry has since been deleted is dropped rather
  // than rendered as a broken link.
  const resolvedStores = savedStores.filter((s) => s !== null);
  const resolvedCoupons = savedCoupons.filter((c) => c !== null);

  // Count distinct alerts, not delivery attempts. A user with email and push on
  // got one price drop, not two — showing "2 alerts sent" for a single drop is
  // the kind of small inaccuracy that makes a statistics panel untrustworthy.
  const alertKeys = new Set(alerts.map((a) => a.price_point_id ?? a.id));
  const trackedWithPrices = await Promise.all(
    tracked.map(async (row) => ({
      row,
      product: await resilient.getProductById(row.product_id),
    })),
  );
  const liveProducts = trackedWithPrices.filter((t) => t.product !== null);

  const stats = [
    { label: "Stores followed", value: resolvedStores.length, href: "/account/saved" },
    { label: "Codes saved", value: resolvedCoupons.length, href: "/account/saved" },
    { label: "Products tracked", value: liveProducts.length, href: "/account/products" },
    { label: "Alerts", value: alertKeys.size, href: "/account/alerts" },
  ];

  return (
    <AccountShell
      user={user}
      active="/account"
      counts={{
        "/account/saved": resolvedStores.length + resolvedCoupons.length,
        "/account/products": liveProducts.length,
        "/account/alerts": alertKeys.size,
      }}
    >
      <h2 className="font-serif text-xl text-ink">Overview</h2>

      {!prefs.email_enabled && !prefs.push_enabled && (
        <p className="mt-4 border border-rust bg-rust-soft px-4 py-3 text-sm text-rust">
          All alerts are off, so nothing will reach you when a tracked price drops.{" "}
          <Link href="/account/notifications" className="underline underline-offset-2">
            Turn them on
          </Link>
          .
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="border border-ledger-line bg-paper-raised p-4 transition-colors hover:border-inkblue"
          >
            <dt className="text-xs uppercase tracking-wider text-ink-soft">{stat.label}</dt>
            <dd className="mt-1 font-serif text-2xl text-ink">{stat.value}</dd>
          </Link>
        ))}
      </dl>

      <section className="mt-10">
        <h3 className="font-serif text-lg text-ink">Recent alerts</h3>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            Nothing yet. Follow a product and we will email you when its price drops.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-ledger-line border-y border-ledger-line">
            {alerts.slice(0, 5).map((alert) => (
              <li key={alert.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <span className="text-ink">{alert.detail ?? "An alert was raised."}</span>
                <span className="font-mono text-xs text-ink-soft">
                  {formatRelativeTime(alert.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {liveProducts.length > 0 && (
        <section className="mt-10">
          <h3 className="font-serif text-lg text-ink">Tracked products</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {liveProducts.slice(0, 4).map(({ row, product }) => (
              <li key={row.id} className="border border-ledger-line bg-paper-raised p-3">
                <p className="text-sm font-medium text-ink">{product!.name}</p>
                <p className="mt-1 font-mono text-xs text-ink-soft">
                  Now {product!.current_price !== null ? formatMoney(product!.current_price, product!.currency) : "unknown"}
                  {row.target_price !== null &&
                    ` · alert below ${formatMoney(row.target_price, product!.currency)}`}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link href="/account/products" className="text-inkblue hover:underline">
              Manage tracked products →
            </Link>
          </p>
        </section>
      )}

      {resolvedStores.length > 0 && (
        <section className="mt-10">
          <h3 className="font-serif text-lg text-ink">Stores you follow</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {resolvedStores.map((store) => (
              <li key={store.id}>
                <Link
                  href={`/stores/${store.slug}`}
                  className="flex items-center gap-2 border border-ledger-line bg-paper-raised px-3 py-1.5 text-sm text-ink transition-colors hover:border-inkblue"
                >
                  {store.logo_url && (
                    <Image
                      src={store.logo_url}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full border border-ledger-line bg-paper object-contain"
                    />
                  )}
                  {store.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AccountShell>
  );
}