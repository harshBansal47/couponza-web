"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ServerTabs, ClientTabs } from "@/components/ui/Tabs";
import CouponCard, { CouponCardGrid } from "@/components/CouponCard";
import { formatDiscount, successRateLabel, formatRelativeTime } from "@/lib/format";
import type { CouponPublic, Store } from "@/lib/types";

interface StorePageClientProps {
  store: Store;
  coupons: { items: CouponPublic[]; total: number };
  initialTab?: string;
}

export default function StorePageClient({ store, coupons, initialTab }: StorePageClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "best");

  // Categorize coupons
  const bestCoupons = coupons.items
    .filter((c) => c.last_verified_at !== null)
    .sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0))
    .slice(0, 10);

  const latestDeals = [...coupons.items]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const expiringSoon = coupons.items
    .filter((c) => c.expires_at && new Date(c.expires_at) > new Date())
    .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime())
    .slice(0, 10);

  const tabs = [
    { id: "best", label: "Best Coupons", count: bestCoupons.length, content: bestCoupons },
    { id: "latest", label: "Latest Deals", count: latestDeals.length, content: latestDeals },
    { id: "expiring", label: "Expiring Soon", count: expiringSoon.length, content: expiringSoon },
  ];

  return (
    <div className="space-y-12">
      {/* Store Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex-shrink-0">
          {store.logo_url ? (
            <Image
              src={store.logo_url}
              alt={`${store.name} logo`}
              width={80}
              height={80}
              className="rounded-full border border-ledger-line object-contain bg-paper-raised"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-3xl text-ink-soft">
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-3xl text-ink truncate">{store.name}</h1>
          {store.website_url && (
            <a
              href={store.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-inkblue hover:underline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Visit store
            </a>
          )}
          {store.description && <p className="mt-2 text-ink-soft line-clamp-3">{store.description}</p>}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button type="button" className="btn-outline flex-1 sm:flex-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Follow
          </button>
          <button type="button" className="btn-ghost p-2" aria-label="Share">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
      </header>

      {/* Commission Disclosure */}
      {store.commission_disclosure && (
        <section className="rounded-md border border-ledger-line bg-paper-raised p-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink-soft mb-2">Commission Disclosure</h2>
          <p className="text-sm text-ink">{store.commission_disclosure}</p>
        </section>
      )}

      {/* Tabs for coupon sections */}
      <ClientTabs
        tabs={tabs.map((t) => ({
          id: t.id,
          label: t.label,
          count: t.count,
          content: (
            <CouponCardGrid
              coupons={t.content}
              variant={t.id === "expiring" ? "expiring-soon" : "coupon"}
              columns={{ base: 1, sm: 1, lg: 1 }}
            />
          ),
        }))}
        defaultTab={activeTab}
        onChange={setActiveTab}
      />

      {/* About Store */}
      {store.about && (
        <section>
          <h2 className="font-serif text-xl text-ink mb-3">About {store.name}</h2>
          <div className="prose prose-ink max-w-none text-sm text-ink-soft">{store.about}</div>
        </section>
      )}

      {/* Verification Information */}
      <section>
        <h2 className="font-serif text-xl text-ink mb-3">Verification Information</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-ledger-line bg-paper-raised p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">Total Coupons</p>
            <p className="mt-1 font-serif text-3xl text-ink">{coupons.total}</p>
          </div>
          <div className="rounded-md border border-ledger-line bg-paper-raised p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">Verified Coupons</p>
            <p className="mt-1 font-serif text-3xl text-ink">
              {coupons.items.filter((c) => c.last_verified_at).length}
            </p>
          </div>
          <div className="rounded-md border border-ledger-line bg-paper-raised p-4">
            <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">Avg. Success Rate</p>
            <p className="mt-1 font-serif text-3xl text-ink">
              {coupons.items.length > 0
                ? Math.round(
                    coupons.items.reduce((sum, c) => sum + (c.success_rate ?? 0), 0) / coupons.items.length * 100
                  ) + "%"
                : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      {store.faq && store.faq.length > 0 && (
        <section>
          <h2 className="font-serif text-xl text-ink mb-4">Frequently Asked Questions</h2>
          <dl className="space-y-4">
            {store.faq.map((item, i) => (
              <div key={i} className="rounded-md border border-ledger-line bg-paper-raised overflow-hidden">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left font-medium text-ink flex items-center justify-between"
                  aria-expanded="false"
                >
                  {item.question}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 ml-4 transition-transform" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className="px-4 pb-4 text-ink-soft text-sm hidden">{item.answer}</div>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Related Stores */}
      {store.related_stores && store.related_stores.length > 0 && (
        <section>
          <h2 className="font-serif text-xl text-ink mb-4">Related Stores</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {store.related_stores.map((related) => (
              <Link
                key={related.id}
                href={`/stores/${related.slug}`}
                className="border border-ledger-line bg-paper-raised p-4 text-center transition-colors hover:border-inkblue hover:text-inkblue"
              >
                {related.logo_url ? (
                  <Image
                    src={related.logo_url}
                    alt={related.name}
                    width={60}
                    height={60}
                    className="mx-auto mb-2 rounded-full border border-ledger-line object-contain bg-paper-raised"
                  />
                ) : (
                  <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-xl text-ink-soft">
                    {related.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="font-medium text-sm text-ink">{related.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}