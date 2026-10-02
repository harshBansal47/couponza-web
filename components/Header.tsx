import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-ledger-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-serif text-xl font-medium tracking-tight text-ink">
          Couponza
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-ink-soft hover:text-ink">
            Browse
          </Link>
          <Link href="/trust" className="text-ink-soft hover:text-ink">
            How this works
          </Link>
        </nav>
      </div>
    </header>
  );
}
