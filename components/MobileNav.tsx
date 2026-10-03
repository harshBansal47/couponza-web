"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "./Header";

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Small-screen navigation drawer. Rendered in a portal as a full-screen
 * overlay with its own focus trap and scroll lock, so it behaves like a dialog.
 */
export default function MobileNav({
  links,
  accountLink,
  onOpenSearch,
}: {
  links: NavLink[];
  accountLink: NavLink;
  onOpenSearch?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="btn-ghost flex h-11 w-11 items-center justify-center touch-target"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
            {/* Backdrop */}
            <div
              className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm"
              onClick={close}
              role="presentation"
              aria-hidden="true"
            />

            {/* Full-screen panel on mobile. The whole panel scrolls on short screens. */}
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="absolute inset-y-0 right-0 flex w-full animate-slide-in flex-col overflow-y-auto overscroll-contain bg-paper shadow-[var(--shadow-overlay)] md:max-w-sm md:border-l md:border-ledger-line"
            >
              {/* Top bar: brand + close, mirrors the site header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-ledger-line bg-paper-raised px-4">
                <span className="flex items-center font-serif text-lg font-medium tracking-tight text-ink">
                  <span
                    aria-hidden="true"
                    className="mr-1.5 inline-block -rotate-3 border border-verified px-1.5 py-0.5 font-mono text-xs text-verified"
                  >
                    C
                  </span>
                  Couponbase
                </span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="btn-ghost -mr-2 flex h-11 w-11 items-center justify-center touch-target"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Links */}
              <nav aria-label="Mobile" className="shrink-0 bg-paper px-3 py-3">
                <ul className="space-y-1">
                  {links.map((link, index) => (
                    <li key={link.href} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-up-stagger">
                      <Link
                        href={link.href}
                        onClick={close}
                        aria-current={pathname === link.href ? "page" : undefined}
                        className={`flex min-h-12 items-center rounded-sm px-4 py-3 text-base transition-colors duration-150 ${
                          pathname === link.href
                            ? "bg-ledger-line/50 font-medium text-ink"
                            : "text-ink-soft hover:bg-ledger-line/30 hover:text-ink"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Actions: pinned to bottom on tall screens, scrolls on short ones */}
              <div className="mt-auto shrink-0 space-y-3 border-t border-ledger-line bg-paper-raised px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                {onOpenSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onOpenSearch();
                    }}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-sm border border-ledger-line bg-paper px-4 text-base font-medium text-ink transition-colors hover:border-inkblue hover:text-inkblue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkblue"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    Search
                  </button>
                )}
                <Link
                  href={accountLink.href}
                  onClick={close}
                  className="btn btn-primary flex h-12 w-full text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inkblue focus-visible:ring-offset-2"
                >
                  {accountLink.label}
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}