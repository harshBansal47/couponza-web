import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh, running ahead of every page render.
 *
 * (Next 16 renamed the `middleware` file convention to `proxy`.)
 *
 *
 * The API issues 30-minute access tokens and 7-day refresh tokens. Reading the
 * expiry out of the JWT payload here — without verifying the signature, which
 * is the API's job, not the edge runtime's — is enough to decide whether a
 * refresh round-trip is worth making before rendering a page.
 */

const ACCESS_COOKIE = "couponza_access";
const REFRESH_COOKIE = "couponza_refresh";
/** Refresh this long before expiry so a slow render can't race the deadline. */
const REFRESH_MARGIN_SECONDS = 120;
const ACCESS_MAX_AGE = 30 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function expiryOf(jwt: string): number | null {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  // Nothing to do for anonymous visitors.
  if (!refresh) return NextResponse.next();

  const nowSeconds = Date.now() / 1000;
  const accessExpiry = access ? expiryOf(access) : 0;
  const needsRefresh = accessExpiry === null || accessExpiry - nowSeconds < REFRESH_MARGIN_SECONDS;

  if (!needsRefresh) return NextResponse.next();

  let tokens: { access_token: string; refresh_token: string };
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    });
    if (!res.ok) {
      // Refresh token rejected or expired: clear the session so the header and
      // every account page stop pretending the visitor is signed in.
      const response = NextResponse.next();
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      return response;
    }
    tokens = (await res.json()) as { access_token: string; refresh_token: string };
  } catch {
    // API unreachable. Keep the existing cookies — a transient network blip
    // should not log anyone out.
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
    ...cookieOptions,
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...cookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
  return response;
}

export const config = {
  // Never run on the API itself, static assets, image optimisation or the
  // service worker — only on real page navigations.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sw.js).*)"],
};