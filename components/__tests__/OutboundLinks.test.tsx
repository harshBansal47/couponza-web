import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CouponCodePanel from "@/components/CouponCodePanel";
import StickyDealBar from "@/components/StickyDealBar";
import type { CouponPublic } from "@/lib/types";

const base: CouponPublic = {
  id: "c1",
  title: "20% off headphones",
  slug: "20-off-headphones",
  code: "SAVE20",
  description: null,
  discount_type: "percentage",
  discount_value: 20,
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
};

describe("outbound coupon links are tracked and marked as affiliate links", () => {
  it("the code panel CTA goes through /go with a source tag and sponsored rel", () => {
    render(<CouponCodePanel coupon={base} />);
    const link = screen.getByRole("link", { name: /get this deal/i });
    expect(link.getAttribute("href")).toMatch(/\/coupons\/c1\/go\?src=coupon-page$/);
    expect(link.getAttribute("rel")).toContain("sponsored");
    expect(link.getAttribute("rel")).toContain("nofollow");
  });

  it("the sticky bar jumps to the code panel when there is a code (so the code is seen first)", () => {
    render(<StickyDealBar coupon={base} storeName="Amazon" />);
    const link = screen.getByRole("link", { name: /reveal code/i });
    expect(link).toHaveAttribute("href", "#code-panel");
  });

  it("the sticky bar goes straight through /go for a code-less deal, tagged sticky-bar", () => {
    render(<StickyDealBar coupon={{ ...base, code: null }} storeName="Amazon" />);
    const link = screen.getByRole("link", { name: /go to amazon/i });
    expect(link.getAttribute("href")).toMatch(/\/coupons\/c1\/go\?src=sticky-bar$/);
    expect(link.getAttribute("rel")).toContain("sponsored");
  });
});
