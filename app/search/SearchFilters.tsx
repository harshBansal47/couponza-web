"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dropdown } from "@/components/ui/Dropdown";

export interface SearchFiltersProps {
  stores: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
}

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage off" },
  { value: "fixed", label: "Fixed amount off" },
  { value: "deal", label: "Deal, no code" },
];

const SORTS = [
  { value: "relevance", label: "Best match" },
  { value: "verified", label: "Best confirmed" },
  { value: "discount", label: "Biggest discount" },
  { value: "newest", label: "Newest first" },
  { value: "expiring", label: "Ending soonest" },
];

function Trigger({ label, open }: { label: string; open: boolean }) {
  return (
    <span className="flex w-full items-center justify-between gap-2">
      <span className="truncate">{label}</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
}

/**
 * Filter controls for the search page.
 *
 * Filter state lives in the URL rather than React: results stay shareable and
 * crawlable, and the server component re-runs the query on every change. That
 * is why this is a client component that only ever pushes a new URL.
 */
export default function SearchFilters({ stores, categories }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const storeSlug = params.get("store") ?? "";
  const categorySlug = params.get("category") ?? "";
  const type = params.get("type") ?? "";
  const sort = params.get("sort") ?? "";
  const verified = params.get("verified") === "true";

  const storeName = stores.find((s) => s.slug === storeSlug)?.name;
  const categoryName = categories.find((c) => c.slug === categorySlug)?.name;
  const typeName = DISCOUNT_TYPES.find((t) => t.value === type)?.label;

  const activeCount =
    [storeSlug, categorySlug, type, sort].filter(Boolean).length + (verified ? 1 : 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams();
              const q = params.get("q");
              if (q) next.set("q", q);
              const qs = next.toString();
              router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
            }}
            className="text-xs text-inkblue underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <FilterGroup label="Store">
        <Dropdown
          searchable
          searchPlaceholder="Find a store…"
          width="16rem"
          options={[
            { value: "", label: "All stores" },
            { divider: true },
            ...stores.map((s) => ({ value: s.slug, label: s.name })),
          ]}
          onSelect={(value) => setParam("store", value || null)}
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="listbox"
              className="input flex items-center text-left"
            >
              <Trigger label={storeName ?? "All stores"} open={open} />
            </button>
          )}
        />
      </FilterGroup>

      <FilterGroup label="Category">
        <Dropdown
          searchable
          searchPlaceholder="Find a category…"
          width="16rem"
          options={[
            { value: "", label: "All categories" },
            { divider: true },
            ...categories.map((c) => ({ value: c.slug, label: c.name })),
          ]}
          onSelect={(value) => setParam("category", value || null)}
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="listbox"
              className="input flex items-center text-left"
            >
              <Trigger label={categoryName ?? "All categories"} open={open} />
            </button>
          )}
        />
      </FilterGroup>

      <FilterGroup label="Type">
        <Dropdown
          width="16rem"
          options={[{ value: "", label: "Any kind" }, { divider: true }, ...DISCOUNT_TYPES]}
          onSelect={(value) => setParam("type", value || null)}
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="listbox"
              className="input flex items-center text-left"
            >
              <Trigger label={typeName ?? "Any kind"} open={open} />
            </button>
          )}
        />
      </FilterGroup>

      <FilterGroup label="Sort">
        <Dropdown
          width="16rem"
          options={SORTS}
          onSelect={(value) => setParam("sort", value === "relevance" ? null : value)}
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="listbox"
              className="input flex items-center text-left"
            >
              <Trigger label={SORTS.find((s) => s.value === (sort || "relevance"))?.label ?? "Best match"} open={open} />
            </button>
          )}
        />
      </FilterGroup>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          checked={verified}
          onChange={(e) => setParam("verified", e.target.checked ? "true" : null)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--color-ink)]"
        />
        <span>
          Confirmed by someone
          <span className="mt-0.5 block text-xs text-ink-soft">
            Hide codes nobody has tried yet.
          </span>
        </span>
      </label>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-soft">{label}</p>
      {children}
    </div>
  );
}