"use client";

import { useRef } from "react";
import CouponCard, { type CouponCardStore } from "@/components/CouponCard";
import type { CouponPublic } from "@/lib/types";

/** Horizontal snap-scroll row of coupon cards, with arrows on larger screens. */
export default function DealsCarousel({
  coupons,
  stores,
  label,
}: {
  coupons: CouponPublic[];
  stores: CouponCardStore[];
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const storeById = new Map(stores.map((s) => [s.id, s]));

  function scrollBy(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 280), behavior: "smooth" });
  }

  if (coupons.length === 0) return null;

  return (
    <div className="relative" role="region" aria-label={label}>
      <div
        ref={ref}
        className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-6 pt-1 sm:mx-0 sm:px-0"
      >
        {coupons.map((coupon) => (
          <div key={coupon.id} className="w-[270px] shrink-0 snap-start sm:w-[290px]">
            <CouponCard coupon={coupon} store={storeById.get(coupon.store_id)} variant="coupon" />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll deals left"
        className="absolute -left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl text-inkblue shadow-[var(--shadow-overlay)] transition-transform hover:scale-110 lg:flex"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll deals right"
        className="absolute -right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl text-inkblue shadow-[var(--shadow-overlay)] transition-transform hover:scale-110 lg:flex"
      >
        ›
      </button>
    </div>
  );
}
