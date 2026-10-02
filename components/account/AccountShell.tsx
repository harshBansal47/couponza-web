import type { ReactNode } from "react";
import Link from "next/link";
import { displayName } from "@/lib/session";
import { logoutAction } from "@/app/account/actions";

const TABS = [
  { href: "/account", label: "Overview" },
  { href: "/account/saved", label: "Saved" },
  { href: "/account/products", label: "Tracked" },
  { href: "/account/alerts", label: "Alerts" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/settings", label: "Settings" },
];

/**
 * Shared account shell: the signed-in identity, the tab rail, and a sign-out
 * form. Every account page renders inside this so navigation is consistent.
 */
export default function AccountShell({
  user,
  active,
  counts = {},
  children,
}: {
  user: { email: string; full_name: string | null };
  active: string;
  counts?: Partial<Record<string, number>>;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ledger-line pb-6">
        <div className="min-w-0">
          <h1 className="font-serif text-3xl text-ink">{displayName(user)}</h1>
          <p className="truncate text-sm text-ink-soft">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink hover:no-underline"
          >
            Sign out
          </button>
        </form>
      </header>

      <nav
        aria-label="Account sections"
        className="-mb-px overflow-x-auto border-b border-ledger-line scrollbar-hide"
      >
        <ul className="flex min-w-max">
          {TABS.map((tab) => {
            const isActive = tab.href === active;
            const count = counts[tab.href];
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm whitespace-nowrap transition-colors",
                    isActive
                      ? "border-ink text-ink"
                      : "border-transparent text-ink-soft hover:border-ledger-line hover:text-ink",
                  ].join(" ")}
                >
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span className="font-mono text-[10px] text-ink-soft">{count}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="pt-8">{children}</div>
    </div>
  );
}
