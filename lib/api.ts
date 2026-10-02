import type {
  AlertEvent,
  AutocompleteResult,
  Category,
  CouponPublic,
  CmsPage,
  NotificationPreference,
  Paginated,
  PricePoint,
  Product,
  PushPublicKey,
  PushState,
  PushSubscriptionPayload,
  SavedItem,
  Store,
  TokenPair,
  TrackedProduct,
  User,
  VerificationHistoryItem,
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

type FetchOptions = RequestInit & {
  /** Next.js data-cache revalidate window, in seconds. Omit to opt out of caching. */
  revalidate?: number;
  /** Bearer token for authenticated endpoints. Server-only in practice. */
  token?: string | null;
};

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate, token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    // Server Components: cache briefly so a busy listing page doesn't hammer
    // the API on every request, but stay close to real-time for verify counts.
    next: revalidate !== undefined ? { revalidate } : undefined,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(extractDetail(body) || res.statusText, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** FastAPI puts the human-readable reason in `detail`, sometimes as a list. */
function extractDetail(body: string): string {
  if (!body) return "";
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object" && "detail" in parsed) {
      const detail = (parsed as { detail: unknown }).detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as { msg?: string };
        return first.msg ?? "Invalid input";
      }
    }
  } catch {
    // Not JSON — fall through to the raw text.
  }
  return body.slice(0, 300);
}

