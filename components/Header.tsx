"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";
import { HeaderSearch, MobileSearch } from "./HeaderSearch";

export interface NavLink {
  href: string;
  label: string;
}

export default function Header({
  links,
  user,
}: {
  links: NavLink[];
  /** Display name when signed in; undefined means anonymous. */
  user?: { name: string } | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  // Expose header height as CSS variable for mobile menu positioning
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (header) {
      const height = header.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--header-height", `${height}px`);
    }
    const onResize = () => {
      const h = headerRef.current?.getBoundingClientRect().height ?? 0;
      document.documentElement.style.setProperty("--header-height", `${h}px`);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-40 border-b border-ledger-line bg-paper/90 backdrop-blur transition-shadow duration-200 ${
          scrolled ? "shadow-[var(--shadow-raised)]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/"
            className="flex shrink-0 items-center font-serif text-lg font-medium tracking-tight text-ink sm:text-xl"
          >
            <span
              aria-hidden="true"
              className="mr-1.5 inline-block -rotate-3 border border-verified px-1.5 py-0.5 font-mono text-xs text-verified"
            >
              C
            </span>
            Couponza
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex" aria-label="Main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className="rounded-sm px-3 py-1.5 text-sm text-ink-soft transition-colors hover:bg-ledger-line/40 hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden min-w-0 flex-1 justify-end md:flex lg:ml-0 lg:max-w-xs">
            <HeaderSearch />
          </div>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Link
              href={user ? "/account" : "/account/login"}
              className="flex items-center gap-2 rounded-sm border border-ledger-line bg-paper-raised px-3 py-1.5 text-sm text-ink transition-colors hover:border-inkblue hover:text-inkblue"
            >
              {user ? (
                <>
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-ink font-mono text-[10px] text-paper"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[10ch] truncate">{user.name}</span>
                </>
              ) : (
                "Sign in"
              )}
            </Link>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 md:hidden">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="btn-ghost flex h-11 w-11 items-center justify-center"
              aria-label="Search"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            <MobileNav
              links={links}
              accountLink={
                user
                  ? { href: "/account", label: "Your account" }
                  : { href: "/account/login", label: "Sign in" }
              }
              onOpenSearch={() => setMobileSearchOpen(true)}
            />
          </div>
        </div>
      </header>

      <MobileSearch isOpen={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />
    </>
  );
}