"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { api } from "@/lib/api";
import type { AutocompleteResult } from "@/lib/types";

const RECENT_KEY = "couponza.recent";
const POPULAR_KEY = "couponza.popular";
const MAX_RECENT = 6;
const DEBOUNCE_MS = 150;
const MIN_QUERY_LENGTH = 2;

/*
 * Recent searches live in localStorage, which the server cannot read. Rather
 * than mirroring it into React state with an effect, this is a tiny external
 * store read through useSyncExternalStore: the server snapshot is empty, the
 * client snapshot is the real list, and React handles the hydration gap.
 */
const EMPTY: string[] = [];

let recentCache: string[] | null = null;
const listeners = new Set<() => void>();

function readRecent(): string[] {
  if (typeof window === "undefined") return EMPTY;
  if (recentCache) return recentCache;
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    recentCache = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    recentCache = [];
  }
  return recentCache;
}

function subscribeRecent(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getRecentServerSnapshot(): string[] {
  return EMPTY;
}

function rememberSearch(query: string): string[] {
  const next = [query, ...readRecent().filter((r) => r !== query)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private mode — recents are best-effort, so swallow and carry on */
  }
  recentCache = next;
  for (const listener of listeners) listener();
  return next;
}

function useRecentSearches() {
  const recent = useSyncExternalStore(subscribeRecent, readRecent, getRecentServerSnapshot);
  return { recent, remember: rememberSearch };
}

function readPopular(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(POPULAR_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return EMPTY;
  }
}

type Suggestion = { kind: "store" | "category" | "product" | "recent" | "popular"; label: string; href: string };

const NO_SUGGESTIONS: AutocompleteResult = { stores: [], categories: [], products: [] };

type SuggestionState = { query: string; groups: AutocompleteResult; pending: boolean };

/**
 * Debounced, abortable type-ahead. All state updates happen inside the debounce
 * timer so a keystroke never triggers a synchronous render; `groups`/`loading`
 * are then derived from whether the stored result matches the current query.
 */
function useSuggestions(query: string) {
  const trimmed = query.trim();
  const [state, setState] = useState<SuggestionState>({
    query: "",
    groups: NO_SUGGESTIONS,
    pending: false,
  });

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState({ query: trimmed, groups: NO_SUGGESTIONS, pending: true });
      try {
        const result = await api.autocomplete(trimmed, {
          limit: 5,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setState({ query: trimmed, groups: result, pending: false });
      } catch {
        if (!controller.signal.aborted) {
          setState({ query: trimmed, groups: NO_SUGGESTIONS, pending: false });
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  // A result from a previous keystroke must never be shown for the current one.
  const current = state.query === trimmed && trimmed.length >= MIN_QUERY_LENGTH ? state : null;
  return {
    groups: current?.groups ?? NO_SUGGESTIONS,
    loading: current?.pending ?? false,
  };
}

function suggestionHref(kind: Suggestion["kind"], label: string) {
  if (kind === "store") return `/search?q=${encodeURIComponent(label)}`;
  if (kind === "category") return `/search?category=${encodeURIComponent(label)}`;
  return `/search?q=${encodeURIComponent(label)}`;
}

function StoreGlyph({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper font-serif text-xs text-ink-soft"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function Icon({ name }: { name: "clock" | "category" | "tag" | "flame" }) {
  const paths = {
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </>
    ),
    category: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-3 3" />
        <path d="M8.5 15.5l3-3" />
      </>
    ),
    tag: (
      <>
        <path d="M20.6 13.4L12 22l-9-9V3h10l7.6 7.6a2 2 0 010 2.8z" />
        <circle cx="7.5" cy="7.5" r="1.2" />
      </>
    ),
    flame: (
      <>
        <path d="M12 22c4 0 7-2.7 7-6.5 0-4.5-4-6.5-4-11 0 0-2 1.5-2 4 0 1.5-1 2-1.8 1.3C10 8.6 9.5 7 9.5 7S5 10 5 15.5C5 19.3 8 22 12 22z" />
      </>
    ),
  }[name];

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-ink-soft"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

/**
 * Header search with debounced, abortable type-ahead over stores, categories
 * and products. Recents live in localStorage; popular terms are seeded by the
 * server so the first render already has something useful.
 */
export function HeaderSearch({ popular = [] }: { popular?: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { recent, remember } = useRecentSearches();
  const { groups, loading } = useSuggestions(value);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDocPointerDown(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, []);

  const suggestions = useMemo<Suggestion[]>(() => {
    const trimmed = value.trim();
    if (trimmed) {
      return [
        ...groups.stores.map((label) => ({ kind: "store" as const, label, href: suggestionHref("store", label) })),
        ...groups.categories.map((label) => ({ kind: "category" as const, label, href: suggestionHref("category", label) })),
        ...groups.products.map((label) => ({ kind: "product" as const, label, href: suggestionHref("product", label) })),
      ];
    }
    return [
      ...recent.slice(0, 3).map((label) => ({ kind: "recent" as const, label, href: suggestionHref("recent", label) })),
      ...popular.slice(0, 5).map((label) => ({ kind: "popular" as const, label, href: suggestionHref("popular", label) })),
    ];
  }, [value, groups, recent, popular]);

  const grouped = useMemo(() => {
    const sections: { title: string; items: { suggestion: Suggestion; index: number }[] }[] = [];
    for (const [index, suggestion] of suggestions.entries()) {
      const title =
        suggestion.kind === "store"
          ? "Stores"
          : suggestion.kind === "category"
            ? "Categories"
            : suggestion.kind === "product"
              ? "Products"
              : suggestion.kind === "recent"
                ? "Recent"
                : "Popular";
      const last = sections[sections.length - 1];
      if (last && last.title === title) last.items.push({ suggestion, index });
      else sections.push({ title, items: [{ suggestion, index }] });
    }
    return sections;
  }, [suggestions]);

  function submit(query: string) {
    const q = query.trim();
    if (!q) return;
    remember(q);
    setOpen(false);
    setActiveIndex(-1);
    setValue("");
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((a) => (suggestions.length === 0 ? -1 : (a + 1) % suggestions.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((a) => (suggestions.length === 0 ? -1 : (a - 1 + suggestions.length) % suggestions.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
      if (chosen) {
        if (chosen.kind === "recent") submit(chosen.label);
        else {
          remember(chosen.label);
          setOpen(false);
          router.push(chosen.href);
        }
      } else {
        submit(value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  const showPanel = open && grouped.length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <label htmlFor="header-search" className="sr-only">
        Search stores, brands, categories
      </label>
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Icon name="tag" />
        </span>
        <input
          ref={inputRef}
          id="header-search"
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="header-search-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `hs-${activeIndex}` : undefined}
          value={value}
          placeholder="Search stores, brands, categories…"
          onChange={(e) => {
            setValue(e.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="input w-full py-2 pl-10 pr-9"
        />
        {loading ? (
          <span
            aria-hidden="true"
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-ledger-line border-t-inkblue"
          />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-ink-soft transition-colors hover:text-ink"
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : null}
      </div>

      {showPanel && (
        <ul
          id="header-search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-auto rounded-sm border border-ledger-line bg-paper-raised shadow-[var(--shadow-overlay)]"
        >
          {grouped.map((section) => (
            <li key={section.title} role="presentation">
              <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-ink-soft">{section.title}</p>
              <ul role="presentation">
                {section.items.map(({ suggestion, index }) => (
                  <li key={`${suggestion.kind}-${suggestion.label}`} role="presentation">
                    <div
                      id={`hs-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        if (suggestion.kind === "recent") submit(suggestion.label);
                        else {
                          remember(suggestion.label);
                          setOpen(false);
                          router.push(suggestion.href);
                        }
                      }}
                      className={[
                        "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-ink",
                        index === activeIndex ? "bg-ledger-line/50" : "hover:bg-ledger-line/30",
                      ].join(" ")}
                    >
                      {suggestion.kind === "store" ? (
                        <StoreGlyph name={suggestion.label} />
                      ) : (
                        <Icon
                          name={
                            suggestion.kind === "category"
                              ? "category"
                              : suggestion.kind === "product"
                                ? "tag"
                                : suggestion.kind === "recent"
                                  ? "clock"
                                  : "flame"
                          }
                        />
                      )}
                      <span className="truncate">{suggestion.label}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Full-screen search for small screens, opened from the header. */
export function MobileSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const { recent, remember } = useRecentSearches();
  const { groups, loading } = useSuggestions(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const popular = readPopular();

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function go(query: string) {
    const q = query.trim();
    if (!q) return;
    remember(q);
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const live = value.trim()
    ? [
        ...groups.stores.map((label) => ({ label, href: `/search?q=${encodeURIComponent(label)}` })),
        ...groups.categories.map((label) => ({ label, href: `/search?category=${encodeURIComponent(label)}` })),
        ...groups.products.map((label) => ({ label, href: `/search?q=${encodeURIComponent(label)}` })),
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper md:hidden" role="dialog" aria-modal="true" aria-label="Search">
      <div className="flex items-center gap-2 border-b border-ledger-line px-3 py-3">
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost -ml-1 flex h-11 w-11 items-center justify-center"
          aria-label="Close search"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <form
          role="search"
          className="flex-1"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            go(value);
          }}
        >
          <label htmlFor="mobile-search" className="sr-only">
            Search stores, brands, categories
          </label>
          <input
            ref={inputRef}
            id="mobile-search"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search stores, brands, categories…"
            className="input w-full py-3 text-base"
            autoComplete="off"
          />
        </form>
        {loading && (
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-ledger-line border-t-inkblue" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-4">
        {live.length > 0 ? (
          <section aria-label="Suggestions">
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-soft">Suggestions</h2>
            <ul className="space-y-1">
              {live.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      remember(item.label);
                      onClose();
                      router.push(item.href);
                    }}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-3 text-left text-base text-ink hover:bg-ledger-line/40"
                  >
                    <Icon name="tag" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {recent.length > 0 && (
          <section className="mb-6" aria-label="Recent searches">
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-soft">Recent searches</h2>
            <ul className="space-y-1">
              {recent.map((r) => (
                <li key={r}>
                  <button type="button" onClick={() => go(r)} className="flex w-full items-center gap-2 rounded-sm px-3 py-3 text-left text-base text-ink hover:bg-ledger-line/40">
                    <Icon name="clock" />
                    {r}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {popular.length > 0 && (
          <section aria-label="Popular searches">
            <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink-soft">Popular searches</h2>
            <ul className="space-y-1">
              {popular.map((p) => (
                <li key={p}>
                  <button type="button" onClick={() => go(p)} className="flex w-full items-center gap-2 rounded-sm px-3 py-3 text-left text-base text-ink hover:bg-ledger-line/40">
                    <Icon name="flame" />
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {live.length === 0 && recent.length === 0 && popular.length === 0 && (
          <p className="py-12 text-center text-ink-soft">Start typing to search stores, brands, categories and products.</p>
        )}
      </div>
    </div>
  );
}

export default HeaderSearch;