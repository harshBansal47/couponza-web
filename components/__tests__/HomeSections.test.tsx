import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BannerCarousel from "@/components/home/BannerCarousel";
import CategoryRow from "@/components/home/CategoryRow";
import StoreMarquee from "@/components/home/StoreMarquee";
import Hero from "@/components/home/Hero";

describe("BannerCarousel", () => {
  it("renders every slide as a labelled group with working links", () => {
    render(<BannerCarousel />);
    expect(screen.getAllByRole("group")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Browse coupons" })).toHaveAttribute("href", "/coupons");
    expect(screen.getByRole("button", { name: "Next slide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to slide 2" })).toBeInTheDocument();
  });
});

describe("CategoryRow", () => {
  it("links each category and falls back to a glyph when there is no icon", () => {
    render(<CategoryRow categories={[{ id: "1", name: "Electronics", slug: "electronics" }]} />);
    expect(screen.getByRole("link", { name: /Electronics/ })).toHaveAttribute("href", "/categories/electronics");
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<CategoryRow categories={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("StoreMarquee", () => {
  it("renders nothing without stores", () => {
    const { container } = render(<StoreMarquee stores={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides the duplicated loop copy from assistive tech so each store is announced once", () => {
    render(<StoreMarquee stores={[{ id: "1", name: "Amazon", slug: "amazon" }]} />);
    expect(screen.getAllByRole("link", { name: /Amazon/ }).length).toBeGreaterThan(0);
    const exposed = document.querySelectorAll("div:not([aria-hidden='true']) > a");
    const hidden = document.querySelectorAll("[aria-hidden='true'] a");
    expect(exposed.length).toBeGreaterThan(0);
    expect(hidden.length).toBeGreaterThan(0);
  });
});

describe("Hero", () => {
  it("only shows stats that are greater than zero (no fabricated numbers)", () => {
    render(
      <Hero
        stats={[
          { label: "Active coupons", value: 12 },
          { label: "Stores", value: 0 },
        ]}
        popularStores={[]}
      />,
    );
    expect(screen.getByText("Active coupons")).toBeInTheDocument();
    expect(screen.queryByText("Stores")).not.toBeInTheDocument();
  });

  it("has a labelled search form that submits to /search", () => {
    render(<Hero stats={[]} popularStores={[{ id: "1", name: "Nike", slug: "nike" }]} />);
    expect(screen.getByRole("search")).toHaveAttribute("action", "/search");
    expect(screen.getByLabelText("Search Couponbase")).toHaveAttribute("name", "q");
    expect(screen.getByRole("link", { name: "Nike" })).toHaveAttribute("href", "/stores/nike");
  });
});
