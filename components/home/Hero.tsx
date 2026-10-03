import Link from "next/link";

interface HeroProps {
  stats: { label: string; value: number }[];
  popularStores: { id: string; name: string; slug: string }[];
}

/** Floating decorative shapes. Pure SVG/emoji, no network, hidden from AT. */
function Floaters() {
  const items = [
    { ch: "%", cls: "left-[6%] top-[14%] text-6xl", r: "-10deg", slow: false },
    { ch: "★", cls: "right-[9%] top-[10%] text-5xl text-sun", r: "12deg", slow: true },
    { ch: "₹", cls: "left-[44%] bottom-[8%] text-5xl", r: "8deg", slow: true },
    { ch: "✓", cls: "right-[4%] bottom-[20%] text-6xl", r: "-6deg", slow: false },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden sm:block">
      {items.map((it) => (
        <span
          key={it.ch}
          style={{ "--r": it.r } as React.CSSProperties}
          className={`absolute font-serif font-extrabold text-white/25 ${it.slow ? "animate-float-slow" : "animate-float"} ${it.cls}`}
        >
          {it.ch}
        </span>
      ))}
    </div>
  );
}

export default function Hero({ stats, popularStores }: HeroProps) {
  return (
    <section className="bg-brand relative overflow-hidden rounded-[28px] px-5 py-12 text-white shadow-[var(--shadow-overlay)] sm:px-12 sm:py-16">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-sun/30 blur-3xl" aria-hidden="true" />
      <Floaters />

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-sun" aria-hidden="true" />
          Codes confirmed by real shoppers
        </p>
        <h1 className="mt-5 text-balance font-serif text-4xl font-extrabold leading-[1.05] sm:text-6xl">
          Find a deal worth trusting.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-white/85 sm:text-lg">
          Search stores, brands and products. Every code shows a real success rate, and every commission we earn is
          printed on the page.
        </p>

        <form action="/search" role="search" className="mx-auto mt-8 max-w-xl">
          <label htmlFor="hero-search" className="sr-only">
            Search Couponza
          </label>
          <div className="flex items-center gap-2 rounded-full bg-white p-1.5 shadow-[var(--shadow-overlay)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ml-3 shrink-0 text-ink-soft" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              id="hero-search"
              name="q"
              type="search"
              placeholder="Search Nike, laptops, electronics…"
              className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none sm:text-base"
            />
            <button type="submit" className="btn btn-cta px-5 py-2.5 sm:px-7">
              Search
            </button>
          </div>
        </form>

        {popularStores.length > 0 && (
          <p className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm text-white/85">
            <span className="font-medium">Popular:</span>
            {popularStores.slice(0, 5).map((store) => (
              <Link
                key={store.id}
                href={`/stores/${store.slug}`}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur transition-colors hover:bg-white hover:text-inkblue"
              >
                {store.name}
              </Link>
            ))}
          </p>
        )}

        {stats.some((s) => s.value > 0) && (
          <dl className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3">
            {stats
              .filter((s) => s.value > 0)
              .map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/12 px-3 py-3 backdrop-blur">
                  <dt className="order-2 text-[11px] font-medium text-white/75">{s.label}</dt>
                  <dd className="font-serif text-2xl font-extrabold">{s.value.toLocaleString("en-IN")}</dd>
                </div>
              ))}
          </dl>
        )}
      </div>
    </section>
  );
}
