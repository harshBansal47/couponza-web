"use client";

import Link from "next/link";
import { useState } from "react";

export default function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="border border-ledger-line bg-paper-raised px-3 py-1.5 text-sm text-ink"
      >
        {open ? "✕" : "☰"}
      </button>
      {open ? (
        <nav className="absolute inset-x-0 top-full border-b border-ledger-line bg-paper px-6 py-4 shadow-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm text-ink hover:text-inkblue"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
