import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import TrackProductDialog from "@/components/account/TrackProductDialog";
import { trackProductAction } from "@/app/account/actions";
import { api, resilient } from "@/lib/api";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { getAccessToken, getSessionUser } from "@/lib/session";
import { absoluteUrl } from "@/lib/seo";
import PriceHistory from "@/components/product/PriceHistory";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await resilient.getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: `${product.name} price history`,
    description: `Current price and price history for ${product.name}, with the option to be alerted when it drops.`,
    alternates: { canonical: absoluteUrl(`/products/${product.slug}`) },
    openGraph: {
      title: `${product.name} — ${product.current_price !== null ? formatMoney(product.current_price, product.currency) : "price unknown"}`,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await resilient.getProductBySlug(slug);
  if (!product) notFound();

  const [store, history, user] = await Promise.all([
    resilient.getStoreById(product.store_id),
    resilient.getPriceHistory(product.id),
    getSessionUser(),
  ]);

  // Only signed-in visitors can be tracking something, and a failed read should
  // not block the page — fall back to "not tracked" rather than an error state.
  const token = user ? await getAccessToken() : null;
  const trackedRow = token
    ? ((await api.listTrackedProducts(token).catch(() => []))
        .find((row) => row.product_id === product.id) ?? null)
    : null;

  // A product with a URL is the only case where we can link out; without one the
  // page is still useful (price history, tracking) so it renders without a CTA.
  const dropPct =
    product.last_price_drop_at !== null && product.last_price_drop_pct !== null
      ? product.last_price_drop_pct
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image_url ?? undefined,
    offers: {
      "@type": "Offer",
      price: product.effective_price ?? product.current_price ?? undefined,
      priceCurrency: product.currency,
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: product.url ?? absoluteUrl(`/products/${product.slug}`),
    },
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-ink-soft">
        <Link href="/search" className="hover:text-ink hover:underline">
          Search
        </Link>
        {store && (
          <>
            {" / "}
            <Link href={`/stores/${store.slug}`} className="hover:text-ink hover:underline">
              {store.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={600}
              height={600}
              className="w-full border border-ledger-line bg-paper object-contain"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center border border-dashed border-ledger-line text-sm text-ink-soft">
              No product image
            </div>
          )}
        </div>

        <div>
          <h1 className="font-serif text-3xl leading-tight text-ink">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-3xl text-ink">
              {product.current_price !== null
                ? formatMoney(product.current_price, product.currency)
                : "Price unknown"}
            </span>
            {product.list_price !== null && product.list_price > (product.current_price ?? 0) && (
              <span className="font-mono text-lg text-ink-soft line-through">
                {formatMoney(product.list_price, product.currency)}
              </span>
            )}
            {dropPct !== null && (
              <span className="rounded-sm border border-rust/30 bg-rust-soft px-2 py-0.5 font-mono text-xs text-rust">
                {dropPct.toFixed(0)}% lower
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-ink-soft">
            {product.in_stock
              ? "In stock at last capture"
              : "Out of stock at last capture"}
            {product.last_captured_at && ` · captured ${formatRelativeTime(product.last_captured_at)}`}
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-ledger-line py-4 text-sm">
            {(
              [
                ["7-day low", product.lowest_price_7d],
                ["30-day low", product.lowest_price_30d],
                ["90-day low", product.lowest_price_90d],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wider text-ink-soft">{label}</dt>
                <dd className="mt-1 font-mono text-ink">
                  {value !== null ? formatMoney(value, product.currency) : "—"}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="btn-primary"
              >
                View at {store?.name ?? "the store"}
              </a>
            )}
            <TrackProductDialog
              product={{
                id: product.id,
                name: product.name,
                currency: product.currency,
                current_price: product.current_price,
                lowest_price_30d: product.lowest_price_30d,
              }}
              action={trackProductAction}
              isSignedIn={Boolean(user)}
              loginHref={`/account/login?next=${encodeURIComponent(`/products/${product.slug}`)}`}
              size="md"
              triggerLabel={trackedRow ? "Edit tracking" : "Track this"}
            />
            {trackedRow && (
              <Link href="/account/products" className="text-sm text-inkblue hover:underline">
                Manage tracked products
              </Link>
            )}
          </div>

          {!user && (
            <p className="mt-3 text-xs text-ink-soft">
              Tracking needs an account so we know where to send the alert.{" "}
              <Link
                href={`/account/register?next=${encodeURIComponent(`/products/${product.slug}`)}`}
                className="text-inkblue hover:underline"
              >
                Create one free
              </Link>
              .
            </p>
          )}

          {store && (
            <p className="mt-6 border border-ledger-line bg-paper-raised p-4 text-sm text-ink-soft">
              We may earn a commission if you buy through this link. It does not change the price,
              and it does not affect which products or deals we show.{" "}
              <Link href={`/stores/${store.slug}`} className="text-inkblue hover:underline">
                Everything about {store.name}
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      <section className="mt-14">
        <h2 className="font-serif text-xl text-ink">Price history</h2>
        <PriceHistory points={history} currency={product.currency} />
      </section>
    </main>
  );
}