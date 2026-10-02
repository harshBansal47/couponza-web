"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDiscount, successRateLabel } from "@/lib/format";
import type { CouponPublic, Store } from "@/lib/types";

export type CouponCardVariant = "coupon" | "price-drop" | "free-shipping" | "expiring-soon" | "featured";

interface BaseCouponCardProps {
  coupon: CouponPublic;
  store?: Pick<Store, "name" | "logo_url" | "slug">;
  variant?: CouponCardVariant;
  className?: string;
  onTrack?: (couponId: string) => void;
  onSave?: (couponId: string) => void;
}

interface PriceDropProps {
  previousPrice: number;
  currentPrice: number;
  productName: string;
  productSlug: string;
  productImage?: string;
}

interface FreeShippingProps {
  minOrderValue?: number;
  regions?: string[];
}

interface ExpiringSoonProps {
  expiresAt: string;
}

interface FeaturedProps {
  badge?: string;
  ctaText?: string;
}

export function CouponCard({
  coupon,
  store,
  variant = "coupon",
  className = "",
  onTrack,
  onSave,
  ...extraProps
}: BaseCouponCardProps & Partial<PriceDropProps & FreeShippingProps & ExpiringSoonProps & FeaturedProps>) {
  const rate = successRateLabel(coupon);
  const totalReports = coupon.success_count + coupon.fail_count;
  const isVerified = totalReports > 0;

  const variantConfig = {
    coupon: { badge: "Coupon", badgeClass: "bg-verified/10 text-verified" },
    "price-drop": { badge: "Price Drop", badgeClass: "bg-rust/10 text-rust" },
    "free-shipping": { badge: "Free Shipping", badgeClass: "bg-inkblue/10 text-inkblue" },
    "expiring-soon": { badge: "Expiring Soon", badgeClass: "bg-[var(--color-rust)]/10 text-rust" },
    featured: { badge: "Featured", badgeClass: "bg-ink/10 text-ink" },
  }[variant];

  const discountText = formatDiscount(coupon);

  // Shared store markup
  const storeMarkup = store ? (
    <Link href={`/stores/${store.slug}`} className="shrink-0" aria-label={store.name}>
      {store.logo_url ? (
        <Image
          src={store.logo_url}
          alt={`${store.name} logo`}
          width={40}
          height={40}
          className="rounded-full border border-ledger-line object-contain bg-paper-raised"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper-raised font-serif text-base text-ink-soft">
          {store.name.charAt(0).toUpperCase()}
        </div>
      )}
    </Link>
  ) : null;

  // Variant-specific content
  const variantContent = (() => {
    switch (variant) {
      case "price-drop": {
        const { previousPrice, currentPrice, productName, productSlug, productImage } = extraProps as PriceDropProps;
        const dropAmount = previousPrice - currentPrice;
        const dropPercent = Math.round((dropAmount / previousPrice) * 100);
        return (
          <div className="mt-3 p-3 bg-rust-soft rounded-sm border border-rust/20">
            <p className="font-mono text-sm text-rust">{productName}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-lg text-rust line-through">₹{previousPrice.toLocaleString("en-IN")}</span>
              <span className="font-mono text-xl font-bold text-rust">₹{currentPrice.toLocaleString("en-IN")}</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-rust text-paper rounded-sm">
                -{dropPercent}%
              </span>
            </div>
            {productImage && (
              <Image
                src={productImage}
                alt={productName}
                width={200}
                height={150}
                className="mt-2 rounded-sm object-cover w-full h-32"
              />
            )}
          </div>
        );
      }
      case "free-shipping": {
        const { minOrderValue, regions } = extraProps as FreeShippingProps;
        return (
          <div className="mt-3 p-3 bg-inkblue/5 rounded-sm border border-inkblue/20">
            <p className="font-medium text-inkblue flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Free Shipping
            </p>
            {minOrderValue && (
              <p className="mt-1 text-sm text-ink-soft">On orders over ₹{minOrderValue.toLocaleString("en-IN")}</p>
            )}
            {regions && regions.length > 0 && (
              <p className="mt-1 text-sm text-ink-soft">{regions.join(", ")}</p>
            )}
          </div>
        );
      }
      case "expiring-soon": {
        const { expiresAt } = extraProps as ExpiringSoonProps;
        const expiryDate = new Date(expiresAt);
        const now = new Date();
        const diffMs = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        const timeLeft = diffDays > 0 ? `${diffDays}d` : `${diffHours}h`;
        return (
          <div className="mt-3 p-3 bg-rust-soft rounded-sm border border-rust/20">
            <div className="flex items-center justify-between">
              <p className="font-medium text-rust flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Expires in {timeLeft}
              </p>
              <span className="px-2 py-1 text-xs font-mono bg-rust text-paper rounded-sm animate-pulse">
                {diffDays <= 1 ? "URGENT" : "SOON"}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">Ends {expiryDate.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}</p>
          </div>
        );
      }
      case "featured": {
        const { badge, ctaText } = extraProps as FeaturedProps;
        return (
          <div className="mt-3 p-3 bg-ink/5 rounded-sm border border-ink/10">
            {badge && <span className="inline-block px-2 py-0.5 text-xs font-medium bg-ink/10 text-ink rounded-sm mb-2">{badge}</span>}
            <p className="font-medium text-ink">{coupon.description || "Featured deal from our editors"}</p>
            {ctaText && (
              <button
                type="button"
                onClick={() => onTrack?.(coupon.id)}
                className="mt-2 btn-primary text-sm"
              >
                {ctaText}
              </button>
            )}
          </div>
        );
      }
      default: {
        // Standard coupon variant
        return (
          <>
            {coupon.code && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-paper-raised border border-ledger-line rounded-sm font-mono text-sm text-ink">
                <span className="px-1.5 bg-ink/5 rounded">{coupon.code}</span>
                <span className="text-ink-soft">Copy</span>
              </div>
            )}
            {!coupon.code && (
              <p className="mt-2 text-sm text-ink-soft">No code needed — discount applies at checkout</p>
            )}
          </>
        );
      }
    }
  })();

  return (
    <article
      className={`flex flex-col gap-4 rounded-md border border-ledger-line bg-paper-raised p-4 transition-all duration-200 hover:border-inkblue/50 hover:shadow-[var(--shadow-raised)] ${className}`}
    >
      <div className="flex items-start gap-3">
        {storeMarkup}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm ${variantConfig.badgeClass}`}>
              {variantConfig.badge}
            </span>
            {isVerified && (
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm bg-verified/10 text-verified">
                {Math.round((coupon.success_rate ?? 0) * 100)}% verified
              </span>
            )}
            {coupon.expires_at && (
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm bg-rust/10 text-rust">
                Ends soon
              </span>
            )}
          </div>
          <h3 className="mt-2 font-serif text-lg text-ink line-clamp-2">{coupon.title}</h3>
          <p className="mt-1 font-mono text-base text-ink">{discountText}</p>
        </div>
      </div>

      {variantContent}

      <div className="flex items-center justify-between pt-2 border-t border-ledger-line">
        <div className="flex items-center gap-2">
          {isVerified && (
            <button
              type="button"
              className="btn-ghost text-xs px-2 py-1"
              onClick={() => onTrack?.(coupon.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{totalReports} report{totalReports !== 1 ? "s" : ""}</span>
            </button>
          )}
          {coupon.expires_at && (
            <span className="text-xs text-ink-soft font-mono">
              Expires {(coupon.expires_at as string).split("T")[0]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSave?.(coupon.id)}
            className="btn-ghost p-2"
            aria-label="Save coupon"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <Link
            href={`/coupons/${coupon.slug}`}
            className="btn-primary text-sm"
          >
            View Deal
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Grid layout for multiple cards */
export function CouponCardGrid({
  coupons,
  stores = [],
  variant = "coupon",
  columns = { base: 1, sm: 2, lg: 3 },
  className = "",
  onTrack,
  onSave,
}: {
  coupons: CouponPublic[];
  stores?: Pick<Store, "name" | "logo_url" | "slug">[];
  variant?: CouponCardVariant;
  columns?: { base?: number; sm?: number; lg?: number };
  className?: string;
  onTrack?: (couponId: string) => void;
  onSave?: (couponId: string) => void;
}) {
  const storeById = new Map(stores.map((s) => [s.slug, s]));

  const colClasses = [];
  if (columns.base) colClasses.push(`grid-cols-${columns.base}`);
  if (columns.sm) colClasses.push(`sm:grid-cols-${columns.sm}`);
  if (columns.lg) colClasses.push(`lg:grid-cols-${columns.lg}`);

  return (
    <div className={`grid gap-4 ${colClasses.join(" ")} ${className}`}>
      {coupons.map((coupon) => {
        const store = storeById.get(coupon.store_id);
        return (
          <CouponCard
            key={coupon.id}
            coupon={coupon}
            store={store ? { name: store.name, logo_url: store.logo_url, slug: store.slug } : undefined}
            variant={variant}
            onTrack={onTrack}
            onSave={onSave}
          />
        );
      })}
    </div>
  );
}

/** Carousel/slider for featured cards */
export function CouponCardCarousel({
  coupons,
  stores = [],
  variant = "featured",
  className = "",
  onTrack,
  onSave,
}: {
  coupons: CouponPublic[];
  stores?: Pick<Store, "name" | "logo_url" | "slug">[];
  variant?: CouponCardVariant;
  className?: string;
  onTrack?: (couponId: string) => void;
  onSave?: (couponId: string) => void;
}) {
  const storeById = new Map(stores.map((s) => [s.slug, s]));
  const [scrollX, setScrollX] = useState(0);

  // Note: In a real implementation, you'd add scroll buttons and touch handling
  // This is a simplified version

  return (
    <div className={`overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide ${className}`}>
      <div className="flex gap-4 min-w-max">
        {coupons.map((coupon) => {
          const store = storeById.get(coupon.store_id);
          return (
            <div key={coupon.id} className="w-80 sm:w-96 flex-shrink-0">
              <CouponCard
                coupon={coupon}
                store={store ? { name: store.name, logo_url: store.logo_url, slug: store.slug } : undefined}
                variant={variant}
                onTrack={onTrack}
                onSave={onSave}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}