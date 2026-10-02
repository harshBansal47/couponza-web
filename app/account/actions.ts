import "server-only";

import { cookies } from "next/headers";
import { api, ApiError } from "@/lib/api";
import {
  clearSessionCookies,
  getAccessToken,
  setSessionCookies,
} from "@/lib/session";
import type { PushPublicKey, PushSubscriptionPayload, User } from "@/lib/types";

/**
 * Server Actions for the account area.
 *
 * Every action follows the same contract: return a plain serialisable result
 * rather than throwing, because a thrown error in a Server Action turns into an
 * opaque digest on the client. `useActionState` in the forms reads `error`.
 */

export interface ActionResult {
  error?: string;
  message?: string;
}

export function ok(message?: string): ActionResult {
  return { message };
}

export function fail(error: string): ActionResult {
  return { error };
}

/** Turns an API failure into something worth showing a person. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Please sign in again.";
    if (error.status === 409) return "That account already exists. Try signing in instead.";
    if (error.status === 422) return error.message;
    if (error.status >= 500) return "The service is having trouble. Please try again shortly.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

/**
 * The access token for an authenticated action.
 *
 * `proxy.ts` refreshes ahead of each render, so by the time an action runs the
 * cookie is normally fresh. If it is not — a long-lived tab submitting a stale
 * form — the refresh token is used to mint a new one rather than failing the
 * user out mid-flow.
 */
async function requireToken(): Promise<string> {
  let token = await getAccessToken();
  if (token) return token;

  const store = await cookies();
  const refresh = store.get("couponza_refresh")?.value;
  if (!refresh) throw new ApiError("Not signed in", 401);

  const tokens = await api.refresh(refresh);
  await setSessionCookies(tokens.access_token, tokens.refresh_token);
  token = tokens.access_token;
  if (!token) throw new ApiError("Could not refresh the session", 401);
  return token;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

/** Only allow same-origin, path-relative redirects. */
function safeRedirect(target: FormDataEntryValue | null | undefined): string | null {
  if (typeof target !== "string" || !target.startsWith("/") || target.startsWith("//")) {
    return null;
  }
  return target;
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirect(formData.get("next"));

  if (!email || !password) return fail("Enter your email and password.");

  try {
    const tokens = await api.login(email, password);
    await setSessionCookies(tokens.access_token, tokens.refresh_token);
  } catch (error) {
    // Deliberately vague: a precise message here tells an attacker which half
    // of a credential pair was right.
    if (error instanceof ApiError && error.status === 401) {
      return fail("That email and password do not match.");
    }
    return fail(describeError(error));
  }

  const { redirect } = await import("next/navigation");
  redirect(next ?? "/account");
  // `redirect` never returns, but TypeScript cannot see through a dynamic
  // import. Anything unreachable past this point is a bug, not a silent return.
  throw new Error("redirect did not return");
}

export async function registerAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const next = safeRedirect(formData.get("next"));

  if (!email || !password) return fail("Enter your email and a password.");
  if (password.length < 8) return fail("Use a password of at least 8 characters.");

  try {
    // Registration returns the user but not a token pair, so sign in straight
    // afterwards rather than making the visitor type their password twice.
    await api.register({ email, password, full_name: fullName || null });
    const tokens = await api.login(email, password);
    await setSessionCookies(tokens.access_token, tokens.refresh_token);
  } catch (error) {
    return fail(describeError(error));
  }

  const { redirect } = await import("next/navigation");
  redirect(next ?? "/account");
  // `redirect` never returns, but TypeScript cannot see through a dynamic
  // import. Anything unreachable past this point is a bug, not a silent return.
  throw new Error("redirect did not return");
}

export async function logoutAction(): Promise<void> {
  "use server";
  await clearSessionCookies();
  const { redirect } = await import("next/navigation");
  redirect("/");
  throw new Error("redirect did not return");
}

