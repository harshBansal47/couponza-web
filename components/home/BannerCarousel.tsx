"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface Banner {
  title: string;
  body: string;
  cta: string;
  href: string;
  tone: string;
  glyph: string;
}

const BANNERS: Banner[] = [
  {
    title: "Codes that actually worked",
    body: "See what shoppers confirmed this week, ranked by real success rate.",
    cta: "Browse coupons",
    href: "/coupons",
    tone: "bg-brand",
    glyph: "✓",
  },
  {
    title: "Today's deals, no countdown clocks",
    body: "Freshness comes from verification, not pressure. Dead codes are removed.",
    cta: "See today's deals",
    href: "/deals",
    tone: "bg-brand-warm",
    glyph: "%",
  },
  {
    title: "Follow a price, skip the refresh",
    body: "Track a product and we email you when the price drops or a confirmed code appears.",
    cta: "Create a free account",
    href: "/account/register",
    tone: "bg-brand-night",
    glyph: "↓",
  },
];

export default function BannerCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const next = (i + BANNERS.length) % BANNERS.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  }, []);

  // Track the visible slide from scroll position (works for swipe + buttons).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Autoplay: paused on hover/focus, and never for reduced-motion users.
  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => goTo(active + 1), 6500);
    return () => clearInterval(t);
  }, [active, paused, goTo]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-[24px]"
      >
        {BANNERS.map((b, i) => (
          <div
            key={b.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${BANNERS.length}`}
            className={`${b.tone} relative min-w-full snap-center overflow-hidden px-6 py-9 text-white sm:px-12 sm:py-12`}
          >
            <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
            <span
              aria-hidden="true"
              style={{ "--r": "-8deg" } as React.CSSProperties}
              className="animate-float pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 font-serif text-[9rem] font-extrabold leading-none text-white/15 sm:right-10 sm:text-[12rem]"
            >
              {b.glyph}
            </span>
            <div className="relative max-w-lg">
              <h2 className="text-balance font-serif text-2xl font-extrabold leading-tight sm:text-4xl">{b.title}</h2>
              <p className="mt-2 text-sm text-white/85 sm:text-base">{b.body}</p>
              <Link href={b.href} className="btn btn-cta mt-5 px-6 py-2.5">
                {b.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button type="button" onClick={() => goTo(active - 1)} aria-label="Previous slide" className="btn-ghost flex h-8 w-8 items-center justify-center rounded-full">
          ‹
        </button>
        {BANNERS.map((b, i) => (
          <button
            key={b.title}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active}
            className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-7 bg-inkblue" : "w-2 bg-ledger-line hover:bg-inkblue/50"}`}
          />
        ))}
        <button type="button" onClick={() => goTo(active + 1)} aria-label="Next slide" className="btn-ghost flex h-8 w-8 items-center justify-center rounded-full">
          ›
        </button>
      </div>
    </section>
  );
}
