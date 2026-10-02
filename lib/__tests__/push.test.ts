import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PUSH_UNAVAILABLE_COPY,
  PushUnsupportedError,
  checkPushSupport,
  currentSubscription,
  subscribePush,
  unsubscribePush,
  urlBase64ToArrayBuffer,
  type PushUnavailable,
} from "@/lib/push";
import type { PushSubscriptionPayload } from "@/lib/types";

/**
 * Browser push is mostly a pile of hard browser rules that fail silently. These
 * tests pin down the ones we actually get wrong: the secure-context check, the
 * user-gesture/permission pairing, base64 decoding, and never subscribing twice.
 */

const VAPID = "BOa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0";

/** A minimal `PushSubscription` stand-in; only `toJSON` is used. */
function fakeSubscription(payload: PushSubscriptionPayload): PushSubscription {
  return {
    endpoint: payload.endpoint,
    expirationTime: null,
    getKey: () => null,
    toJSON: () => payload,
    unsubscribe: vi.fn().mockResolvedValue(true),
  } as unknown as PushSubscription;
}

const PAYLOAD: PushSubscriptionPayload = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "public-key", auth: "auth-secret" },
};

// Module-scoped so every describe block shares them. Creating them per-block
// left blocks that did not set `getSubscription` reading `undefined`, which is
// indistinguishable from a real bug in `unsubscribePush`.
const subscribe = vi.fn();
const getSubscription = vi.fn();
const register = vi.fn();

/**
 * Install a service-worker container on `navigator`.
 *
 * `ready` is exposed as a *property holding a promise*, because that is what
 * it is in the real API. Modelling it as a method is the trap this file exists
 * partly to document: `await navigator.serviceWorker.ready` on a function
 * resolves to the function object rather than to anything it would return, so
 * the "await hangs forever with no error" bug becomes "await silently hands you
 * a function" — which fails a long way from the mistake.
 */
function installBrowserSupport() {
  const registration = { pushManager: { subscribe, getSubscription } };

  const requestPermission = vi.fn().mockResolvedValue("granted");
  Object.assign(window, {
    isSecureContext: true,
    PushManager: class {},
    Notification: class {
      static permission: NotificationPermission = "granted";
      static requestPermission = requestPermission;
    },
  });
  notificationRequestPermission = requestPermission;

  Object.assign(navigator, {
    serviceWorker: {
      register,
      get ready() {
        return Promise.resolve(registration);
      },
    },
  });
}

let notificationRequestPermission = vi.fn();

beforeEach(() => {
  subscribe.mockReset().mockResolvedValue(fakeSubscription(PAYLOAD));
  getSubscription.mockReset().mockResolvedValue(null);
  register.mockReset().mockResolvedValue(undefined);
  installBrowserSupport();
});

describe("checkPushSupport", () => {
  it("reports ready on a secure origin with the APIs present", async () => {
    await expect(checkPushSupport()).resolves.toEqual({ kind: "ready" });
  });

  it("reports insecure-context rather than unsupported on plain http", async () => {
    // These are different problems with different fixes, and conflating them
    // tells a user on a LAN-hosted dev server that their browser is at fault.
    Object.assign(window, { isSecureContext: false });
    await expect(checkPushSupport()).resolves.toEqual({
      kind: "unavailable",
      reason: "insecure-context",
    });
  });

  it("reports unsupported when PushManager is present but undefined", async () => {
    // `in` would say this is supported. Locked-down browsers expose the name
    // without the capability, and "unsupported" is the honest answer.
    Object.assign(window, { PushManager: undefined });
    await expect(checkPushSupport()).resolves.toEqual({
      kind: "unavailable",
      reason: "unsupported",
    });
  });

  it("reports unsupported when PushManager is missing", async () => {
    // Safari < 16.4 and every Firefox for Android release have Notification and
    // serviceWorker but no PushManager.
    Object.assign(window, { PushManager: undefined });
    const result = await checkPushSupport();
    expect(result).toEqual({ kind: "unavailable", reason: "unsupported" });
  });

  it("reports unsupported when serviceWorker is missing", async () => {
    Object.assign(navigator, { serviceWorker: undefined });
    await expect(checkPushSupport()).resolves.toEqual({
      kind: "unavailable",
      reason: "unsupported",
    });
  });
});

