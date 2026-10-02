import type {
  CmsPage,
  Category,
  CouponPublic,
  Paginated,
  PricePoint,
  Product,
  Store,
  VerifyResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const { revalidate, ...rest } = init ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    // Server Components: cache briefly so a busy listing page doesn't hammer
    // the API on every request, but stay close to real-time for verify counts.
    next: revalidate !== undefined ? { revalidate } : undefined,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(body || res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export interface CouponListParams {
  store_id?: string;
  category_id?: string;
  search?: string;
  active_only?: boolean;
  skip?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export const api = {
  listCoupons: (params: CouponListParams = {}) =>
    apiFetch<Paginated<CouponPublic>>(`/coupons${qs(params)}`, { revalidate: 30 }),

  getCouponBySlug: (slug: string) =>
    apiFetch<CouponPublic>(`/coupons/by-slug/${encodeURIComponent(slug)}`, { revalidate: 30 }),

  verifyCoupon: (couponId: string, worked: boolean) =>
    apiFetch<VerifyResponse>(`/coupons/${couponId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worked }),
      cache: "no-store",
    }),

  goUrl: (couponId: string) => `${API_URL}/coupons/${couponId}/go`,

  listStores: (params: { search?: string; skip?: number; limit?: number } = {}) =>
    apiFetch<Paginated<Store>>(`/stores${qs(params)}`, { revalidate: 300 }),

  getStoreById: (storeId: string) => apiFetch<Store>(`/stores/${storeId}`, { revalidate: 300 }),

  getStoreBySlug: (slug: string) =>
    apiFetch<Store>(`/stores/by-slug/${encodeURIComponent(slug)}`, { revalidate: 300 }),

  listCategories: (params: { parent_id?: string; limit?: number; skip?: number } = {}) =>
    apiFetch<Paginated<Category>>(`/categories${qs(params)}`, { revalidate: 300 }),

  getCategoryBySlug: (slug: string) =>
    apiFetch<Category>(`/categories/by-slug/${encodeURIComponent(slug)}`, { revalidate: 300 }),

  getPageBySlug: (slug: string) =>
    apiFetch<CmsPage>(`/pages/by-slug/${encodeURIComponent(slug)}`, { revalidate: 300 }),

  listProducts: (params: { search?: string; store_id?: string; category_id?: string; skip?: number; limit?: number } = {}) =>
    apiFetch<Paginated<Product>>(`/products${qs(params)}`, { revalidate: 60 }),

  getProductBySlug: (slug: string) =>
    apiFetch<Product>(`/products/by-slug/${encodeURIComponent(slug)}`, { revalidate: 60 }),

  getPriceHistory: (productId: string) =>
    apiFetch<PricePoint[]>(`/products/${productId}/price-history`, { revalidate: 60 }),
};
