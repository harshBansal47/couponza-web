import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import type { CouponPublic } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * A coupon with many recent, mostly-positive reports is more likely to still
 * be valid than one with none — so it's worth a crawler's attention sooner.
 * Unverified coupons still get a reasonable baseline priority; this nudges,
 * it doesn't bury them.
 */
function couponPriority(coupon: CouponPublic): number {
  const total = coupon.success_count + coupon.fail_count;
  if (total === 0) return 0.6;
  const confidence = Math.min(total / 10, 1); // more reports = more confidence, caps at 10
  const quality = coupon.success_rate ?? 0;
  return Math.round((0.6 + confidence * quality * 0.3) * 100) / 100; // 0.6 - 0.9
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [coupons, stores, categories] = await Promise.all([
    api.listCoupons({ limit: 100 }),
    api.listStores({ limit: 100 }),
    api.listCategories(),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/trust`, changeFrequency: "monthly", priority: 0.5 },
    ...coupons.items.map((coupon) => ({
      url: `${SITE_URL}/coupons/${coupon.slug}`,
      lastModified: coupon.last_verified_at ?? coupon.created_at,
      changeFrequency: "daily" as const,
      priority: couponPriority(coupon),
    })),
    ...stores.items.map((store) => ({
      url: `${SITE_URL}/stores/${store.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...categories.items.map((category) => ({
      url: `${SITE_URL}/categories/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
