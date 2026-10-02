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
  created_at: string;
}

export type DiscountType = "percentage" | "fixed" | "deal";

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
