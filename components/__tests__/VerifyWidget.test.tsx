import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VerifyWidget from "@/components/VerifyWidget";
import { ApiError } from "@/lib/api";
import type { CouponPublic, VerifyResponse } from "@/lib/types";

const baseCoupon: CouponPublic = {
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
  success_count: 2,
  fail_count: 1,
  last_verified_at: "2026-01-01T00:00:00Z",
  success_rate: 0.667,
  created_at: "2026-01-01T00:00:00Z",
};

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, api: { ...actual.api, verifyCoupon: vi.fn() } };
});

import { api } from "@/lib/api";

describe("VerifyWidget", () => {
  beforeEach(() => {
    vi.mocked(api.verifyCoupon).mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the initial stats computed from the coupon prop", () => {
    render(<VerifyWidget coupon={baseCoupon} />);
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("(3 reports)")).toBeInTheDocument();
  });

  it("shows 'No reports yet' when nothing has been reported", () => {
    render(<VerifyWidget coupon={{ ...baseCoupon, success_count: 0, fail_count: 0, success_rate: null }} />);
    expect(screen.getByText("No reports yet")).toBeInTheDocument();
  });

  it("submits a 'worked' report and shows the thank-you state with updated stats", async () => {
    vi.mocked(api.verifyCoupon).mockResolvedValue({
      success_count: 3,
      fail_count: 1,
      last_verified_at: "2026-01-02T00:00:00Z",
      success_rate: 0.75,
    });

    render(<VerifyWidget coupon={baseCoupon} />);
    await userEvent.click(screen.getByRole("button", { name: "Worked" }));

    await waitFor(() => expect(screen.getByText(/that helps the next person/i)).toBeInTheDocument());
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(api.verifyCoupon).toHaveBeenCalledWith("c1", true);
  });

  it("submits a 'didn't work' report with worked=false", async () => {
    vi.mocked(api.verifyCoupon).mockResolvedValue({
      success_count: 2,
      fail_count: 2,
      last_verified_at: "2026-01-02T00:00:00Z",
      success_rate: 0.5,
    });

    render(<VerifyWidget coupon={baseCoupon} />);
    await userEvent.click(screen.getByRole("button", { name: "Didn't work" }));

    await waitFor(() => expect(api.verifyCoupon).toHaveBeenCalledWith("c1", false));
  });

  it("shows a rate-limited message on a 429, not a generic error", async () => {
    vi.mocked(api.verifyCoupon).mockRejectedValue(new ApiError("rate limited", 429));

    render(<VerifyWidget coupon={baseCoupon} />);
    await userEvent.click(screen.getByRole("button", { name: "Worked" }));

    await waitFor(() =>
      expect(screen.getByText(/already reported on this one recently/i)).toBeInTheDocument(),
    );
  });

  it("returns to the reportable state (not stuck) on a non-429 error", async () => {
    vi.mocked(api.verifyCoupon).mockRejectedValue(new ApiError("server error", 500));

    render(<VerifyWidget coupon={baseCoupon} />);
    await userEvent.click(screen.getByRole("button", { name: "Worked" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Worked" })).toBeEnabled());
  });

  it("disables both buttons while a report is in flight", async () => {
    let resolveFn: (value: VerifyResponse) => void = () => {};
    vi.mocked(api.verifyCoupon).mockReturnValue(
      new Promise<VerifyResponse>((resolve) => {
        resolveFn = resolve;
      }),
    );

    render(<VerifyWidget coupon={baseCoupon} />);
    await userEvent.click(screen.getByRole("button", { name: "Worked" }));

    expect(screen.getByRole("button", { name: "Worked" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Didn't work" })).toBeDisabled();

    resolveFn({ success_count: 3, fail_count: 1, last_verified_at: null, success_rate: 0.75 });
    await waitFor(() => expect(screen.getByText(/that helps the next person/i)).toBeInTheDocument());
  });
});
