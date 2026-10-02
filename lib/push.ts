import type { PushSubscriptionPayload } from "@/lib/types";

/**
 * Browser push plumbing, kept out of the settings component.
 *
 * Everything here has a hard browser requirement, and each of those requirements
 * has a specific runtime failure that is very hard to read without knowing the
 * rule. They are collected in one file so the rules are stated once:
 *
 * * `Notification.requestPermission()` must be called from a user gesture. React
 *   event handlers count; `useEffect` does not, and the promise never settles.
 * * `navigator.serviceWorker.ready` never resolves without a *registered*
 *   worker. `navigator.serviceWorker.register()` alone is not enough, and
 *   awaiting `ready` without it hangs forever with no error.
 * * `subscribe()` requires `applicationServerKey` as raw bytes, not the
 *   URL-safe base64 the server stores.
 * * The page must be a secure context. `http://` other than localhost has no
 *   `Notification` and no `serviceWorker` at all.
 */

export const SERVICE_WORKER_PATH = "/sw.js";

/** Why push is unavailable, in terms the settings page can render. */
export type PushUnavailable =
  | "unsupported"
  | "insecure-context"
  | "no-vapid-key"
  | "denied"
  | "dismissed";

export type PushSupport =
  | { kind: "ready" }
  | { kind: "unavailable"; reason: PushUnavailable };

/**
 * Everything needed to subscribe, or the reason it cannot be done.
 *
 * The order matters: capability first, then configuration, then permission.
 * Asking for permission before checking whether push is configured at all
 * produces a permission prompt that silently leads nowhere, which is the worst
 * possible outcome — the user pays for consent and gets nothing.
 */
export async function checkPushSupport(): Promise<PushSupport> {
  if (typeof window === "undefined") return { kind: "unavailable", reason: "unsupported" };
  // Checking the API's presence alone is not enough: on an insecure origin both
  // properties are simply absent rather than throwing.
  if (!window.isSecureContext) return { kind: "unavailable", reason: "insecure-context" };
  // Value checks, not `"x" in window`: an `in` test is satisfied by a property
  // that exists but is `undefined`, which is exactly how these appear on a
  // locked-down enterprise browser.
  if (!navigator.serviceWorker || !window.PushManager || !window.Notification) {
    return { kind: "unavailable", reason: "unsupported" };
  }
  return { kind: "ready" };
}

/**
 * VAPID keys arrive URL-safe base64; `applicationServerKey` wants raw bytes.
 * Allocating through `new ArrayBuffer` keeps the result a plain `ArrayBuffer`
 * rather than a possibly-shared one, which is what the DOM types expect.
 */
export function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalised);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buffer;
}

/**
 * Register the worker if needed and resolve once one is controlling the page.
 *
 * The register call is idempotent — the browser diffs the script and only
 * reinstalls on a byte change — so this is safe to run on every visit.
 */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: "/" });
  return navigator.serviceWorker.ready;
}

/** The subscription already stored in this browser, if any. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await ensureServiceWorker();
  return registration.pushManager.getSubscription();
}

/**
 * Ask for permission and subscribe. Call from a click handler.
 *
 * Returns the subscription in exactly the shape the API validates — this is
 * `PushSubscription.toJSON()` output, so no reshaping is needed.
 */
export async function subscribePush(vapidPublicKey: string): Promise<PushSubscriptionPayload> {
  const support = await checkPushSupport();
  if (support.kind === "unavailable") {
    throw new PushUnsupportedError(support.reason);
  }

  const permission = await Notification.requestPermission();
  if (permission === "denied") throw new PushUnsupportedError("denied");
  // "default" means the user dismissed the prompt without answering. Treating it
  // as consent would store a subscription the user never agreed to.
  if (permission !== "granted") throw new PushUnsupportedError("dismissed");

  const registration = await ensureServiceWorker();

  // A browser can revoke a subscription behind our back (clearing site data,
  // changing profiles). Reuse the live one if it exists rather than subscribing
  // twice and orphaning the first endpoint.
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      // Not optional: the push API rejects subscriptions that are not visible.
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(vapidPublicKey),
    }));

  return subscription.toJSON() as PushSubscriptionPayload;
}

/** Remove this browser's subscription. Safe to call when there is none. */
export async function unsubscribePush(): Promise<void> {
  const registration = await ensureServiceWorker();
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();
}

/** Human-readable reasons, kept beside the codes so they cannot drift apart. */
export const PUSH_UNAVAILABLE_COPY: Record<PushUnavailable, string> = {
  unsupported: "This browser does not support web push. Email alerts work everywhere.",
  "insecure-context": "Push needs HTTPS. Email alerts work everywhere.",
  "no-vapid-key": "Push is not configured on this deployment. Email alerts work everywhere.",
  denied: "Your browser is blocking notifications for this site. Email alerts still work.",
  dismissed: "Notification permission was dismissed. Email alerts still work.",
};

export class PushUnsupportedError extends Error {
  constructor(readonly reason: PushUnavailable) {
    super(PUSH_UNAVAILABLE_COPY[reason]);
    this.name = "PushUnsupportedError";
  }
}
