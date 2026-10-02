"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const RECENT_KEY = "couponza.recent";

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function HeaderSearch({ popular }: { popular: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setRecent(loadRecent()), []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const suggestions = value.trim()
    ? popular.filter((p) => p.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
    : [];
  const options = value.trim() ? suggestions : [...recent.slice(0, 3), ...popular.slice(0, 4)];

  function submit(query: string) {
    const q = query.trim();
    if (!q) return;
    const next = [q, ...loadRecent().filter((r) => r !== q)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setRecent(next);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={boxRef} className="relative hidden w-48 sm:block md:w-56">
      <label htmlFor="header-search" className="sr-only">Search</label>
      <input
        id="header-search"
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="header-search-suggestions"
        aria-activedescendant={active >= 0 ? `hs-${active}` : undefined}
        value={value}
        placeholder="Search"
        onChange={(e) => {
          setValue(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, -1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            submit(active >= 0 ? options[active] : value);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="input py-1.5"
      />
      {open && options.length > 0 && (
        <ul
          id="header-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 border border-ledger-line bg-paper-raised shadow-[var(--shadow-overlay)]"
        >
          {!value.trim() && recent.length > 0 && (
            <li className="px-3 pt-2 font-mono text-[10px] uppercase tracking-widest text-ink-soft">Recent</li>
          )}
          {options.map((o, i) => (
            <li key={o + i} id={`hs-${i}`} role="option" aria-selected={i === active}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => submit(o)}
                className={`block w-full px-3 py-2 text-left text-sm ${i === active ? "bg-ledger-line/40" : ""}`}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
