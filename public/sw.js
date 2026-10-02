/**
 * Couponza's service worker.
 *
 * Deliberately minimal. It exists for two reasons and not for a third:
 *
 *  1. The Push API requires a service worker — there is no way to receive a
 *     push notification without one.
 *  2. Showing the notification when a push arrives.
 *
 * It is *not* a cache layer. This site's pages are server-rendered from live
 * price data; a cached coupon page that shows yesterday's price is worse than a
 * slow page, and "stale price" is the one failure this product cannot have.
 *
 * `userVisibleOnly: true` on the subscribe side is a hard requirement of the
 * push API, and it is why `showNotification` below must never be conditional.
 */

self.addEventListener("install", () => {
  // No precaching to do, so take over as soon as possible.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Clicking a notification should land on the product the alert was about, not
 * on the homepage. The server puts an absolute path in `data.url`; anything
 * unrecognised falls back to the account page rather than the site root, since
 * every alert is about something the reader asked us to watch.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Prefer reusing an open tab: a notification that spawns a second copy of
      // the site is the most common complaint about web push.
      for (const client of clientList) {
        if ("focus" in client) {
          if (target && "navigate" in client) {
            return client.navigate(target).then((navigated) => navigated || client.focus());
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(target || "/account/alerts");
    }),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // A push we cannot parse still has to show *something*: silently dropping it
    // is indistinguishable from the alert never having been sent.
    payload = { title: "Couponza", body: "A new deal just landed.", url: "/account/alerts" };
  }

  const title = payload.title || "Couponza";
  const options = {
    body: payload.body || "",
    // Same tag collapses repeated alerts for the same product instead of
    // stacking five notifications when one product drops repeatedly.
    tag: payload.tag || "couponza-alert",
    renotify: true,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url || "/account/alerts" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
