"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CouponCard } from "@/components/CouponCard";
import { ClientTabs } from "@/components/ui/Tabs";
import type { CouponPublic, Store } from "@/lib/types";

interface StorePageClientProps {
  store: Store;
  tabs: Record<string, { label: string; items: CouponPublic[] }>;
  stats: { total: number; verified: number; avgRate: number };
  relatedStores: Store[];
  /** ISO 4217 code; falls back to USD when the store has no currency set. */
  currency: string | null;
}

function StoreMark({ store, size = 64 }: { store: Store; size?: number }) {
  if (store.logo_url) {
    return (
      <Image
        src={store.logo_url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-ledger-line bg-paper object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper font-serif text-ink-soft"
      style={{ width: size, height: size, fontSize: size / 2.6 }}
    >
      {store.name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function StorePageClient({
  store,
  tabs,
  stats,
  relatedStores,
  currency,
}: StorePageClientProps) {
  const code = currency ?? "USD";

  // A tab with nothing in it is noise — only offer tabs that have coupons.
  const visibleTabs = useMemo(
    () =>
      Object.entries(tabs)
        .filter(([, tab]) => tab.items.length > 0)
        .map(([id, tab]) => ({
          id,
          label: tab.label,
          count: tab.items.length,
          content: (
            <div className="grid gap-4 sm:grid-cols-2">
              {tab.items.slice(0, 12).map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  store={{ id: store.id, name: store.name, slug: store.slug, logo_url: store.logo_url, currency: code }}
                  variant={id === "expiring" ? "expiring-soon" : "coupon"}
                />
              ))}
            </div>
          ),
        })),
    [tabs, store, code],
  );

  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const payload = { title: `${store.name} deals on Couponza`, url };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The visitor dismissed the share sheet, or clipboard access was denied.
    }
  }

  return (
    <div className="space-y-10 sm:space-y-14">
      <header className="bg-brand relative overflow-hidden rounded-[26px] text-white shadow-[var(--shadow-overlay)]">
        {/* Dynamic per-store poster from /banners/[slug]; the gradient above shows if it fails to load. */}
        <Image
          src={`/banners/${store.slug}`}
          alt=""
          fill
          unoptimized
          priority
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover"
        />
        <div className="relative flex flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:px-9 sm:py-10">
          <div className="shrink-0 self-start rounded-full bg-white p-1.5 shadow-[var(--shadow-overlay)]">
            <StoreMark store={store} size={76} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-3xl font-extrabold leading-tight sm:text-5xl">{store.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
              {store.country_code && <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">{store.country_code}</span>}
              <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">{stats.total} listed deals</span>
              {store.website_url && (
                <a
                  href={store.website_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-full bg-white/20 px-3 py-1 backdrop-blur transition-colors hover:bg-white hover:text-inkblue"
                >
                  {new URL(store.website_url).hostname.replace(/^www\./, "")}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
            {store.description && <p className="mt-3 max-w-prose text-sm text-white/90 sm:text-base">{store.description}</p>}
          </div>

          <button
            type="button"
            onClick={share}
            className="btn shrink-0 self-start bg-white text-inkblue hover:bg-white/90"
            aria-live="polite"
          >
            {copied ? "Link copied" : "Share"}
          </button>
        </div>
      </header>

      {/* Disclosure sits above the deals, not buried in a footer — the whole
          point of the site is that you can see where the money comes from. */}
      {store.commission_disclosure && (
        <section className="rounded-2xl border border-inkblue/20 bg-inkblue/5 px-5 py-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-inkblue">Commission</h2>
          <p className="mt-1 text-sm text-ink">{store.commission_disclosure}</p>
        </section>
      )}

      {visibleTabs.length > 0 ? (
        <ClientTabs tabs={visibleTabs} />
      ) : (
        <p className="rounded-[22px] border-2 border-dashed border-ledger-line bg-white px-4 py-10 text-center text-ink-soft">
          No active codes for {store.name} right now. We only list codes a person has confirmed, so
          this page stays empty rather than showing dead offers.
        </p>
      )}

      <section aria-labelledby="proof">
        <h2 id="proof" className="font-serif text-2xl font-extrabold text-ink">
          How much of this is actually confirmed
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="lift rounded-2xl border border-ledger-line bg-white p-4 shadow-[var(--shadow-hairline)]">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
              Confirmed codes
            </dt>
            <dd className="mt-1 font-serif text-3xl font-extrabold text-ink">{stats.verified}</dd>
            <p className="mt-1 text-xs text-ink-soft">of {stats.total} listed</p>
          </div>
          <div className="lift rounded-2xl border border-ledger-line bg-white p-4 shadow-[var(--shadow-hairline)]">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
              Average success
            </dt>
            <dd className="mt-1 font-serif text-3xl font-extrabold text-ink">
              {stats.total > 0 ? `${Math.round(stats.avgRate * 100)}%` : "—"}
            </dd>
            <p className="mt-1 text-xs text-ink-soft">across every vote on this store</p>
          </div>
          <div className="lift rounded-2xl border border-ledger-line bg-white p-4 shadow-[var(--shadow-hairline)]">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Prices in</dt>
            <dd className="mt-1 font-serif text-3xl font-extrabold text-ink">{code}</dd>
            <p className="mt-1 text-xs text-ink-soft">{store.country_code ?? "all markets"}</p>
          </div>
        </dl>
        <p className="mt-3 text-sm text-ink-soft">
          One person saying a code worked is not evidence. Every vote on Couponza is timestamped and
          counted —{" "}
          <Link href="/trust" className="text-inkblue underline-offset-2 hover:underline">
            here is how the counting works
          </Link>
          .
        </p>
      </section>

      {relatedStores.length > 0 && (
        <section aria-labelledby="related">
          <h2 id="related" className="font-serif text-2xl font-extrabold text-ink">
            Other stores we track
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedStores.map((related) => (
              <li key={related.id}>
                <Link
                  href={`/stores/${related.slug}`}
                  className="lift flex items-center gap-3 rounded-2xl border border-ledger-line bg-white p-3"
                >
                  <StoreMark store={related} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{related.name}</span>
                    {related.country_code && (
                      <span className="block font-mono text-[10px] text-ink-soft">
                        {related.country_code}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-ink-soft">
        Looking for a specific product instead?{" "}
        <Link href="/search" className="text-inkblue underline-offset-2 hover:underline">
          Search all deals
        </Link>{" "}
        and track its price — we email you when it falls.
      </p>
    </div>
  );
}