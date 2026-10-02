import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CouponCard, { CouponCardGrid, type CouponCardStore } from "@/components/CouponCard";
import type { CouponPublic } from "@/lib/types";

const NOW = new Date("2026-03-15T12:00:00Z");

function makeCoupon(overrides: Partial<CouponPublic> = {}): CouponPublic {
  return {
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
    ...overrides,
  };
}

const store: CouponCardStore = { id: "s1", name: "Amazon", slug: "amazon", currency: "USD" };

function daysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * 86_400_000).toISOString();
}

describe("CouponCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("links the title to the coupon page", () => {
    render(<CouponCard coupon={makeCoupon()} store={store} />);
    expect(screen.getByRole("link", { name: "20% off headphones" })).toHaveAttribute(
      "href",
      "/coupons/20-off-headphones",
    );
  });

  it("links the store badge to the store page", () => {
    render(<CouponCard coupon={makeCoupon()} store={store} />);
    expect(screen.getByRole("link", { name: /Amazon/ })).toHaveAttribute("href", "/stores/amazon");
  });

  it("shows the code and says it is entered at checkout", () => {
    render(<CouponCard coupon={makeCoupon()} store={store} />);
    expect(screen.getAllByText("SAVE20").length).toBeGreaterThan(0);
    expect(screen.getByText(/at checkout/)).toBeInTheDocument();
  });

  it("says a discount is already applied when there is no code", () => {
    render(<CouponCard coupon={makeCoupon({ code: null })} store={store} />);
    expect(screen.getByText(/already applied/)).toBeInTheDocument();
    expect(screen.queryByText("SAVE20")).not.toBeInTheDocument();
  });

  describe("verified stamp", () => {
    it("stays hidden below two reports — one click is not evidence", () => {
      render(
        <CouponCard
          coupon={makeCoupon({ success_count: 1, fail_count: 0, success_rate: 100 })}
          store={store}
        />,
      );
      expect(screen.queryByTitle(/Worked for/)).not.toBeInTheDocument();
    });

    it("appears once there are at least two reports", () => {
      render(
        <CouponCard
          coupon={makeCoupon({ success_count: 9, fail_count: 1, success_rate: 90 })}
          store={store}
        />,
      );
      expect(screen.getByTitle("Worked for 9 of 10 people who tried it")).toBeInTheDocument();
    });

    it("appears even when the rate is poor — it reports, not endorses", () => {
      render(
        <CouponCard
          coupon={makeCoupon({ success_count: 2, fail_count: 8, success_rate: 20 })}
          store={store}
        />,
      );
      expect(screen.getByTitle("Worked for 2 of 10 people who tried it")).toBeInTheDocument();
    });

    it("does not appear on an expired coupon", () => {
      render(
        <CouponCard
          coupon={makeCoupon({
            expires_at: daysFromNow(-1),
            success_count: 9,
            fail_count: 1,
            success_rate: 90,
          })}
          store={store}
        />,
      );
      expect(screen.queryByTitle(/Worked for/)).not.toBeInTheDocument();
    });
  });

  describe("expiry", () => {
    it("says the code is no longer valid once it has expired", () => {
      render(
        <CouponCard coupon={makeCoupon({ expires_at: daysFromNow(-3) })} store={store} />,
      );
      expect(screen.getByText("No longer valid")).toBeInTheDocument();
      expect(screen.getByText("Expired")).toBeInTheDocument();
    });

    it("keeps the card readable but makes the CTA inert when expired", () => {
      render(
        <CouponCard coupon={makeCoupon({ expires_at: daysFromNow(-3) })} store={store} />,
      );
      const cta = screen.getByRole("link", { name: "No longer valid" });
      expect(cta).toHaveAttribute("aria-disabled", "true");
      expect(cta).toHaveClass("pointer-events-none");
    });

    it("overrides the variant when expired so a free-shipping badge is not shown", () => {
      render(
        <CouponCard
          coupon={makeCoupon({ expires_at: daysFromNow(-3) })}
          store={store}
          variant="free-shipping"
        />,
      );
      expect(screen.queryByText("Free shipping")).not.toBeInTheDocument();
      expect(screen.getByText("No longer valid")).toBeInTheDocument();
    });

    it("counts down in days when the code is still live", () => {
      render(<CouponCard coupon={makeCoupon({ expires_at: daysFromNow(4) })} store={store} />);
      expect(screen.getByText(/4 days left/)).toBeInTheDocument();
    });

    it("treats a code expiring today as still valid", () => {
      render(<CouponCard coupon={makeCoupon({ expires_at: daysFromNow(0) })} store={store} />);
      expect(screen.getByText("See the deal")).toBeInTheDocument();
      expect(screen.queryByText("No longer valid")).not.toBeInTheDocument();
    });

    it("can hide the expiry line for an evergreen code", () => {
      const { rerender } = render(
        <CouponCard coupon={makeCoupon({ expires_at: daysFromNow(4) })} store={store} />,
      );
      expect(screen.getByText(/4 days left/)).toBeInTheDocument();

      rerender(
        <CouponCard
          coupon={makeCoupon({ expires_at: daysFromNow(4) })}
          store={store}
          hideExpiry
        />,
      );
      expect(screen.queryByText(/4 days left/)).not.toBeInTheDocument();
    });
  });

  describe("price-drop variant", () => {
    it("shows the previous price struck through, the new price and the drop", () => {
      render(
        <CouponCard
          coupon={makeCoupon({ code: null, discount_type: "fixed", discount_value: 0 })}
          store={store}
          variant="price-drop"
          price={{ previous: 200, current: 150, productName: "Sony WH-1000XM5" }}
        />,
      );
      expect(screen.getByText("$200")).toHaveClass("line-through");
      expect(screen.getByText("$150")).toBeInTheDocument();
      expect(screen.getByText("−25%")).toBeInTheDocument();
      expect(screen.getByText("Sony WH-1000XM5")).toBeInTheDocument();
    });

    it("uses the store currency rather than assuming dollars", () => {
      render(
        <CouponCard
          coupon={makeCoupon({ code: null })}
          store={{ ...store, name: "Flipkart", currency: "INR" }}
          variant="price-drop"
          price={{ previous: 12999, current: 9999 }}
        />,
      );
      expect(screen.getByText(/9,999/)).toBeInTheDocument();
      expect(screen.getByText(/12,999/)).toBeInTheDocument();
    });

    it("does not divide by a zero previous price", () => {
      render(
        <CouponCard
          coupon={makeCoupon({ code: null })}
          store={store}
          variant="price-drop"
          price={{ previous: 0, current: 150 }}
        />,
      );
      expect(screen.getByText("$150")).toBeInTheDocument();
      expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    });
  });

  describe("free-shipping variant", () => {
    it("states the minimum order value", () => {
      render(
        <CouponCard
          coupon={makeCoupon({ code: null })}
          store={store}
          variant="free-shipping"
          minOrderValue={499}
        />,
      );
      expect(screen.getByText("Free shipping over $499")).toBeInTheDocument();
    });

    it("lists the eligible regions instead of guessing one", () => {
      render(
        <CouponCard
          coupon={makeCoupon({ code: null })}
          store={store}
          variant="free-shipping"
          regions={["India", "Sri Lanka"]}
        />,
      );
      expect(screen.getByText("India · Sri Lanka")).toBeInTheDocument();
    });

    it("omits the minimum-order line when there is no threshold", () => {
      render(
        <CouponCard coupon={makeCoupon({ code: null })} store={store} variant="free-shipping" />,
      );
      // Two elements legitimately read "Free shipping": the variant badge and
      // the body line. The body is the one that would have carried a threshold.
      expect(screen.getAllByText("Free shipping")).toHaveLength(2);
      expect(screen.queryByText(/^Free shipping over/)).not.toBeInTheDocument();
    });
  });

  it("links the footnote when one is supplied", () => {
    render(
      <CouponCard
        coupon={makeCoupon()}
        store={store}
        footnote={{ label: "Verify this code worked", href: "/coupons/20-off-headphones#verify" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Verify this code worked" })).toHaveAttribute(
      "href",
      "/coupons/20-off-headphones#verify",
    );
  });

  it("lets the caller override the CTA and its destination", () => {
    render(
      <CouponCard
        coupon={makeCoupon()}
        store={store}
        ctaHref="/go"
        ctaLabel="Get the deal"
      />,
    );
    expect(screen.getByRole("link", { name: "Get the deal" })).toHaveAttribute("href", "/go");
  });

  it("renders without a store rather than crashing", () => {
    render(<CouponCard coupon={makeCoupon()} />);
    expect(screen.getByText("20% off headphones")).toBeInTheDocument();
  });
});