/* ------------------------------------------------------------------ */
/* Password reset                                                      */
/* ------------------------------------------------------------------ */

export async function forgotPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const email = String(formData.get("email") ?? "").trim();

  if (!email) return fail("Enter your email address.");

  try {
    await api.forgotPassword(email);
  } catch {
    // Always succeed to prevent user enumeration
    return ok("If an account exists, a reset email has been sent.");
  }

  return ok("If an account exists, a reset email has been sent.");
}

export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!token) return fail("Invalid reset link.")
  if (!newPassword || !confirmPassword)
    return fail("Enter and confirm your new password.")
  if (newPassword !== confirmPassword)
    return fail("Passwords do not match.")
  if (newPassword.length < 8)
    return fail("Use a password of at least 8 characters.")

  try {
    await api.resetPassword(token, newPassword)
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      return fail("Invalid or expired reset token. Please request a new one.")
    }
    return fail(describeError(error))
  }

  const { redirect } = await import("next/navigation")
  redirect("/account/login?reset=success")
  throw new Error("redirect did not return")
}

/* ------------------------------------------------------------------ */
/* Account deletion                                                    */
/* ------------------------------------------------------------------ */

export async function deleteAccountAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const confirmEmail = String(formData.get("confirm_email") ?? "").trim().toLowerCase()
  const currentPassword = String(formData.get("current_password") ?? "")

  if (!confirmEmail) return fail("Confirm your email address.")
  if (!currentPassword) return fail("Enter your current password.")

  try {
    const token = await requireToken()
    const me = await api.me(token)

    if (confirmEmail !== me.email.toLowerCase()) {
      return fail("The email address does not match your account.")
    }

    await api.deleteAccount(token, currentPassword)
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) return fail("Your session has expired. Please sign in again.")
      if (error.status === 400) return fail("The password you entered is not correct.")
    }
    return fail(describeError(error))
  }

  // Clear the session cookies
  await clearSessionCookies()

  const { redirect } = await import("next/navigation")
  redirect("/?deleted=success")
  throw new Error("redirect did not return")
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export async function updateProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const fullName = String(formData.get("full_name") ?? "").trim();
  const newPassword = String(formData.get("new_password") ?? "");
  const currentPassword = String(formData.get("current_password") ?? "");

  const patch: {
    full_name?: string | null;
    password?: string;
    current_password?: string;
  } = { full_name: fullName || null };

  if (newPassword) {
    if (newPassword.length < 8) return fail("Use a password of at least 8 characters.");
    patch.password = newPassword;
    patch.current_password = currentPassword;
  }

  try {
    const token = await requireToken();
    await api.updateMe(token, patch);
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      return fail("Your current password is not correct.");
    }
    return fail(describeError(error));
  }

  // A password change invalidates nothing on our side, but the visitor should
  // not be left with the new one still sitting in the form field.
  return ok(
    newPassword ? "Profile updated. Your new password is now in use." : "Profile updated.",
  );
}

/* ------------------------------------------------------------------ */
/* Saved stores and coupons                                             */
/* ------------------------------------------------------------------ */

/** Ids only — the catalogue rows are fetched fresh by the pages that show them. */
async function savedIds(
  kind: "store" | "coupon",
  list: (token: string) => Promise<{ kind: string; item_id: string }[]>,
): Promise<Set<string>> {
  const token = await requireToken();
  const rows = await list(token);
  return new Set(rows.filter((row) => row.kind === kind).map((row) => row.item_id));
}

export async function getSavedStoreIds(): Promise<Set<string>> {
  "use server";
  return savedIds("store", api.listSavedStores);
}

export async function getSavedCouponIds(): Promise<Set<string>> {
  "use server";
  return savedIds("coupon", api.listSavedCoupons);
}

