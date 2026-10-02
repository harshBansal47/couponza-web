import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import CouponCodePanel from "@/components/CouponCodePanel";
import VerifyWidget from "@/components/VerifyWidget";
import DisclosureNote from "@/components/DisclosureNote";
import { formatDiscount } from "@/lib/format";
import { absoluteUrl, aggregateRatingJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import type { CouponPublic, Store } from "@/lib/types";

async function loadCoupon(slug: string): Promise<CouponPublic | null> {
  try {
    return await api.getCouponBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
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

  let store: Store | null = null;
  try {
    store = await api.getStoreById(coupon.store_id);
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 404)) throw err;
  }

  // schema.org structured data: this is what makes the page legible to AI
  // shopping agents and search engines as verifiable data to cite, rather
  // than text they'd otherwise have to scrape and guess at. AggregateRating
  // is the differentiated part — it's real, disclosed community feedback,
  // which most coupon aggregators simply don't have to offer.
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {store && (
        <Link href={`/stores/${store.slug}`} className="text-sm text-ink-soft hover:text-ink">
          {store.name}
        </Link>
      )}
      <h1 className="mt-1 font-serif text-3xl text-ink">{coupon.title}</h1>
      <p className="mt-2 font-mono text-sm text-ink-soft">{formatDiscount(coupon)}</p>

      <div className="mt-6">
        <CouponCodePanel coupon={coupon} />
      </div>

      <div className="mt-6">
        <VerifyWidget coupon={coupon} />
      </div>

      {coupon.description && (
        <p className="mt-6 leading-relaxed text-ink-soft">{coupon.description}</p>
      )}

      <div className="mt-6">
        <DisclosureNote commissionDisclosure={store?.commission_disclosure} />
      </div>
    </div>
  );
}
