import Image from "next/image";
import Link from "next/link";
import { formatDiscount, successRateLabel } from "@/lib/format";
import type { CouponPublic } from "@/lib/types";

interface StoreInfo {
  name: string;
  logoUrl?: string | null;
}

export default function CouponRow({ coupon, store }: { coupon: CouponPublic; store?: StoreInfo }) {
  const rate = successRateLabel(coupon);

  return (
    <Link
      href={`/coupons/${coupon.slug}`}
      className="-mx-2 flex items-center gap-4 rounded-sm border-b border-ledger-line px-2 py-4 transition-colors last:border-b-0 hover:bg-paper-raised"
    >
      {store && <StoreMark name={store.name} logoUrl={store.logoUrl} />}

      <div className="min-w-0 flex-1">
        {store && <p className="truncate text-sm text-ink-soft">{store.name}</p>}
        <p className="truncate font-serif text-lg text-ink">{coupon.title}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm text-ink">{formatDiscount(coupon)}</p>
        <p className="text-xs text-ink-soft">{rate ? `${rate} verified` : "Not yet verified"}</p>
      </div>
    </Link>
  );
}

/** A real logo when the store has one; otherwise an initial-letter monogram
 * in the same ledger-stamp style as the site's favicon, rather than a blank
 * gap or a generic placeholder icon. */
export function StoreMark({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        width={40}
        height={40}
        className="shrink-0 rounded-full border border-ledger-line object-contain bg-paper-raised"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-base text-ink-soft"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