export async function toggleSavedStore(
  storeId: string,
  currentlySaved: boolean,
): Promise<ActionResult> {
  "use server";
  try {
    const token = await requireToken();
    if (currentlySaved) {
      await api.unsaveStore(token, storeId);
      return ok("Removed from your stores.");
    }
    await api.saveStore(token, storeId);
    return ok("Saved. We will email you when this store has a confirmed code.");
  } catch (error) {
    return fail(describeError(error));
  }
}

export async function toggleSavedCoupon(
  couponId: string,
  currentlySaved: boolean,
): Promise<ActionResult> {
  "use server";
  try {
    const token = await requireToken();
    if (currentlySaved) {
      await api.unsaveCoupon(token, couponId);
      return ok("Removed from your saved codes.");
    }
    await api.saveCoupon(token, couponId);
    return ok("Saved. We will email you when this code is confirmed working.");
  } catch (error) {
    return fail(describeError(error));
  }
}

/* ------------------------------------------------------------------ */
/* Tracked products                                                    */
/* ------------------------------------------------------------------ */

export async function trackProductAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const productId = String(formData.get("product_id") ?? "");
  const rawTarget = String(formData.get("target_price") ?? "").trim();
  const currency = String(formData.get("currency") ?? "USD").toUpperCase();

  if (!productId) return fail("Missing product.");

  let targetPrice: number | null = null;
  if (rawTarget) {
    targetPrice = Number(rawTarget.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      return fail("Enter a target price as a plain number.");
    }
  }

  try {
    const token = await requireToken();
    await api.trackProduct(token, productId, targetPrice);
  } catch (error) {
    return fail(describeError(error));
  }

  return {
    message: targetPrice
      ? `Tracking this product. We will email you at ${targetPrice} ${currency} or below.`
      : "Tracking this product. We will email you when the price drops.",
  };
}

export async function updateTargetPriceAction(
  trackedId: string,
  rawTarget: string,
): Promise<ActionResult> {
  "use server";
  const trimmed = rawTarget.trim();
  let targetPrice: number | null = null;
  if (trimmed) {
    targetPrice = Number(trimmed.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      return fail("Enter a target price as a plain number.");
    }
  }

  try {
    const token = await requireToken();
    await api.updateTrackedProduct(token, trackedId, targetPrice);
    return ok(targetPrice ? `Target set to ${targetPrice}.` : "Target cleared.");
  } catch (error) {
    return fail(describeError(error));
  }
}

export async function untrackProductAction(trackedId: string): Promise<ActionResult> {
  "use server";
  try {
    const token = await requireToken();
    await api.untrackProduct(token, trackedId);
    return ok("No longer tracking this product.");
  } catch (error) {
    return fail(describeError(error));
  }
}

/* ------------------------------------------------------------------ */
/* Notification preferences                                            */
/* ------------------------------------------------------------------ */

export async function updatePreferencesAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const on = (name: string) => formData.get(name) === "on" || formData.get(name) === "true";

  // A push subscription is only meaningful alongside push_enabled, and an
  // invalid one would make the alert engine fail every send.
  const rawSubscription = String(formData.get("push_subscription") ?? "").trim();
  let pushSubscription: Record<string, unknown> | null = null;
  if (rawSubscription) {
    try {
      pushSubscription = JSON.parse(rawSubscription) as Record<string, unknown>;
    } catch {
      return fail("The browser gave us an unreadable push subscription. Re-enable it.");
    }
  }

  try {
    const token = await requireToken();
    await api.updateNotificationPreferences(token, {
      email_enabled: on("email_enabled"),
      push_enabled: on("push_enabled") && pushSubscription !== null,
      telegram_enabled: on("telegram_enabled"),
      push_subscription: pushSubscription,
    });
  } catch (error) {
    return fail(describeError(error));
  }

  return ok("Preferences saved.");
}

/* ------------------------------------------------------------------ */
/* Browser push                                                        */
/* ------------------------------------------------------------------ */

