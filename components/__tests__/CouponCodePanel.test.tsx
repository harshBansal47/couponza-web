import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CouponCodePanel from "@/components/CouponCodePanel";
import type { CouponPublic } from "@/lib/types";

const codedCoupon: CouponPublic = {
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

describe("CouponCodePanel", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides the code behind a blurred placeholder until revealed", () => {
    render(<CouponCodePanel coupon={codedCoupon} />);
    expect(screen.queryByText("SAVE20")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reveal code" })).toBeInTheDocument();
  });

  it("reveals the real code on click, and swaps the button to Copy", async () => {
    render(<CouponCodePanel coupon={codedCoupon} />);
    await userEvent.click(screen.getByRole("button", { name: "Reveal code" }));

    expect(screen.getByText("SAVE20")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
  });

  it("copies the code to the clipboard and shows 'Copied' confirmation", async () => {
    render(<CouponCodePanel coupon={codedCoupon} />);
    await userEvent.click(screen.getByRole("button", { name: "Reveal code" }));
    await userEvent.click(screen.getByRole("button", { name: "Copy code" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("SAVE20");
    await waitFor(() => expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument());
  });

  it("doesn't crash if the clipboard API rejects (e.g. no permission)", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error("denied"));
    render(<CouponCodePanel coupon={codedCoupon} />);
    await userEvent.click(screen.getByRole("button", { name: "Reveal code" }));
    await userEvent.click(screen.getByRole("button", { name: "Copy code" }));

    // Code stays visible and legible even though the copy silently failed.
    expect(screen.getByText("SAVE20")).toBeInTheDocument();
  });

  it("shows no reveal/copy button for a code-less deal, just the auto-apply message", () => {
    render(<CouponCodePanel coupon={{ ...codedCoupon, code: null }} />);
    expect(screen.getByText(/no code needed/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reveal|copy/i })).not.toBeInTheDocument();
  });

  it("links the CTA to the /go redirect endpoint for this coupon's id", () => {
    render(<CouponCodePanel coupon={codedCoupon} />);
    const link = screen.getByRole("link", { name: /get this deal/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("/coupons/c1/go"));
  });
});
