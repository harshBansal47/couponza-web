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
      className="flex shrink-0 items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      {store.logo_url ? (
        <Image
          src={store.logo_url}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-full border border-ledger-line bg-paper object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-ledger-line bg-paper font-mono text-[10px] text-ink-soft"
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
      className="inline-flex items-center gap-1 rounded-sm border border-verified/30 bg-verified-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-verified"
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

  return (
    <article
      className={[
        "flex flex-col gap-3 border border-ledger-line bg-paper-raised p-4 transition-colors",
        expired ? "opacity-70" : "hover:border-inkblue/50",
        className,
      ].join(" ")}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        {store ? <StoreBadge store={store} /> : <span />}
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="rounded-sm border border-ink/20 bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink">
              {badge}
            </span>
          )}
          {resolved === "price-drop" && (
            <span className="rounded-sm border border-rust/30 bg-rust-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rust">
              Price drop
            </span>
          )}
          {resolved === "free-shipping" && (
            <span className="rounded-sm border border-inkblue/30 bg-inkblue/5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-inkblue">
              Free shipping
            </span>
          )}
          {resolved === "expiring-soon" && !expired && (
            <span className="rounded-sm border border-rust/30 bg-rust-soft px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rust">
              Ends {daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft}d`}
            </span>
          )}
          {expired && (
            <span className="rounded-sm border border-ledger-line bg-ledger-line/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
              Expired
            </span>
          )}
          {!expired && <VerifiedStamp coupon={coupon} />}
        </div>
      </header>

      <div className="min-w-0">
        <h3 className="font-serif text-lg leading-snug text-ink">
          <Link href={href} className="hover:underline">
            {coupon.title}
          </Link>
        </h3>
        {coupon.description && <p className="mt-1 text-sm text-ink-soft">{coupon.description}</p>}
      </div>

      {resolved === "price-drop" && price && (
        <div className="border border-rust/20 bg-rust-soft/60 p-3">
          {price.productName && <p className="text-sm text-ink">{price.productName}</p>}
          <p className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-sm text-ink-soft line-through">
              {formatMoney(price.previous, currency)}
            </span>
            <span className="font-mono text-lg text-rust">{formatMoney(price.current, currency)}</span>
            {price.previous > 0 && (
              <span className="font-mono text-xs text-rust">
                −{Math.round(((price.previous - price.current) / price.previous) * 100)}%
              </span>
            )}
          </p>
        </div>
      )}

      {resolved === "free-shipping" && (
        <div className="border border-inkblue/20 bg-inkblue/5 p-3 text-sm text-ink-soft">
          <p className="font-medium text-inkblue">
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
              <code className="break-anywhere border border-ledger-line bg-paper px-1.5 py-0.5 font-mono text-sm text-ink">
                {coupon.code}
              </code>{" "}
              at checkout
            </>
          ) : (
            "No code needed — the discount is already applied"
          )}
        </p>
      )}

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-ledger-line pt-3">
        <div className="text-xs text-ink-soft">
          {coupon.code && <span className="font-mono">{coupon.code}</span>}
          {!coupon.code && <span>{formatDiscount(coupon, currency)}</span>}
          {!hideExpiry && expiryLabel(coupon.expires_at) && (
            <span className={expiringSoon ? "text-rust" : undefined}> · {expiryLabel(coupon.expires_at)}</span>
          )}
        </div>
        {footnote && (
          <Link href={footnote.href} className="text-xs text-inkblue underline-offset-2 hover:underline">
            {footnote.label}
          </Link>
        )}
      </footer>

      <Link
        href={href}
        aria-disabled={expired}
        className={[
          "btn justify-center",
          expired ? "pointer-events-none border border-ledger-line bg-transparent text-ink-soft" : "btn-primary",
        ].join(" ")}
      >
        {ctaLabel ?? (expired ? "No longer valid" : "See the deal")}
      </Link>
    </article>
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