import "server-only";

import { cookies } from "next/headers";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

/**
 * Session handling for Server Components and Server Actions.
 *
 * The API issues a 30-minute access token and a 7-day refresh token. The access
 * token lives in an httpOnly cookie so nothing client-side can read it; the
 * refresh token does the same. `middleware.ts` rotates the access token before
 * a request is served whenever it is close to expiry, so pages below can treat
 * a present access token as valid and let the API be the only authority.
 */

export const ACCESS_COOKIE = "couponza_access";
export const REFRESH_COOKIE = "couponza_refresh";

/** Matches the API's 30-minute access token so the two are set independently. */
const ACCESS_MAX_AGE = 30 * 60;
/** Matches the API's 7-day refresh token. */
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

const secure = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure,
} as const;

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

/** Only call from a Server Action or Route Handler — cookies are read-only in RSC. */
export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, { ...baseCookieOptions, maxAge: ACCESS_MAX_AGE });
  store.set(REFRESH_COOKIE, refreshToken, { ...baseCookieOptions, maxAge: REFRESH_MAX_AGE });
}

/** Only call from a Server Action or Route Handler. */
export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/**
 * The signed-in user, or null when anonymous. Never throws: a revoked account,
 * an expired token or an unreachable API all mean "not signed in" as far as the
 * page is concerned.
 */
export async function getSessionUser(): Promise<User | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await api.me(token);
  } catch {
    return null;
  }
}

/**
 * The signed-in user, or a redirect to the sign-in page with a `next` param so
 * the visitor lands back where they were after authenticating.
 */
export async function requireUser(returnTo = "/account"): Promise<User> {
  const user = await getSessionUser();
  if (user) return user;
  const { redirect } = await import("next/navigation");
  redirect(`/account/login?next=${encodeURIComponent(returnTo)}`);
  // `redirect` never returns, but TypeScript cannot see through the dynamic
  // import, so this satisfies the signature without weakening it to `User | null`.
  throw new Error("unreachable");
}

/** Display name for the header: prefers the real name, falls back to the email. */
export function displayName(user: Pick<User, "full_name" | "email">): string {
  return user.full_name?.trim() || user.email.split("@")[0];
}