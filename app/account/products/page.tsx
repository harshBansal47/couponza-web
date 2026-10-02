import type { Metadata } from "next";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import { RemoveSavedButton } from "@/components/account/SaveButtons";
import TrackedPriceEditor from "@/components/account/TrackedPriceEditor";
import {
  requireAccount,
  untrackProductAction,
  updateTargetPriceAction,
} from "@/app/account/actions";
import { resilient } from "@/lib/api";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tracked products",
  description: "Products you are following and the price you want to be told about.",
  alternates: { canonical: absoluteUrl("/account/products") },
  robots: { index: false, follow: false },
};

export default async function TrackedProductsPage() {
  const { user, tracked } = await requireAccount();

  const rows = await Promise.all(
    tracked.map(async (row) => ({ row, product: await resilient.getProductById(row.product_id) })),
  );

  // A tracked product whose catalogue row has been removed cannot be shown
  // meaningfully, so it is filtered out rather than rendered as a dead entry.
  const live = rows.filter((r) => r.product !== null);

  return (
    <AccountShell
      user={user}
      active="/account/products"
      counts={{ "/account/products": live.length }}
    >
      <h2 className="font-serif text-xl text-ink">Tracked products</h2>

      {live.length === 0 ? (
        <div className="mt-6 border border-dashed border-ledger-line px-6 py-12 text-center">
          <p className="font-serif text-lg text-ink">You are not tracking anything yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Open a product and choose <em>Track this</em>. We will email you when the price drops, or
            when it reaches a target you set.
          </p>
          <Link href="/search" className="btn-primary mt-6 inline-flex">
            Find something to track
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {live.map(({ row, product }) => {
            const p = product!;
            const atTarget =
              row.target_price !== null &&
              p.current_price !== null &&
              p.current_price <= row.target_price;
            const belowLowest =
              p.lowest_price_30d != null &&
              p.current_price !== null &&
              p.current_price < p.lowest_price_30d;

            return (
              <li key={row.id} className="border border-ledger-line bg-paper-raised p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${p.slug}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-1 font-mono text-sm text-ink-soft">
                      {p.current_price !== null ? formatMoney(p.current_price, p.currency) : "Price unknown"}
                      {p.lowest_price_30d != null &&
                        ` · 30-day low ${formatMoney(p.lowest_price_30d, p.currency)}`}
                    </p>
                  </div>
                  <RemoveSavedButton
                    id={row.id}
                    label="Stop tracking"
                    action={untrackProductAction}
                  />
                </div>

                {atTarget && (
                  <p className="mt-3 border border-verified bg-verified-soft px-3 py-2 text-sm text-verified">
                    At or below your target of{" "}
                    {formatMoney(row.target_price!, p.currency)}.
                  </p>
                )}
                {!atTarget && belowLowest && (
                  <p className="mt-3 border border-rust bg-rust-soft px-3 py-2 text-sm text-rust">
                    Below its 30-day low.
                  </p>
                )}

                <TrackedPriceEditor
                  trackedId={row.id}
                  currency={p.currency}
                  currentTarget={row.target_price}
                  currentPrice={p.current_price}
                  action={updateTargetPriceAction}
                />

                <p className="mt-3 text-xs text-ink-soft">
                  Tracking since {formatRelativeTime(row.created_at)}
                  {p.last_captured_at && ` · last price check ${formatRelativeTime(p.last_captured_at)}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </AccountShell>
  );
}