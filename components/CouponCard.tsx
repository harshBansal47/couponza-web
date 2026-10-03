import Image from "next/image";
import Link from "next/link";
import { daysUntil, expiryLabel, formatDiscount, formatMoney, successRateLabel, totalReports } from "@/lib/format";
import type { CouponPublic } from "@/lib/types";

export type CouponCardVariant = "coupon" | "price-drop" | "free-shipping" | "expiring-soon" | "featured";

/** The minimum a card needs to link to a store. */
export interface CouponCardStore {
  /** Must match `CouponPublic.store_id` so a grid can resolve the pair. */
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  /** ISO 4217 code — the store's local currency, so prices render correctly per market. */
  currency?: string | null;
}

interface CouponCardProps {
  coupon: CouponPublic;
  store?: CouponCardStore;
  variant?: CouponCardVariant;
  /** Price-context for the price-drop variant. */
  price?: { previous: number; current: number; productName?: string; productSlug?: string; currency?: string };
  /** Minimum order value for the free-shipping variant. */
  minOrderValue?: number;
  /** Where this code is valid — drives the "region" line instead of guessing. */
  regions?: string[];
  badge?: string;
  /** Overrides the card's main CTA. */
  ctaHref?: string;
  ctaLabel?: string;
  /** Hide the "ends soon" strip (used when the coupon is evergreen). */
  hideExpiry?: boolean;
  className?: string;
  /** Announce visually, render as a link. Used for "Verify this code worked" links. */
  footnote?: { label: string; href: string };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

function StoreBadge({ store }: { store: CouponCardStore }) {
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="flex min-w-0 shrink items-center gap-2 text-sm font-semibold text-white/95 transition-opacity hover:opacity-80"
    >
      {store.logo_url ? (
        <Image
          src={store.logo_url}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-full border-2 border-white/70 bg-white object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/70 bg-white font-mono text-[10px] font-semibold text-inkblue"
        >
          {initials(store.name)}
        </span>
      )}
      <span className="max-w-[16ch] truncate">{store.name}</span>
    </Link>
  );
}

function VerifiedStamp({ coupon }: { coupon: CouponPublic }) {
  const rate = successRateLabel(coupon);
  const reports = totalReports(coupon);
  // Two reports minimum: one "worked" click is not evidence.
  if (!rate || reports < 2) return null;
  return (
    <span
      title={`Worked for ${coupon.success_count} of ${reports} people who tried it`}
      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-verified shadow-sm"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {rate}
    </span>
  );
}

/**
 * The single coupon/deal card used everywhere. Variants differ only in the
 * evidence strip underneath the title — the overall shape stays identical so
 * a grid of mixed deal types still reads as one system.
 */
