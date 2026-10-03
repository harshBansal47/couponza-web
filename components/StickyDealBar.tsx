import { api } from "@/lib/api";
import type { CouponPublic } from "@/lib/types";

/**
 * Mobile-only bottom action bar on the coupon page. Codes jump to the reveal
 * panel (so the shopper actually sees the code first); code-less deals go
 * straight to the store through the normal /go redirect.
 */
export default function StickyDealBar({ coupon, storeName }: { coupon: CouponPublic; storeName?: string }) {
  const hasCode = Boolean(coupon.code);
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-ledger-line bg-white/95 px-4 pt-3 backdrop-blur-md md:hidden no-print">
      <div className="flex items-center gap-3 pb-3">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{coupon.title}</p>
        <a
          href={hasCode ? "#code-panel" : api.goUrl(coupon.id)}
          className="btn btn-cta shrink-0 px-5"
        >
          {hasCode ? "Reveal code" : storeName ? `Go to ${storeName}` : "Get deal"}
        </a>
      </div>
    </div>
  );
}
