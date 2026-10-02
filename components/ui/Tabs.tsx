"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";

/**
 * Server-side tabs: each tab is a link keeping current params.
 * State lives in the URL (shareable, crawlable) instead of React state.
 */
interface ServerTab {
  href: string;
  label: string;
  count?: number;
}

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
    <nav className={`flex gap-1 border-b border-ledger-line ${className}`} aria-label="Tabs">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={active === t.href ? "page" : undefined}
          className={`border-b-2 px-4 py-2 text-sm ${
            active === t.href
              ? "border-ink text-ink"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
              active === t.href ? "bg-ink/10 text-ink" : "bg-ledger-line text-ink-soft"
            }`}>
            {t.count}
          </span>
        )}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Client-side tabs: state lives in React, no URL change.
 * Use for UI that doesn't need deep-linking (e.g., settings panels).
 */
interface ClientTab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  count?: number;
}

export function ClientTabs({
  tabs,
  defaultTab,
  onChange,
  className = "",
}: {
  tabs: ClientTab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    if (!defaultTab && tabs[0]) {
      setActiveTab(tabs[0].id);
    }
  }, [defaultTab, tabs]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      newIndex = tabs.length - 1;
    }
    if (newIndex !== index && !tabs[newIndex].disabled) {
      const newTab = tabs[newIndex];
      setActiveTab(newTab.id);
      onChange?.(newTab.id);
      tabRefs.current[newIndex]?.focus();
    }
  };

  return (
    <div className={className}>
      <div
        ref={tabListRef}
        role="tablist"
        className="flex gap-1 border-b border-ledger-line"
        aria-label="Tabs"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => (tabRefs.current[index] = el!)}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            aria-disabled={tab.disabled}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => {
              if (!tab.disabled) {
                setActiveTab(tab.id);
                onChange?.(tab.id);
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-ink text-ink"
                : "border-b-2 border-transparent text-ink-soft hover:text-ink"
            } ${tab.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-mono rounded-full ${
                activeTab === tab.id ? "bg-ink/10 text-ink" : "bg-ledger-line text-ink-soft"
              }`}>
              {tab.count}
            </span>}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className="mt-4"
        >
          {activeTab === tab.id && tab.content}
        </div>
      ))}
    </div>
  );
}