export function CouponCard({
  coupon,
  store,
  variant = "coupon",
  price,
  minOrderValue,
  regions,
  badge,
  ctaHref,
  ctaLabel,
  hideExpiry = false,
  className = "",
  footnote,
}: CouponCardProps) {
  const currency = store?.currency ?? price?.currency ?? "USD";
  const daysLeft = daysUntil(coupon.expires_at);
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const expired = daysLeft !== null && daysLeft < 0;

  // Variant is a hint about how to present it; an expired coupon always wins,
  // because sending someone to a dead code is worse than a mislabelled card.
  const resolved: CouponCardVariant = expired ? "expiring-soon" : variant;

  const href = ctaHref ?? `/coupons/${coupon.slug}`;

  const band =
    expired
      ? "bg-gradient-to-br from-slate-400 to-slate-500"
      : resolved === "price-drop"
        ? "bg-brand-warm"
        : resolved === "free-shipping"
          ? "bg-gradient-to-br from-sky-500 to-indigo-600"
          : resolved === "featured"
            ? "bg-brand-warm"
            : "bg-brand";

  const pill =
    "rounded-full bg-white/95 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider";

  return (
    <div
      className={[
        "ticket-wrap h-full",
        expired ? "opacity-70" : "",
        className,
      ].join(" ")}
    >
      <article className="ticket flex h-full flex-col overflow-hidden rounded-[20px] border border-ledger-line bg-paper-raised">
        <header className={`${band} relative flex h-24 flex-col justify-between overflow-hidden px-4 pb-2.5 pt-3 text-white`}>
          <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            {store ? <StoreBadge store={store} /> : <span />}
            <div className="flex items-center gap-1.5">
              {badge && <span className={`${pill} text-ink`}>{badge}</span>}
              {resolved === "price-drop" && <span className={`${pill} text-rust`}>Price drop</span>}
              {resolved === "free-shipping" && <span className={`${pill} text-inkblue`}>Free shipping</span>}
              {resolved === "expiring-soon" && !expired && (
                <span className={`${pill} text-rust`}>
                  Ends {daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft}d`}
                </span>
              )}
              {expired && <span className={`${pill} text-ink-soft`}>Expired</span>}
              {!expired && <VerifiedStamp coupon={coupon} />}
            </div>
          </div>
          <p
            aria-hidden="true"
            className="relative font-serif text-[1.7rem] font-extrabold leading-none tracking-tight drop-shadow-sm"
          >
            {resolved === "price-drop" ? "Price ↓" : resolved === "free-shipping" ? "Free ship" : formatDiscount(coupon, currency)}
          </p>
        </header>

        <div className="flex flex-1 flex-col gap-3 border-t-2 border-dashed border-ledger-line p-4">
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-bold leading-snug text-ink">
              <Link href={href} className="after:absolute after:inset-0 hover:text-inkblue">
                {coupon.title}
              </Link>
            </h3>
            {coupon.description && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{coupon.description}</p>}
          </div>

          {resolved === "price-drop" && price && (
            <div className="rounded-xl border border-rust/20 bg-rust-soft p-3">
              {price.productName && <p className="text-sm font-medium text-ink">{price.productName}</p>}
              <p className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-sm text-ink-soft line-through">
                  {formatMoney(price.previous, currency)}
                </span>
                <span className="font-mono text-lg font-semibold text-rust">{formatMoney(price.current, currency)}</span>
                {price.previous > 0 && (
                  <span className="rounded-full bg-rust px-2 py-0.5 font-mono text-xs font-semibold text-white">
                    −{Math.round(((price.previous - price.current) / price.previous) * 100)}%
                  </span>
                )}
              </p>
            </div>
          )}

          {resolved === "free-shipping" && (
            <div className="rounded-xl border border-inkblue/20 bg-inkblue/5 p-3 text-sm text-ink-soft">
              <p className="font-semibold text-inkblue">
                {minOrderValue ? `Free shipping over ${formatMoney(minOrderValue, currency)}` : "Free shipping"}
              </p>
              {regions && regions.length > 0 && <p className="mt-0.5">{regions.join(" · ")}</p>}
            </div>
          )}

          {resolved !== "price-drop" && resolved !== "free-shipping" && resolved !== "expiring-soon" && (
            <p className="text-sm text-ink-soft">
              {coupon.code ? (
                <>
                  Code{" "}
                  <code className="break-anywhere rounded-lg border border-dashed border-inkblue/40 bg-inkblue/5 px-2 py-0.5 font-mono text-sm font-semibold text-inkblue">
                    {coupon.code}
                  </code>{" "}
                  at checkout
                </>
              ) : (
                "No code needed — the discount is already applied"
              )}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
            <div>
              {coupon.code && <span className="font-mono">{coupon.code}</span>}
              {!hideExpiry && expiryLabel(coupon.expires_at) && (
                <span className={expiringSoon ? "font-semibold text-rust" : undefined}>
                  {coupon.code ? " · " : ""}
                  {expiryLabel(coupon.expires_at)}
                </span>
              )}
            </div>
            {footnote && (
              <Link
                href={footnote.href}
                className="relative z-10 text-xs font-medium text-inkblue underline-offset-2 hover:underline"
              >
                {footnote.label}
              </Link>
            )}
          </div>

          <Link
            href={href}
            aria-disabled={expired}
            className={[
              "btn relative z-10 justify-center",
              expired ? "pointer-events-none border border-ledger-line bg-transparent text-ink-soft" : "btn-cta",
            ].join(" ")}
          >
            {ctaLabel ?? (expired ? "No longer valid" : "See the deal")}
          </Link>
        </div>
      </article>
    </div>
  );
}

const DEFAULT_GRID = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Grid of cards. The layout is a plain class string rather than a
 * `columns={{ sm: 2 }}` prop — Tailwind scans source text for class names, so
 * anything built by interpolation would never be generated.
 */
export function CouponCardGrid({
  coupons,
  stores = [],
  variant = "coupon",
  className = DEFAULT_GRID,
  price,
  ...cardProps
}: {
  coupons: CouponPublic[];
  stores?: CouponCardStore[];
  variant?: CouponCardVariant;
  /** Grid-template-columns classes, e.g. "grid-cols-1 sm:grid-cols-2". */
  className?: string;
  price?: CouponCardProps["price"];
} & Omit<CouponCardProps, "coupon" | "store" | "variant" | "price">) {
  const storeById = new Map(stores.map((s) => [s.id, s]));

  if (coupons.length === 0) return null;

  return (
    <div className={`grid gap-4 ${className}`}>
      {coupons.map((coupon) => (
        <CouponCard
          key={coupon.id}
          coupon={coupon}
          store={storeById.get(coupon.store_id)}
          variant={variant}
          price={price}
          {...cardProps}
        />
      ))}
    </div>
  );
}

export default CouponCard;