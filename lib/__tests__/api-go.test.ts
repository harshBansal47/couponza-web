import { describe, expect, it } from "vitest";
import { api } from "@/lib/api";

describe("tracked outbound URLs", () => {
  it("goUrl points at the coupon /go redirect and carries the source tag", () => {
    const url = api.goUrl("abc", "coupon-page");
    expect(url).toMatch(/\/coupons\/abc\/go\?src=coupon-page$/);
  });

  it("goUrl without a source adds no query string", () => {
    expect(api.goUrl("abc")).toMatch(/\/coupons\/abc\/go$/);
  });

  it("productGoUrl points at the product /go redirect", () => {
    expect(api.productGoUrl("p1", "product-page")).toMatch(/\/products\/p1\/go\?src=product-page$/);
  });

  it("encodes the source tag so it can never break out of the query string", () => {
    const url = api.goUrl("abc", "a&b=c d");
    expect(url).toContain("src=a%26b%3Dc%20d");
    expect(url.split("?")).toHaveLength(2);
  });
});
