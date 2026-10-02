"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Store } from "@/lib/types";

const RECENT_KEY = "couponza.recent";
const POPULAR_KEY = "couponza.popular";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(queries: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_KEY, JSON.stringify(queries));
}

export function HeaderSearch({
  popular: initialPopular,
  onSearch,
}: {
  popular?: string[];
  onSearch?: (query: string) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [popular, setPopular] = useState<string[]>(initialPopular ?? []);
  const [suggestions, setSuggestions] = useState<{ stores: Store[]; queries: string[] }>({ stores: [], queries: [] });
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortRef = useRef<AbortController>();

  useEffect(() => setRecent(loadRecent()), []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced autocomplete fetch
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setSuggestions({ stores: [], queries: [] });
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        const [storesRes, queriesRes] = await Promise.allSettled([
          api.listStores({ search: query, limit: 5 }, { signal: abortRef.current.signal }),
          api.listCategories({ search: query, limit: 5 }, { signal: abortRef.current.signal }),
        ]);

        const stores = storesRes.status === "fulfilled" ? storesRes.value.items : [];
        const categories = queriesRes.status === "fulfilled" ? queriesRes.value.items : [];
        const categoryNames = categories.map((c) => c.name);

        setSuggestions({ stores, queries: categoryNames });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Autocomplete failed:", err);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setActiveIndex(-1);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(newValue), 150);
  };

  const options = value.trim()
    ? [...suggestions.stores.map((s) => ({ type: "store" as const, label: s.name, value: s.slug })), ...suggestions.queries.map((q) => ({ type: "query" as const, label: q, value: q }))]
    : [
        ...recent.slice(0, 3).map((r) => ({ type: "recent" as const, label: r, value: r })),
        ...popular.slice(0, 5).map((p) => ({ type: "popular" as const, label: p, value: p })),
      ];

  function submit(query: string) {
    const q = query.trim();
    if (!q) return;

    const next = [q, ...loadRecent().filter((r) => r !== q)].slice(0, 6);
    saveRecent(next);
    setRecent(next);
    setOpen(false);
    setValue("");
    setActiveIndex(-1);
    onSearch?.(q);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        submit(options[activeIndex].value);
      } else {
        submit(value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-xs flex-1">
      <label htmlFor="header-search" className="sr-only">
        Search stores, brands, categories
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="header-search"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="header-search-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `hs-${activeIndex}` : undefined}
          aria-autocomplete="list"
          value={value}
          placeholder="Search Nike, laptops, Amazon…"
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="input w-full py-2 pl-10 pr-10"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-soft pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" aria-hidden="true">
            <svg className="animate-spin w-full h-full text-inkblue" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
            </svg>
          </div>
        )}
        {!loading && value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
            aria-label="Clear search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {open && options.length > 0 && (
        <ul
          id="header-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 border border-ledger-line bg-paper-raised shadow-[var(--shadow-overlay)] rounded-b-sm overflow-hidden"
        >
          {!value.trim() && recent.length > 0 && (
            <>
              <li className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-ink-soft border-b border-ledger-line">Recent</li>
              {options.filter((o) => o.type === "recent").map((o, i) => (
                <li key={o.value + i} id={`hs-${i}`} role="option" aria-selected={i === activeIndex}>
                  <button
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => submit(o.value)}
                    className={`block w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${i === activeIndex ? "bg-ledger-line/40" : ""}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft flex-shrink-0" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="truncate">{o.label}</span>
                  </button>
                </li>
              ))}
            </>
          )}
          {value.trim() && suggestions.stores.length > 0 && (
            <>
              <li className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-ink-soft border-b border-ledger-line">Stores</li>
              {suggestions.stores.map((s, i) => {
                const idx = options.findIndex((o) => o.type === "store" && o.value === s.slug);
                return (
                  <li key={s.slug} id={`hs-${idx}`} role="option" aria-selected={idx === activeIndex}>
                    <button
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => submit(s.name)}
                      className={`block w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${idx === activeIndex ? "bg-ledger-line/40" : ""}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-sm text-ink-soft" aria-hidden="true">
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{s.name}</span>
                    </button>
                  </li>
                );
              })}
            </>
          )}
          {(value.trim() && suggestions.queries.length > 0) || (!value.trim() && popular.length > 0) && (
            <>
              <li className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-ink-soft border-b border-ledger-line">
                {value.trim() ? "Categories" : "Popular"}
              </li>
              {(value.trim() ? suggestions.queries : popular.slice(0, 5)).map((q, i) => {
                const idx = options.findIndex((o) => o.type === "query" || (o.type === "popular" && o.value === q));
                return (
                  <li key={q + i} id={`hs-${idx}`} role="option" aria-selected={idx === activeIndex}>
                    <button
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => submit(q)}
                      className={`block w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${idx === activeIndex ? "bg-ledger-line/40" : ""}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft flex-shrink-0" aria-hidden="true">
                        <path d="M18 18l-6-6" />
                        <path d="M12 12l6-6" />
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span className="truncate">{q}</span>
                    </button>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

/** Mobile search panel - full screen overlay */
export function MobileSearch({
  isOpen,
  onClose,
  popular: initialPopular,
  onSearch,
}: {
  isOpen: boolean;
  onClose: () => void;
  popular?: string[];
  onSearch?: (query: string) => void;
}) {
  const [value, setValue] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [popular, setPopular] = useState<string[]>(initialPopular ?? []);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    const next = [q, ...loadRecent().filter((r) => r !== q)].slice(0, 6);
    saveRecent(next);
    setRecent(next);
    onSearch?.(q);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper" role="dialog" aria-modal="true" aria-label="Search">
      <div className="flex items-center gap-3 p-4 border-b border-ledger-line">
        <button
          onClick={onClose}
          className="btn-ghost p-2 -ml-2"
          aria-label="Close search"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <form onSubmit={handleSubmit} className="flex-1">
          <label htmlFor="mobile-search" className="sr-only">Search</label>
          <input
            ref={inputRef}
            id="mobile-search"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search stores, brands, categories…"
            className="input w-full py-3 text-base"
            autoFocus
          />
        </form>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {recent.length > 0 && (
          <section className="mb-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">Recent searches</h3>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setValue(r);
                    handleSubmit(new Event("submit") as unknown as React.FormEvent);
                  }}
                  className="btn-outline text-sm"
                >
                  {r}
                </button>
              ))}
            </div>
          </section>
        )}
        {popular.length > 0 && (
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-3">Popular searches</h3>
            <div className="flex flex-wrap gap-2">
              {popular.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setValue(p);
                    handleSubmit(new Event("submit") as unknown as React.FormEvent);
                  }}
                  className="btn-ghost text-sm"
                >
                  {p}
                </button>
              ))}
            </div>
          </section>
        )}
        {recent.length === 0 && popular.length === 0 && (
          <p className="text-center text-ink-soft py-12">Start typing to search stores, brands, and categories</p>
        )}
      </div>
    </div>
  );
}