import Link from "next/link";
import MobileNav from "./MobileNav";

const NAV = [
  { href: "/coupons", label: "Coupons" },
  { href: "/deals", label: "Deals" },
  { href: "/stores", label: "Stores" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
  { href: "/trust", label: "How this works" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ledger-line bg-paper/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-xl font-medium tracking-tight text-ink">
          <span className="mr-1.5 inline-block rotate-[-3deg] border border-verified px-1.5 py-0.5 font-mono text-xs text-verified">
            C
          </span>
          Couponza
        </Link>
        <nav className="hidden items-center gap-5 text-sm md:flex" aria-label="Main">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink-soft transition-colors hover:text-ink">
              {l.label}
            </Link>
          ))}
          <Link
            href="/account"
            className="border border-ledger-line bg-paper-raised px-3 py-1.5 text-ink transition-colors hover:border-inkblue hover:text-inkblue"
          >
            Sign in
          </Link>
        </nav>
        <MobileNav links={[...NAV, { href: "/account", label: "Sign in" }]} />
      </div>
    </header>
  );
}
