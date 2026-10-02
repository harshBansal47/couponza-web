"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Server tabs — state lives in the URL, not React                     */
/* ------------------------------------------------------------------ */

export interface ServerTab {
  href: string;
  label: string;
  count?: number;
}

/**
 * Link-based tabs. The active tab is a real URL, so the view is shareable,
 * back-button friendly and crawlable — which is why this exists alongside the
 * client variant below rather than replacing it.
 */
export function ServerTabs({
  tabs,
  active,
  className = "",
}: {
  tabs: ServerTab[];
  active: string;
  className?: string;
}) {
  return (
    <nav className={`flex gap-1 overflow-x-auto border-b border-ledger-line scrollbar-hide ${className}`} aria-label="Tabs">
      {tabs.map((tab) => {
        const isActive = tab.href === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={[
              "shrink-0 border-b-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "border-ink text-ink"
                : "border-transparent text-ink-soft hover:border-ledger-line hover:text-ink",
            ].join(" ")}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 font-mono text-[10px] text-ink-soft">{tab.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Client tabs — roving focus, APG keyboard model                      */
/* ------------------------------------------------------------------ */

export interface ClientTab {
  id: string;
  label: string;
  content: ReactNode;
  count?: number;
  disabled?: boolean;
}

/**
 * Client-side tabs following the ARIA authoring practices: arrow keys move
 * between tabs, Home/End jump to the ends, and only the active tab is in the
 * tab order.
 */
export function ClientTabs({
  tabs,
  defaultTab,
  onChange,
  className = "",
}: {
  tabs: ClientTab[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const baseId = useId();
  const firstEnabled = tabs.find((t) => !t.disabled)?.id ?? tabs[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(defaultTab || firstEnabled);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Derived rather than synchronised with an effect: if the tab set changes
  // underneath us (a filter emptied the open tab), the selection falls back to
  // the first usable tab without an extra render pass.
  const activeTab = tabs.some((t) => t.id === selectedId && !t.disabled)
    ? selectedId
    : firstEnabled;

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      onChange?.(id);
    },
    [onChange],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const enabled = tabs.filter((t) => !t.disabled);
    if (enabled.length === 0) return;

    let target: ClientTab | undefined;
    switch (event.key) {
      case "ArrowRight":
        target = enabled[(enabled.findIndex((t) => t.id === tabs[index].id) + 1) % enabled.length];
        break;
      case "ArrowLeft":
        target = enabled[(enabled.findIndex((t) => t.id === tabs[index].id) - 1 + enabled.length) % enabled.length];
        break;
      case "Home":
        target = enabled[0];
        break;
      case "End":
        target = enabled[enabled.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    if (!target) return;
    select(target.id);
    tabRefs.current[target.id]?.focus();
  }

  if (tabs.length === 0) return null;

  const active = tabs.find((t) => t.id === activeTab);

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-ledger-line scrollbar-hide">
        {tabs.map((tab, index) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              disabled={tab.disabled}
              tabIndex={selected ? 0 : -1}
              onClick={() => !tab.disabled && select(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={[
                "shrink-0 border-b-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
                selected
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-soft hover:border-ledger-line hover:text-ink",
                tab.disabled ? "cursor-not-allowed opacity-40" : "",
              ].join(" ")}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 font-mono text-[10px] text-ink-soft">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {active && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className="pt-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-inkblue"
        >
          {active.content}
        </div>
      )}
    </div>
  );
}

export default ClientTabs;