describe("CouponCardGrid", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<CouponCardGrid coupons={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("resolves each coupon to its store by id", () => {
    render(
      <CouponCardGrid
        coupons={[
          makeCoupon({ id: "c1", slug: "one", store_id: "s1" }),
          makeCoupon({ id: "c2", slug: "two", title: "Second deal", store_id: "s2" }),
        ]}
        stores={[store, { id: "s2", name: "Ajio", slug: "ajio" }]}
      />,
    );
    expect(screen.getByRole("link", { name: /Amazon/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ajio/ })).toBeInTheDocument();
  });

  it("renders a coupon without a badge when its store id is not in the list", () => {
    render(
      <CouponCardGrid
        coupons={[makeCoupon({ store_id: "s-unknown" })]}
        stores={[{ id: "s1", name: "Ajio", slug: "ajio" }]}
      />,
    );
    expect(screen.queryByRole("link", { name: /Ajio/ })).not.toBeInTheDocument();
    expect(screen.getByText("20% off headphones")).toBeInTheDocument();
  });

  it("still renders a coupon whose store was not supplied", () => {
    render(<CouponCardGrid coupons={[makeCoupon()]} stores={[]} />);
    expect(screen.getByText("20% off headphones")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Amazon/ })).not.toBeInTheDocument();
  });

  it("applies the caller's grid classes verbatim", () => {
    const { container } = render(
      <CouponCardGrid coupons={[makeCoupon()]} className="grid-cols-2 lg:grid-cols-4" />,
    );
    expect(container.firstElementChild).toHaveClass("grid", "grid-cols-2", "lg:grid-cols-4");
  });

  it("passes card-level props through to every card", () => {
    render(
      <CouponCardGrid
        coupons={[makeCoupon(), makeCoupon({ id: "c2", slug: "two", title: "Second deal" })]}
        variant="free-shipping"
        footnote={{ label: "Verify", href: "/verify" }}
      />,
    );
    expect(screen.getAllByRole("link", { name: "Verify" })).toHaveLength(2);
  });
});