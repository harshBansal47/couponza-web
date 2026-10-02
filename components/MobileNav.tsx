"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

interface MobileNavProps {
  links: { href: string; label: string }[];
}

export default function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) {
    return (
      <div className="md:hidden">
        <button
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="btn-ghost p-2 -mr-2 touch-target"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-paper" role="dialog" aria-modal="true" aria-label="Navigation">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-ledger-line">
        <span className="font-serif text-lg text-ink">Menu</span>
        <button
          onClick={() => setOpen(false)}
          className="btn-ghost p-2 -mr-2 -mt-2 touch-target"
          aria-label="Close menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-base text-ink hover:bg-ledger-line/40 rounded-sm transition-colors touch-target"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Footer - Search trigger */}
      <div className="p-4 border-t border-ledger-line">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            // Trigger mobile search - this will be handled by parent
            document.dispatchEvent(new CustomEvent("open-mobile-search"));
          }}
          className="btn-outline w-full justify-center touch-target"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Search
        </button>
      </div>
    </div>
  );
}