import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import CouponCodePanel from "@/components/CouponCodePanel";
import VerifyWidget from "@/components/VerifyWidget";
import DisclosureNote from "@/components/DisclosureNote";
import { formatDiscount, formatRelativeTime } from "@/lib/format";
import { absoluteUrl, aggregateRatingJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import type { CouponPublic, Store } from "@/lib/types";
import Image from "next/image";

async function loadCoupon(slug: string): Promise<CouponPublic | null> {
  try {
    return await api.getCouponBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function loadStore(storeId: string): Promise<Store | null> {
  try {
    return await api.getStoreById(storeId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function loadRelatedCoupons(couponId: string, storeId: string): Promise<CouponPublic[]> {
  try {
    const res = await api.listCoupons({ store_id: storeId, limit: 10 });
    return res.items.filter((c) => c.id !== couponId).slice(0, 4);
  } catch {
    return [];
  }
}

async function loadVerificationHistory(couponId: string) {
  try {
    return await api.getCouponVerificationHistory(couponId);
  } catch {
    return [];
  }
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const coupon = await loadCoupon(slug);
  if (!coupon) return {};

  const title = coupon.title;
  const description =
    coupon.description ?? `${formatDiscount(coupon)}, verified by the Couponza community.`;
  const canonical = absoluteUrl(`/coupons/${coupon.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { title, description },
  };
}

export default async function CouponDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const coupon = await loadCoupon(slug);
  if (!coupon) notFound();

  const [store, relatedCoupons, verificationHistory] = await Promise.all([
    loadStore(coupon.store_id),
    loadRelatedCoupons(coupon.id, coupon.store_id),
    loadVerificationHistory(coupon.id),
  ]);

  // schema.org structured data
  const rating = aggregateRatingJsonLd(coupon.success_count, coupon.fail_count);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: coupon.title,
    description: coupon.description ?? undefined,
    url: absoluteUrl(`/coupons/${coupon.slug}`),
    availability: coupon.is_active ? "https://schema.org/InStock" : "https://schema.org/Discontinued",
    ...(coupon.expires_at ? { validThrough: coupon.expires_at } : {}),
    ...(store
      ? { seller: { "@type": "Organization", name: store.name, url: store.website_url ?? undefined } }
      : {}),
    ...(coupon.code ? { discountCode: coupon.code } : {}),
    ...(rating ? { aggregateRating: rating } : {}),
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    ...(store ? [{ name: store.name, path: `/stores/${store.slug}` }] : []),
    { name: coupon.title, path: `/coupons/${coupon.slug}` },
  ]);

  const totalReports = coupon.success_count + coupon.fail_count;
  const successRate = coupon.success_rate !== null ? Math.round(coupon.success_rate * 100) : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Store link */}
      {store && (
        <Link href={`/stores/${store.slug}`} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-4">
          {store.logo_url ? (
            <Image src={store.logo_url} alt="" width={20} height={20} className="rounded-full border border-ledger-line" />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-xs text-ink-soft">
              {store.name.charAt(0).toUpperCase()}
            </span>
          )}
          {store.name}
        </Link>
      )}

      <header className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-ink">{coupon.title}</h1>
        <p className="mt-2 font-mono text-lg text-ink">{formatDiscount(coupon)}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {coupon.expires_at && (
            <span className="px-3 py-1 bg-rust/10 text-rust text-sm font-mono rounded-sm">
              Expires {(coupon.expires_at as string).split("T")[0]}
            </span>
          )}
          {successRate !== null && (
            <span className="px-3 py-1 bg-verified/10 text-verified text-sm font-mono rounded-sm">
              {successRate}% success rate ({totalReports} report{totalReports !== 1 ? "s" : ""})
            </span>
          )}
          {!coupon.is_active && (
            <span className="px-3 py-1 bg-ink/10 text-ink text-sm font-mono rounded-sm">Inactive</span>
          )}
        </div>
      </header>

      {/* Main action panel */}
      <section className="mb-8">
        <CouponCodePanel coupon={coupon} />
      </section>

      {/* Verification status */}
      <section className="mb-8">
        <VerifyWidget coupon={coupon} />
      </section>

      {/* Verification History Timeline */}
      {verificationHistory.length > 0 && (
        <section className="mb-8">
          <h2 className="font-serif text-xl text-ink mb-4">Verification History</h2>
          <dl className="divide-y divide-ledger-line">
            {verificationHistory.map((v, i) => (
              <div key={i} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    v.worked ? "bg-verified/10 text-verified" : "bg-rust/10 text-rust"
                  }`}>
                    {v.worked ? "✓" : "✕"}
                  </span>
                  <div>
                    <p className="text-sm text-ink">{v.worked ? "Worked" : "Didn't work"}</p>
                    <p className="text-xs text-ink-soft font-mono">{formatRelativeTime(v.created_at)}</p>
                  </div>
                </div>
                {v.note && <p className="text-sm text-ink-soft sm:w-1/2">{v.note}</p>}
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Description / Restrictions */}
      {coupon.description && (
        <section className="mb-8">
          <h2 className="font-serif text-xl text-ink mb-3">Details & Restrictions</h2>
          <div className="prose prose-ink max-w-none text-sm text-ink-soft leading-relaxed">
            {coupon.description.split("\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* User Reports */}
      {totalReports > 0 && (
        <section className="mb-8">
          <h2 className="font-serif text-xl text-ink mb-4">Community Reports</h2>
          <div className="rounded-md border border-ledger-line overflow-hidden">
            <div className="grid grid-cols-2 border-b border-ledger-line bg-paper-raised">
              <div className="p-4 text-center border-r border-ledger-line">
                <p className="font-serif text-3xl text-verified">{successRate}%</p>
                <p className="text-xs text-ink-soft font-mono uppercase tracking-wider">Success Rate</p>
              </div>
              <div className="p-4 text-center">
                <p className="font-serif text-3xl text-ink">{totalReports}</p>
                <p className="text-xs text-ink-soft font-mono uppercase tracking-wider">Total Reports</p>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-4 h-4 bg-ledger-line rounded-full overflow-hidden">
                <div
                  className="h-full bg-verified rounded-full transition-all duration-500"
                  style={{ width: `${successRate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-ink-soft font-mono">
                <span>Worked: {coupon.success_count}</span>
                <span>Didn't work: {coupon.fail_count}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Store Information */}
      {store && (
        <section className="mb-8">
          <h2 className="font-serif text-xl text-ink mb-4">Store Information</h2>
          <div className="rounded-md border border-ledger-line bg-paper-raised p-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                {store.logo_url ? (
                  <Image src={store.logo_url} alt={store.name} width={60} height={60} className="rounded-full border border-ledger-line object-contain bg-paper-raised" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-2xl text-ink-soft">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg text-ink">{store.name}</h3>
                {store.website_url && (
                  <a href={store.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-inkblue hover:underline mt-1 inline-block">
                    {store.website_url.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {store.description && <p className="mt-2 text-sm text-ink-soft line-clamp-3">{store.description}</p>}
              </div>
            </div>
            {store.commission_disclosure && (
              <div className="mt-4 pt-4 border-t border-ledger-line">
                <p className="font-mono text-xs uppercase tracking-wider text-ink-soft mb-1">Commission Disclosure</p>
                <p className="text-sm text-ink">{store.commission_disclosure}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Commission Disclosure (fallback if no store) */}
      {!store && (
        <section className="mb-8">
          <DisclosureNote commissionDisclosure={null} />
        </section>
      )}

      {/* Related Coupons */}
      {relatedCoupons.length > 0 && (
        <section className="mb-8">
          <h2 className="font-serif text-xl text-ink mb-4">Related Coupons</h2>
          <div className="space-y-3">
            {relatedCoupons.map((c) => (
              <Link key={c.id} href={`/coupons/${c.slug}`} className="block">
                <div className="flex items-center gap-4 p-3 border border-ledger-line rounded-sm hover:border-inkblue hover:bg-paper-raised transition-colors">
                  {store && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-sm text-ink-soft">
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{c.title}</p>
                    <p className="text-sm text-ink-soft font-mono">{formatDiscount(c)}</p>
                  </div>
                  {c.code && (
                    <span className="shrink-0 px-2 py-1 bg-paper border border-ledger-line rounded-sm font-mono text-xs text-ink">
                      {c.code}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Description fallback */}
      {coupon.description && !store && (
        <section className="mb-8">
          <p className="leading-relaxed text-ink-soft">{coupon.description}</p>
        </section>
      )}
    </div>
  );
}