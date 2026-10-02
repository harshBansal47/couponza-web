import type { CouponPublic } from "./types";

/** Discount headline, e.g. "20% off" / "$15 off" / "Deal". */
export function formatDiscount(coupon: CouponPublic, currency = "USD"): string {
  if (coupon.discount_type === "percentage" && coupon.discount_value != null) {
    return `${coupon.discount_value}% off`;
  }
  if (coupon.discount_type === "fixed" && coupon.discount_value != null) {
    return `${formatMoney(coupon.discount_value, currency)} off`;
  }
  return "Deal";
}

/**
 * Money formatting that respects the store/product's own currency.
 * Couponza is multi-market, so nothing may assume USD or en-IN.
 */
export function formatMoney(amount: number, currency = "USD", locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: Math.abs(amount % 1) > 0 ? 2 : 0,
    }).format(amount);
  } catch {
    // Unknown/invalid currency code — fall back rather than crash the page.
    return `${amount} ${currency}`;
  }
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 30],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

/** "3 days ago" / "in 2 hours" / "just now". */
export function formatRelativeTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "not yet confirmed";
  const deltaSeconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const magnitude = Math.abs(deltaSeconds);
  if (magnitude < 45) return "just now";

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let value = deltaSeconds;
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(value) < size) return formatter.format(Math.round(value), unit);
    value = value / size;
  }
  return formatter.format(Math.round(value), "year");
}

/** Whole days until `iso`; negative once it has passed. */
export function daysUntil(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** "92%" or null when nobody has verified it yet. */
export function successRateLabel(coupon: CouponPublic): string | null {
  if (coupon.success_rate === null) return null;
  return `${Math.round(coupon.success_rate * 100)}%`;
}

export function totalReports(coupon: CouponPublic): number {
  return coupon.success_count + coupon.fail_count;
}

/** "3 days left" / "Ends 12 Mar 2025" / null when there is no expiry. */
export function expiryLabel(iso: string | null, now: Date = new Date()): string | null {
  const days = daysUntil(iso, now);
  if (days === null) return null;
  if (days < 0) return `Expired ${formatRelativeTime(iso, now)}`;
  if (days === 0) return "Ends today";
  if (days === 1) return "Ends tomorrow";
  if (days <= 14) return `${days} days left`;
  return `Ends ${formatDate(iso)}`;
}