import { describe, expect, it } from "vitest";
import { formatDiscount, formatRelativeTime, successRateLabel } from "@/lib/format";
import type { CouponPublic } from "@/lib/types";

function makeCoupon(overrides: Partial<CouponPublic> = {}): CouponPublic {
  return {
    id: "c1",
    title: "Test coupon",
    slug: "test-coupon",
    code: "SAVE10",
    description: null,
    discount_type: "percentage",
    discount_value: 10,
    store_id: "s1",
    category_id: "cat1",
    expires_at: null,
    is_active: true,
    views_count: 0,
    clicks_count: 0,
    success_count: 0,
    fail_count: 0,
    last_verified_at: null,
    success_rate: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("formatDiscount", () => {
  it("formats a percentage discount", () => {
    expect(formatDiscount(makeCoupon({ discount_type: "percentage", discount_value: 25 }))).toBe(
      "25% off",
    );
  });

  it("formats a fixed discount", () => {
    expect(formatDiscount(makeCoupon({ discount_type: "fixed", discount_value: 15 }))).toBe(
      "$15 off",
    );
  });

  it("falls back to 'Deal' for a deal with no discount_value", () => {
    expect(formatDiscount(makeCoupon({ discount_type: "deal", discount_value: null }))).toBe(
      "Deal",
    );
  });

  it("falls back to 'Deal' when discount_value is missing even for percentage/fixed", () => {
    expect(formatDiscount(makeCoupon({ discount_type: "percentage", discount_value: null }))).toBe(
      "Deal",
    );
  });
});

describe("successRateLabel", () => {
  it("returns null when there's no rate yet", () => {
    expect(successRateLabel(makeCoupon({ success_rate: null }))).toBeNull();
  });

  it("formats as a rounded percentage", () => {
    expect(successRateLabel(makeCoupon({ success_rate: 0.943 }))).toBe("94%");
  });

  it("rounds 0 correctly, not as falsy-empty", () => {
    expect(successRateLabel(makeCoupon({ success_rate: 0 }))).toBe("0%");
  });
});

describe("formatRelativeTime", () => {
  it("returns a fixed message for null", () => {
    expect(formatRelativeTime(null)).toBe("not yet confirmed");
  });

  it("returns 'just now' for very recent timestamps", () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe("just now");
  });

  it("formats minutes correctly", () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(formatRelativeTime(tenMinAgo)).toBe("10 minutes ago");
  });

  it("uses singular for exactly 1 unit", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneHourAgo)).toBe("1 hour ago");
  });

  it("formats days correctly", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe("3 days ago");
  });
});
