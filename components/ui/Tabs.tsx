import Link from "next/link";

/** Server-component tabs: each tab is a link keeping the current params, so
 * state lives in the URL (shareable, crawlable) instead of React state. */
export default function Tabs({
  tabs,
  active,
}: {
  tabs: { href: string; label: string }[];
  active: string;
}) {
  return (
    <nav className="flex gap-1 border-b border-ledger-line" aria-label="Tabs">
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
        </Link>
      ))}
    </nav>
  );
}
