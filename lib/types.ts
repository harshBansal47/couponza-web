// Mirrors the backend's Pydantic schemas exactly (see couponza/app/schemas/*.py).
// Keep these two in sync by hand — there's no shared codegen yet.

export interface Paginated<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  is_active: boolean;
  commission_disclosure: string | null;
  /** ISO 3166-1 alpha-2 market this store belongs to; null for global retailers. */
  country_code: string | null;
  /** ISO 4217 code used to render this store's prices. */
  currency: string | null;
  created_at: string;
}

export type DiscountType = "percentage" | "fixed" | "deal";

/**
 * A product joined with its current price context. The account dashboard needs
 * a tracked product's current price to show "now vs target", which the bare
 * tracked-products endpoint doesn't return.
 */
export interface TrackedProductView extends TrackedProduct {
  product: Product;
}

// The public-safe view — deliberately has no destination_url. See
// couponza/app/schemas/coupon_public.py: the real URL is only ever
// resolved server-side by GET /coupons/{id}/go.
export interface CouponPublic {
  id: string;
  title: string;
  slug: string;
  code: string | null;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number | null;
  store_id: string;
  category_id: string;
  expires_at: string | null;
  is_active: boolean;
  views_count: number;
  clicks_count: number;
  success_count: number;
  fail_count: number;
  last_verified_at: string | null;
  success_rate: number | null;
  created_at: string;
}

export interface VerifyResponse {
  success_count: number;
  fail_count: number;
  last_verified_at: string | null;
  success_rate: number | null;
}

export interface VerificationHistoryItem {
  id: string;
  worked: boolean;
  created_at: string;
  /** Reporter's own words. Backend never returns ip_hash. */
  note: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  store_id: string;
  category_id: string;
  url: string | null;
  image_url: string | null;
  currency: string;
  current_price: number | null;
  list_price: number | null;
  in_stock: boolean;
  last_captured_at: string | null;
  lowest_price_7d: number | null;
  lowest_price_30d: number | null;
  lowest_price_90d: number | null;
  last_price_drop_at: string | null;
  last_price_drop_pct: number | null;
  created_at: string;
  effective_price: number | null;
}

export interface PricePoint {
  id: string;
  product_id: string;
  price: number;
  original_price: number | null;
  shipping: number;
  in_stock: boolean;
  coupon_id: string | null;
  captured_at: string;
}

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
}

// ---- Account: mirrors couponza/app/schemas/{user,tracking}.py ----

export type Role = "user" | "editor" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface SavedItem {
  kind: "store" | "coupon";
  item_id: string;
  saved_id: string;
}

export type AlertKind = "price_drop" | "coupon_appeared" | "target_met";

export interface TrackedProduct {
  id: string;
  product_id: string;
  target_price: number | null;
  created_at: string;
}

export interface NotificationPreference {
  email_enabled: boolean;
  telegram_enabled: boolean;
  telegram_chat_id: string | null;
  push_enabled: boolean;
  push_subscription: Record<string, unknown> | null;
}

export interface AlertEvent {
  id: string;
  kind: AlertKind;
  message: string;
  product_id: string | null;
  coupon_id: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface AutocompleteResult {
  stores: string[];
  categories: string[];
  products: string[];
}
