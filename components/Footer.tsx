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
    <footer className="mt-16 no-print">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="bg-brand relative overflow-hidden rounded-[28px] px-6 py-10 text-white shadow-[var(--shadow-overlay)] sm:px-12">
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
          <span aria-hidden="true" className="animate-float pointer-events-none absolute -right-4 -top-6 text-7xl opacity-30">%</span>
          <span aria-hidden="true" style={{ "--r": "-12deg" } as React.CSSProperties} className="animate-float-slow pointer-events-none absolute bottom-2 right-24 hidden text-5xl opacity-30 sm:block">★</span>
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <h2 className="font-serif text-2xl font-extrabold sm:text-3xl">Stop checking back. Let the price come to you.</h2>
              <p className="mt-2 text-sm text-white/85">
                Follow a product and we email you when its price drops or a confirmed code appears. Free, no spam.
              </p>
            </div>
            <Link href="/account/register" className="btn btn-cta shrink-0 px-6 py-3 text-base">
              Create a free account
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-brand-night mt-14 text-white/80">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 sm:grid-cols-5">
            <div className="sm:col-span-1">
              <p className="flex items-center font-serif text-xl font-extrabold text-white">
                <span aria-hidden="true" className="bg-brand mr-2 inline-flex h-8 w-8 -rotate-6 items-center justify-center rounded-xl text-base">C</span>
                Couponbase
              </p>
              <p className="mt-3 text-sm text-white/65">Find deals worth trusting.</p>
            </div>
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-bold text-white">{col.title}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-white/70 transition-colors hover:text-sun">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Couponbase. Every code community-verified, every commission disclosed.</p>
            <p className="rounded-full bg-white/10 px-3 py-1">We may earn a commission when you shop through our links. It never changes the order of results.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
