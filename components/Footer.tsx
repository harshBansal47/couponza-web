import Link from "next/link";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Deals",
    links: [
      { href: "/coupons", label: "Coupons" },
      { href: "/deals", label: "Today's deals" },
      { href: "/stores", label: "Stores" },
      { href: "/categories", label: "Categories" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/trust", label: "How it works" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/account", label: "My account" },
      { href: "/account/saved", label: "Saved deals" },
      { href: "/account/products", label: "Tracked prices" },
      { href: "/account/unsubscribe", label: "Turn off emails" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/trust", label: "Our verification" },
      { href: "/trust#commissions", label: "Commission disclosure" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-ledger-line">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <p className="font-serif text-lg text-ink">Couponza</p>
            <p className="mt-2 text-sm text-ink-soft">Find deals worth trusting.</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">{col.title}</p>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-ink hover:text-inkblue">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-ledger-line pt-4 font-mono text-xs text-ink-soft">
          © {new Date().getFullYear()} Couponza — every code community-verified, every commission disclosed.
        </p>
      </div>
    </footer>
  );
}