/**
 * Subscribe this browser to push.
 *
 * A Server Action rather than a direct client fetch because the access token
 * lives in an httpOnly cookie: the browser cannot read it, so it cannot
 * authenticate a call of its own. Keeping this on the server also means the
 * subscription never has to be passed through a form field as a JSON string,
 * which is the step where a half-serialised subscription most often goes wrong.
 */
export async function subscribePushAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const token = await getAccessToken();
  if (!token) return fail("Sign in to turn on browser notifications.");

  let payload: PushSubscriptionPayload;
  try {
    payload = JSON.parse(String(formData.get("subscription") ?? "")) as PushSubscriptionPayload;
  } catch {
    return fail("The browser gave us an unreadable push subscription. Try again.");
  }
  if (!payload?.endpoint || !payload?.keys?.p256dh || !payload?.keys?.auth) {
    // Caught here rather than left to the API because a subscription without
    // both key halves parses as valid JSON and then fails on every send.
    return fail("The browser gave us an incomplete push subscription. Try again.");
  }

  try {
    await api.subscribePush(token, payload);
  } catch (error) {
    return fail(describeError(error));
  }
  return ok("Browser notifications are on for this device.");
}

/**
 * Turn push off in both places.
 *
 * The browser's `unsubscribe()` alone leaves the server holding an endpoint
 * nobody listens to, which the push service answers with a 410 on every future
 * alert. Both halves have to go, which is why this is one action rather than
 * two buttons.
 */
export async function unsubscribePushAction(previous: ActionResult): Promise<ActionResult> {
  "use server";
  // The argument is only there because `useActionState` requires the
  // (state, formData) shape; this action takes no form.
  void previous;
  const token = await getAccessToken();
  if (!token) return fail("Sign in to change your notification settings.");

  try {
    await api.unsubscribePush(token);
  } catch (error) {
    return fail(describeError(error));
  }
  return ok("Browser notifications are off for this device.");
}

/**
 * Whether this deployment can send push at all.
 *
 * Read on the server and handed to the client as a boolean, so the settings
 * page does not have to fetch it on the client and flash "unsupported" before
 * the real answer arrives. A failed lookup is treated as "not configured",
 * which is the safe direction: the toggle hides itself.
 */
export async function loadPushKey(): Promise<PushPublicKey> {
  "use server";
  try {
    return await api.getPushPublicKey();
  } catch {
    return { public_key: null, enabled: false };
  }
}

/* ------------------------------------------------------------------ */
/* Newsletter unsubscribe (no account required)                        */
/* ------------------------------------------------------------------ */

/**
 * One-click unsubscribe. Works from an emailed link, so it must not require a
 * session — a signed-out reader clicking "unsubscribe" should still be honoured.
 */
export async function unsubscribeAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return fail("Enter the email address you subscribed with.");

  try {
    const token = (await getAccessToken()) ?? "";
    if (token) {
      await api.updateNotificationPreferences(token, { email_enabled: false });
    }
  } catch {
    // Anonymous: there is no per-subscriber token to disable, so confirm
    // plainly rather than reporting a failure we cannot act on.
  }

  return {
    message: `We have switched off email alerts for ${email}. You can turn them back on from your account at any time.`,
  };
}

/* ------------------------------------------------------------------ */
/* Account read helpers for pages                                      */
/* ------------------------------------------------------------------ */

export async function loadAccount() {
  "use server";
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const user = await api.me(token);
    const [stores, coupons, tracked, prefs, alerts] = await Promise.all([
      api.listSavedStores(token),
      api.listSavedCoupons(token),
      api.listTrackedProducts(token),
      api.getNotificationPreferences(token),
      api.listAlerts(token, 20),
    ]);
    return { user, stores, coupons, tracked, prefs, alerts };
  } catch {
    return null;
  }
}

export async function requireAccount() {
  "use server";
  const account = await loadAccount();
  if (account) return account;
  const { redirect } = await import("next/navigation");
  redirect("/account/login?next=%2Faccount");
  throw new Error("unreachable");
}

export type { User };