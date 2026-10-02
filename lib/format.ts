import type { CouponPublic } from "./types";

export function formatDiscount(coupon: CouponPublic): string {
  if (coupon.discount_type === "percentage" && coupon.discount_value != null) {
    return `${coupon.discount_value}% off`;
  }
  if (coupon.discount_type === "fixed" && coupon.discount_value != null) {
    return `$${coupon.discount_value} off`;
  }
  return "Deal";
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "not yet confirmed";
  const then = new Date(iso).getTime();
  const diffSeconds = Math.max(0, Math.round((Date.now() - then) / 1000));

  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
  ];
  let value = diffSeconds;
  let unit = "second";
  for (const [size, name] of units) {
    if (value < size) {
      unit = name;
      break;
    }
    value = Math.floor(value / size);
    unit = name;
  }
  if (diffSeconds < 60) return "just now";
  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
}

export function successRateLabel(coupon: CouponPublic): string | null {
  if (coupon.success_rate === null) return null;
  return `${Math.round(coupon.success_rate * 100)}%`;
}
