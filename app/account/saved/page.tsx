import type { Metadata } from "next";
import AccountShell from "@/components/account/AccountShell";
import { SavedCouponRow, StoreFollowRow } from "@/components/account/SaveButtons";
import { requireAccount, toggleSavedCoupon, toggleSavedStore } from "@/app/account/actions";
import { resilient } from "@/lib/api";
import { expiryLabel, formatDiscount } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Saved deals",
  description: "The stores you follow and the coupon codes you have saved.",
  alternates: { canonical: absoluteUrl("/account/saved") },
  robots: { index: false, follow: false },
};

export default async function SavedPage() {
  const { user, stores, coupons } = await requireAccount();

  const storeIds = stores.filter((s) => s.kind === "store").map((s) => s.item_id);
  const couponIds = coupons.filter((c) => c.kind === "coupon").map((c) => c.item_id);

  const [savedStores, savedCoupons] = await Promise.all([
    Promise.all(storeIds.map((id) => resilient.getStoreById(id))),
    Promise.all(couponIds.map((id) => resilient.getCouponById(id))),
  ]);

  const rows = savedStores.filter((s) => s !== null);
  const couponRows = savedCoupons.filter((c) => c !== null);

  // Store names for each saved coupon, fetched once rather than per coupon.
  const storeIdForCoupon = [...new Set(couponRows.map((c) => c.store_id))];
  const storeById = new Map(
    (await Promise.all(storeIdForCoupon.map((id) => resilient.getStoreById(id))))
      .filter((s) => s !== null)
      .map((s) => [s.id, s]),
  );

  const isEmpty = rows.length === 0 && couponRows.length === 0;

  return (
    <AccountShell
      user={user}
      active="/account/saved"
      counts={{ "/account/saved": rows.length + couponRows.length }}
    >
      <h2 className="font-serif text-xl text-ink">Saved</h2>

      {isEmpty ? (
        <div className="mt-6 border border-dashed border-ledger-line px-6 py-12 text-center">
          <p className="font-serif text-lg text-ink">Nothing saved yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Following a store means we email you when it has a code that shoppers have confirmed.
            Saving a code does the same for that one deal.
          </p>
        </div>
      ) : (
        <>
          {rows.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm uppercase tracking-wider text-ink-soft">
                Stores you follow
              </h3>
              <ul className="mt-3 space-y-2">
                {rows.map((store) => (
                  <StoreFollowRow
                    key={store.id}
                    store={store}
                    initiallySaved
                    action={toggleSavedStore}
                  />
                ))}
              </ul>
            </section>
          )}

          {couponRows.length > 0 && (
            <section className="mt-8">
              <h3 className="text-sm uppercase tracking-wider text-ink-soft">Saved codes</h3>
              <ul className="mt-3 space-y-2">
                {couponRows.map((coupon) => (
                  <SavedCouponRow
                    key={coupon.id}
                    coupon={coupon}
                    storeName={storeById.get(coupon.store_id)?.name}
                    discount={formatDiscount(coupon)}
                    expiry={coupon.expires_at ? expiryLabel(coupon.expires_at) : null}
                    initiallySaved
                    action={toggleSavedCoupon}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </AccountShell>
  );
}