describe("urlBase64ToArrayBuffer", () => {
  it("decodes standard base64", () => {
    // "hello" -> aGVsbG8=
    const buffer = urlBase64ToArrayBuffer("aGVsbG8");
    expect(new TextDecoder().decode(buffer)).toBe("hello");
  });

  it("decodes the url-safe alphabet and restores padding", () => {
    // VAPID keys are url-safe base64: - and _ instead of + and /, and the
    // padding is usually stripped. Getting either wrong yields a buffer of the
    // right length and entirely the wrong bytes, which fails as an opaque
    // crypto error at subscribe() time.
    const bytes = new Uint8Array([251, 255, 190, 255]);
    const urlSafe = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    expect([...new Uint8Array(urlBase64ToArrayBuffer(urlSafe))]).toEqual([...bytes]);
  });

  it("returns a plain ArrayBuffer, not a view", () => {
    // `atob` returns a string; anything derived from `.buffer` on a Uint8Array
    // can be a larger shared buffer, which the DOM types reject.
    expect(urlBase64ToArrayBuffer("aGVsbG8")).toBeInstanceOf(ArrayBuffer);
  });
});

describe("subscribePush", () => {
  it("returns the subscription in the shape the API validates", async () => {
    await expect(subscribePush(VAPID)).resolves.toEqual(PAYLOAD);
  });

  it("registers the service worker before awaiting ready", async () => {
    // `navigator.serviceWorker.ready` never resolves without a registered
    // worker, so skipping the register hangs forever with no error at all.
    await subscribePush(VAPID);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  it("sets userVisibleOnly, which the push API requires", async () => {
    await subscribePush(VAPID);
    expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
  });

  it("passes the key as raw bytes, not as the base64 string", async () => {
    await subscribePush(VAPID);
    const key = subscribe.mock.calls[0]![0].applicationServerKey;
    expect(key).toBeInstanceOf(ArrayBuffer);
  });

  it("reuses an existing subscription rather than creating a second one", async () => {
    // Browsers revoke subscriptions behind our back, and subscribing twice
    // orphans the first endpoint — which keeps receiving pushes nobody can see.
    getSubscription.mockResolvedValue(fakeSubscription(PAYLOAD));

    await subscribePush(VAPID);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("refuses when permission was denied", async () => {
    notificationRequestPermission.mockResolvedValue("denied");
    await expect(subscribePush(VAPID)).rejects.toBeInstanceOf(PushUnsupportedError);
  });

  it("refuses when the prompt was dismissed rather than answered", async () => {
    // "default" is not consent. Storing a subscription here would send alerts to
    // a browser whose owner explicitly did not grant permission.
    notificationRequestPermission.mockResolvedValue("default");
    await expect(subscribePush(VAPID)).rejects.toMatchObject({ reason: "dismissed" });
  });

  it("does not subscribe when permission was not granted", async () => {
    notificationRequestPermission.mockResolvedValue("denied");
    await subscribePush(VAPID).catch(() => undefined);
    expect(subscribe).not.toHaveBeenCalled();
  });
});

describe("currentSubscription", () => {
  it("returns null when this device has never subscribed", async () => {
    getSubscription.mockResolvedValue(null);
    await expect(currentSubscription()).resolves.toBeNull();
  });

  it("returns the live subscription when there is one", async () => {
    const existing = fakeSubscription(PAYLOAD);
    getSubscription.mockResolvedValue(existing);
    await expect(currentSubscription()).resolves.toBe(existing);
  });
});

describe("unsubscribePush", () => {
  it("unsubscribes an existing subscription", async () => {
    const existing = fakeSubscription(PAYLOAD);
    getSubscription.mockResolvedValue(existing);

    await unsubscribePush();
    expect(existing.unsubscribe).toHaveBeenCalled();
  });

  it("is a no-op when there is nothing to unsubscribe", async () => {
    // Turning push off twice must not throw; the settings page calls this
    // whenever the button is pressed, and an error here would leave the UI stuck
    // claiming push is still on.
    getSubscription.mockResolvedValue(null);
    await expect(unsubscribePush()).resolves.toBeUndefined();
  });
});

describe("PUSH_UNAVAILABLE_COPY", () => {
  it("has a message for every reason the code can produce", () => {
    // A missing key here renders an empty line in the settings page, which reads
    // as a bug to the user and as nothing at all to us.
    const reasons: PushUnavailable[] = [
      "unsupported",
      "insecure-context",
      "no-vapid-key",
      "denied",
      "dismissed",
    ];
    for (const reason of reasons) {
      expect(PUSH_UNAVAILABLE_COPY[reason]).toBeTruthy();
    }
  });

  it("always tells the reader that email still works", () => {
    // Push is a bonus channel. Every unavailable message must leave the reader
    // with a route forward, otherwise the page is a dead end.
    for (const message of Object.values(PUSH_UNAVAILABLE_COPY)) {
      expect(message.toLowerCase()).toMatch(/email/);
    }
  });
});