/** Serialises params into a query string, dropping empty values. */
function qs(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
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

export interface StoreListParams {
  search?: string;
  country_code?: string;
  skip?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export const api = {
  // ---- Public catalogue -------------------------------------------------

  listCoupons: (params: CouponListParams = {}) =>
    apiFetch<Paginated<CouponPublic>>(`/coupons${qs(params)}`, { revalidate: 30 }),

  getCouponBySlug: (slug: string) =>
    apiFetch<CouponPublic>(`/coupons/by-slug/${encodeURIComponent(slug)}`, { revalidate: 30 }),

  /** Account pages hold coupon ids (from /me/saved-coupons), not slugs. */
  getCouponById: (couponId: string) =>
    apiFetch<CouponPublic>(`/coupons/${couponId}`, { revalidate: 30 }),

  /** Affiliate URLs are only ever resolved by the server-side /go redirect. */
  goUrl: (couponId: string) => `${API_URL}/coupons/${couponId}/go`,

  verifyCoupon: (couponId: string, worked: boolean, note?: string) =>
    apiFetch<VerifyResponse>(`/coupons/${couponId}/verify`, {
      method: "POST",
      body: JSON.stringify({ worked, ...(note ? { note } : {}) }),
      cache: "no-store",
    }),

  getCouponVerificationHistory: (couponId: string, limit = 50) =>
    apiFetch<VerificationHistoryItem[]>(`/coupons/${couponId}/verification-history${qs({ limit })}`, {
      revalidate: 60,
    }),

  listStores: (params: StoreListParams = {}) =>
    apiFetch<Paginated<Store>>(`/stores${qs(params)}`, { revalidate: 300 }),

  getStoreById: (storeId: string) => apiFetch<Store>(`/stores/${storeId}`, { revalidate: 300 }),

  getStoreBySlug: (slug: string) =>
    apiFetch<Store>(`/stores/by-slug/${encodeURIComponent(slug)}`, { revalidate: 300 }),

  /** ISO 3166-1 alpha-2 codes Couponza currently serves. */
  listMarkets: () => apiFetch<string[]>(`/stores/markets`, { revalidate: 3600 }),

  listCategories: (params: { parent_id?: string; limit?: number; skip?: number } = {}) =>
    apiFetch<Paginated<Category>>(`/categories${qs(params)}`, { revalidate: 300 }),

  getCategoryBySlug: (slug: string) =>
    apiFetch<Category>(`/categories/by-slug/${encodeURIComponent(slug)}`, { revalidate: 300 }),

  getPageBySlug: (slug: string) => apiFetch<CmsPage>(`/pages/by-slug/${encodeURIComponent(slug)}`, { revalidate: 300 }),

  listProducts: (
    params: { search?: string; store_id?: string; category_id?: string; skip?: number; limit?: number } = {},
  ) => apiFetch<Paginated<Product>>(`/products${qs(params)}`, { revalidate: 60 }),

  getProductBySlug: (slug: string) => apiFetch<Product>(`/products/by-slug/${encodeURIComponent(slug)}`, { revalidate: 60 }),

  getProductById: (id: string) => apiFetch<Product>(`/products/${id}`, { revalidate: 60 }),

  getPriceHistory: (productId: string) =>
    apiFetch<PricePoint[]>(`/products/${productId}/price-history`, { revalidate: 60 }),

  // ---- Autocomplete (no cache, abortable) -------------------------------

  autocompleteStores: (query: string, limit = 10) =>
    apiFetch<string[]>(`/stores/autocomplete${qs({ q: query, limit })}`, { cache: "no-store" }),

  autocompleteCategories: (query: string, limit = 10) =>
    apiFetch<string[]>(`/categories/autocomplete${qs({ q: query, limit })}`, { cache: "no-store" }),

  autocompleteProducts: (query: string, limit = 10) =>
    apiFetch<string[]>(`/products/autocomplete${qs({ q: query, limit })}`, { cache: "no-store" }),

  /**
   * Type-ahead across stores, categories and products. Always runs uncached and
   * takes an AbortSignal so stale keystrokes can be dropped.
   */
  autocomplete: async (
    query: string,
    opts: { limit?: number; signal?: AbortSignal } = {},
  ): Promise<AutocompleteResult> => {
    const { limit = 5, signal } = opts;
    const run = (path: string) => apiFetch<string[]>(`${path}${qs({ q: query, limit })}`, { cache: "no-store", signal });
    const [stores, categories, products] = await Promise.allSettled([
      run("/stores/autocomplete"),
      run("/categories/autocomplete"),
      run("/products/autocomplete"),
    ]);
    return {
      stores: stores.status === "fulfilled" ? stores.value : [],
      categories: categories.status === "fulfilled" ? categories.value : [],
      products: products.status === "fulfilled" ? products.value : [],
    };
  },

  // ---- Auth -------------------------------------------------------------

  register: (body: { email: string; password: string; full_name?: string | null }) =>
    apiFetch<User>("/auth/register", { method: "POST", body: JSON.stringify(body), cache: "no-store" }),

  /** OAuth2 password flow: email goes in as `username`, form-encoded. */
  login: (email: string, password: string) =>
    apiFetch<TokenPair>("/auth/login", {
      method: "POST",
      body: new URLSearchParams({ username: email, password }).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      cache: "no-store",
    }),

  /** Request a password reset email. Always succeeds (even for unknown emails). */
  forgotPassword: (email: string) =>
    apiFetch<void>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      cache: "no-store",
    }),

  /** Reset password using a token from the reset email. */
  resetPassword: (token: string, new_password: string) =>
    apiFetch<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
      cache: "no-store",
    }),

  refresh: (refresh_token: string) =>
    apiFetch<TokenPair>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
      cache: "no-store",
    }),

  me: (token: string) => apiFetch<User>("/auth/me", { token, cache: "no-store" }),

  /** Self-service profile edit: display name and/or password. */
  updateMe: (
    token: string,
    patch: { full_name?: string | null; password?: string; current_password?: string },
  ) =>
    apiFetch<User>("/auth/me", {
      method: "PATCH",
      token,
      body: JSON.stringify(patch),
      cache: "no-store",
    }),

  // ---- Account (/me) ----------------------------------------------------

  listSavedStores: (token: string) => apiFetch<SavedItem[]>("/me/saved-stores", { token, cache: "no-store" }),

  saveStore: (token: string, storeId: string) =>
    apiFetch<{ status: string }>(`/me/saved-stores/${storeId}`, { method: "POST", token, cache: "no-store" }),

  unsaveStore: (token: string, storeId: string) =>
    apiFetch<void>(`/me/saved-stores/${storeId}`, { method: "DELETE", token, cache: "no-store" }),

  listSavedCoupons: (token: string) => apiFetch<SavedItem[]>("/me/saved-coupons", { token, cache: "no-store" }),

  saveCoupon: (token: string, couponId: string) =>
    apiFetch<{ status: string }>(`/me/saved-coupons/${couponId}`, { method: "POST", token, cache: "no-store" }),

  unsaveCoupon: (token: string, couponId: string) =>
    apiFetch<void>(`/me/saved-coupons/${couponId}`, { method: "DELETE", token, cache: "no-store" }),

  listTrackedProducts: (token: string) =>
    apiFetch<TrackedProduct[]>("/me/tracked-products", { token, cache: "no-store" }),

  trackProduct: (token: string, productId: string, targetPrice?: number | null) =>
    apiFetch<TrackedProduct>("/me/tracked-products", {
      method: "POST",
      token,
      body: JSON.stringify({ product_id: productId, target_price: targetPrice ?? null }),
      cache: "no-store",
    }),

  updateTrackedProduct: (token: string, trackedId: string, targetPrice: number | null) =>
    apiFetch<TrackedProduct>(`/me/tracked-products/${trackedId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ target_price: targetPrice }),
      cache: "no-store",
    }),

  untrackProduct: (token: string, trackedId: string) =>
    apiFetch<void>(`/me/tracked-products/${trackedId}`, { method: "DELETE", token, cache: "no-store" }),

  getNotificationPreferences: (token: string) =>
    apiFetch<NotificationPreference>("/me/notification-preferences", { token, cache: "no-store" }),

  updateNotificationPreferences: (
    token: string,
    patch: Partial<Pick<NotificationPreference, "email_enabled" | "telegram_enabled" | "telegram_chat_id" | "push_enabled" | "push_subscription">>,
  ) =>
    apiFetch<NotificationPreference>("/me/notification-preferences", {
      method: "PATCH",
      token,
      body: JSON.stringify(patch),
      cache: "no-store",
    }),

  /** Permanently delete the current user's account. */
  deleteAccount: (token: string, current_password: string) =>
    apiFetch<void>("/auth/me", {
      method: "DELETE",
      token,
      body: JSON.stringify({ current_password }),
      cache: "no-store",
    }),

  listAlerts: (token: string, limit = 50) =>
    apiFetch<AlertEvent[]>(`/me/alerts${qs({ limit })}`, { token, cache: "no-store" }),

  /**
   * The VAPID public key, from the API rather than from a build-time env var.
   *
   * Two sources of truth for one key is a footgun: they drift, and the symptom
   * is `subscribe()` throwing an opaque crypto error on exactly one deployment.
   * It also carries `enabled`, which an env var cannot — the frontend needs to
   * tell "push is off here" apart from "push is broken here", and only the
   * backend knows which.
   */
  getPushPublicKey: () =>
    apiFetch<PushPublicKey>("/me/push/key", { cache: "no-store" }),

  /**
   * Register this browser's subscription. Enables push as a side effect: the
   * browser only produces a subscription after an explicit permission grant, so
   * its arrival is the consent.
   */
  subscribePush: (token: string, subscription: PushSubscriptionPayload) =>
    apiFetch<PushState>("/me/push/subscription", {
      method: "PUT",
      token,
      body: JSON.stringify(subscription),
      cache: "no-store",
    }),

  /** Forget this browser's subscription server-side. */
  unsubscribePush: (token: string) =>
    apiFetch<void>("/me/push/subscription", { method: "DELETE", token, cache: "no-store" }),
};

export { extractDetail };
export default api;
/* ------------------------------------------------------------------ */
/* Resilient wrappers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Public-catalogue reads that must never take a page down with them.
 *
 * A storefront that 500s because the API had a bad minute is worse than one
 * that renders with an empty section, and a static build must not need a live
 * API to succeed. Every wrapper here degrades to an empty result instead of
 * throwing. Authenticated calls deliberately do NOT appear here — a failed
 * account read should surface as an error state, not as "you have no saved
 * items".
 */

/** Element type is preserved so callers still get the right shape on success. */
function orEmpty<T>(promise: Promise<Paginated<T>>): Promise<Paginated<T>> {
  return promise.catch(() => ({ items: [], total: 0, skip: 0, limit: 0 }));
}

function orNull<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch(() => null);
}

function orEmptyArray<T>(promise: Promise<T[]>): Promise<T[]> {
  return promise.catch(() => []);
}

export const resilient = {
  listCoupons: (params: CouponListParams = {}) => orEmpty(api.listCoupons(params)),
  getCouponBySlug: (slug: string) => orNull(api.getCouponBySlug(slug)),
  getCouponById: (couponId: string) => orNull(api.getCouponById(couponId)),
  listStores: (params: StoreListParams = {}) => orEmpty(api.listStores(params)),
  getStoreBySlug: (slug: string) => orNull(api.getStoreBySlug(slug)),
  getStoreById: (storeId: string) => orNull(api.getStoreById(storeId)),
  listMarkets: () => orEmptyArray(api.listMarkets()),
  listCategories: (params: { parent_id?: string; limit?: number; skip?: number } = {}) =>
    orEmpty(api.listCategories(params)),
  getCategoryBySlug: (slug: string) => orNull(api.getCategoryBySlug(slug)),
  listProducts: (
    params: { search?: string; store_id?: string; category_id?: string; skip?: number; limit?: number } = {},
  ) => orEmpty(api.listProducts(params)),
  getProductBySlug: (slug: string) => orNull(api.getProductBySlug(slug)),
  getProductById: (id: string) => orNull(api.getProductById(id)),
  getPriceHistory: (productId: string) => orEmptyArray(api.getPriceHistory(productId)),
  getPageBySlug: (slug: string) => orNull(api.getPageBySlug(slug)),
  getCouponVerificationHistory: (couponId: string, limit = 50) =>
    orEmptyArray(api.getCouponVerificationHistory(couponId, limit)),
};
