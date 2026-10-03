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
        className={`sticky top-0 z-40 border-b border-ledger-line/70 bg-white/85 backdrop-blur-md transition-shadow duration-200 ${
          scrolled ? "shadow-[var(--shadow-raised)]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/"
            className="flex shrink-0 items-center font-serif text-xl font-extrabold tracking-tight text-ink sm:text-2xl"
          >
            <span
              aria-hidden="true"
              className="bg-brand mr-2 inline-flex h-8 w-8 -rotate-6 items-center justify-center rounded-xl font-serif text-base font-extrabold text-white shadow-[var(--shadow-glow)]"
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
                className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-inkblue/10 hover:text-inkblue aria-[current=page]:bg-inkblue/10 aria-[current=page]:text-inkblue"
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
              className="flex items-center gap-2 rounded-full border border-inkblue/30 bg-white px-4 py-1.5 text-sm font-semibold text-inkblue transition-all hover:bg-inkblue hover:text-white hover:shadow-[var(--shadow-glow)]"
            >
              {user ? (
                <>
                  <span
                    aria-hidden="true"
                    className="bg-brand flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] text-white"
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