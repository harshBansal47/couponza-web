"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MobileNav } from "./MobileNav";
import { HeaderSearch, MobileSearch } from "./HeaderSearch";

const NAV = [
  { href: "/coupons", label: "Coupons" },
  { href: "/deals", label: "Deals" },
  { href: "/stores", label: "Stores" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
  { href: "/trust", label: "How this works" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onMobileSearchOpen = () => setMobileSearchOpen(true);
    window.addEventListener("open-mobile-search", onMobileSearchOpen);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("open-mobile-search", onMobileSearchOpen);
    };
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-ledger-line bg-paper/90 backdrop-blur transition-all duration-200 ${
          scrolled ? "shadow-[var(--shadow-hairline)]" : ""
        }`}
      >
        <div className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-xl font-medium tracking-tight text-ink flex-shrink-0">
            <span className="mr-1.5 inline-block rotate-[-3deg] border border-verified px-1.5 py-0.5 font-mono text-xs text-verified">
              C
            </span>
            Couponza
          </Link>

          <nav className="hidden items-center gap-1 md:flex flex-1 mx-8 justify-center" aria-label="Main">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink rounded-sm hover:bg-ledger-line/40"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block flex-1 max-w-xs" aria-label="Search">
            <HeaderSearch />
          </div>

          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <Link
              href="/account"
              className="border border-ledger-line bg-paper-raised px-3 py-1.5 text-sm text-ink transition-colors hover:border-inkblue hover:text-inkblue rounded-sm"
            >
              Sign in
            </Link>
          </div>

          <button
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden btn-ghost p-2 -mr-2 touch-target"
            aria-label="Search"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          <MobileNav links={[...NAV, { href: "/account", label: "Sign in" }]} />
        </div>
      </header>

      <MobileSearch
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
      />
    </>
  );
}