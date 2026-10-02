"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Select";
import type { ActionResult } from "@/app/account/actions";
import {
  PUSH_UNAVAILABLE_COPY,
  PushUnsupportedError,
  checkPushSupport,
  currentSubscription,
  subscribePush,
  unsubscribePush,
  type PushUnavailable,
} from "@/lib/push";

/**
 * Notification preferences, including browser push.
 *
 * Push is driven by the browser rather than by this form's submit button, and
 * that asymmetry is deliberate. The permission prompt can only be raised from a
 * user gesture, and it must be resolved *before* anything is stored — a stored
 * `push_enabled` with no working subscription is the one state that is worse
 * than either alternative, because the UI promises notifications that never
 * arrive. So push gets its own button, and the preference form below it never
 * touches it.
 *
 * Everything in `lib/push.ts` about *why* — the gesture rule, the service-worker
 * registration, the secure-context requirement — is documented there, next to
 * the code that has to respect it.
 */

type PushPhase =
  | { kind: "unknown" }
  | { kind: "off" }
  | { kind: "on" }
  | { kind: "working" }
  | { kind: "unavailable"; reason: PushUnavailable };

export default function NotificationSettings({
  action,
  subscribeAction,
  unsubscribeAction,
  initial,
  vapidKey,
  pushConfigured,
  hasSession,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  subscribeAction: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  unsubscribeAction: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  initial: {
    email_enabled: boolean;
    push_enabled: boolean;
    telegram_enabled: boolean;
  };
  /** Null when this deployment has no VAPID keys. */
  vapidKey: string | null;
  pushConfigured: boolean;
  hasSession: boolean;
}) {
  const [state, formAction, saving] = useActionState(action, {} as ActionResult);

  /*
   * The push actions are called directly rather than through `useActionState`.
   *
   * `useActionState`'s dispatch returns nothing, so the UI cannot know whether
   * the server accepted the subscription until the *next* render — and by then
   * an optimistic "push is on" has already been shown. Claiming a channel is
   * working before the server has it is the one lie this page must not tell, so
   * the result is awaited directly and the state flips only on success.
   */
  const [pushResult, setPushResult] = useState<ActionResult>({});
  const [busy, setBusy] = useState(false);

  const [emailEnabled, setEmailEnabled] = useState(initial.email_enabled);
  const [telegramEnabled, setTelegramEnabled] = useState(initial.telegram_enabled);
  const [push, setPush] = useState<PushPhase>({ kind: "unknown" });

  /*
   * Reconcile the server's record with the browser's on mount.
   *
   * These two disagree in ordinary situations: the user cleared site data in
   * one browser, or subscribed on a different device. Trusting either alone
   * produces a checkbox that lies, so the browser is authoritative for "is this
   * device subscribed" and the server is authoritative for "should we send".
   */
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const support = await checkPushSupport();
      if (cancelled) return;

      if (!hasSession) {
        setPush({ kind: "unavailable", reason: "unsupported" });
        return;
      }
      if (support.kind === "unavailable") {
        setPush({ kind: "unavailable", reason: support.reason });
        return;
      }
      // Asking before the deployment is configured produces a consent prompt
      // that leads nowhere. Check configuration first.
      if (!pushConfigured || !vapidKey) {
        setPush({ kind: "unavailable", reason: "no-vapid-key" });
        return;
      }

      try {
        const existing = await currentSubscription();
        if (!cancelled) setPush({ kind: existing ? "on" : "off" });
      } catch {
        // No service worker registered and none installable (private browsing
        // in some browsers). Not an error worth surfacing as one.
        if (!cancelled) setPush({ kind: "unavailable", reason: "unsupported" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasSession, pushConfigured, vapidKey]);

  async function turnOnPush() {
    setBusy(true);
    setPush({ kind: "working" });
    try {
      // Must run inside the click to keep the user-gesture requirement satisfied.
      const subscription = await subscribePush(vapidKey!);

      const formData = new FormData();
      formData.set("subscription", JSON.stringify(subscription));
      const result = await subscribeAction({} as ActionResult, formData);

      setPushResult(result);
      setPush(result.error ? { kind: "off" } : { kind: "on" });
    } catch (error) {
      if (error instanceof PushUnsupportedError) {
        setPush({ kind: "unavailable", reason: error.reason });
      } else {
        // An unexpected failure (the subscribe call itself, or a thrown action)
        // leaves the channel off rather than in an unknown state.
        setPush({ kind: "off" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function turnOffPush() {
    setBusy(true);
    setPush({ kind: "working" });
    try {
      await unsubscribePush();
    } catch {
      // The browser half failed; still clear the server half, because a stale
      // server subscription is what produces a 410 storm on future alerts.
    }
    const result = await unsubscribeAction({} as ActionResult, new FormData());
    setPushResult(result);
    setPush({ kind: "off" });
    setBusy(false);
  }

  const unavailable = push.kind === "unavailable" ? push.reason : null;

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="sr-only">Channels</legend>

          <div className="border border-ledger-line bg-paper-raised p-4">
            <Checkbox
              label="Email alerts"
              description="Price drops on tracked products and newly confirmed codes for stores you follow."
              checked={emailEnabled}
              onChange={setEmailEnabled}
            />
          </div>

          {/*
            Push is not a checkbox on purpose. Ticking a box cannot raise a
            permission prompt, and a permission prompt that appears from an
            unrelated interaction is the pattern browsers and users both
            distrust. An explicit button says what is about to happen.
          */}
          <div className="border border-ledger-line bg-paper-raised p-4">
            <p className="text-sm font-medium text-ink">Browser push</p>
            <p className="mt-1 text-sm text-ink-soft">
              {unavailable
                ? PUSH_UNAVAILABLE_COPY[unavailable]
                : push.kind === "on"
                  ? "On for this device. Notifications appear even when this tab is closed."
                  : "A quiet notification from this device, even when the site is closed."}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {push.kind === "on" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void turnOffPush()}
                  disabled={busy}
                >
                  {busy ? "Turning off…" : "Turn off on this device"}
                </Button>
              ) : unavailable ? (
                <span className="font-mono text-xs text-ink-soft">Unavailable</span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void turnOnPush()}
                  disabled={busy || push.kind === "unknown"}
                >
                  {busy ? "Enabling…" : "Turn on for this device"}
                </Button>
              )}
            </div>
          </div>

          <div className="border border-ledger-line bg-paper-raised p-4">
            <Checkbox
              label="Telegram"
              description={
                initial.telegram_enabled
                  ? "Connected. Alerts go to your Telegram chat."
                  : "Not connected. Telegram delivery is available on request — email us from the address you signed up with."
              }
              checked={telegramEnabled}
              onChange={setTelegramEnabled}
            />
          </div>
        </fieldset>

        <input type="hidden" name="email_enabled" value={emailEnabled ? "true" : "false"} />
        <input type="hidden" name="telegram_enabled" value={telegramEnabled ? "true" : "false"} />

        <Button type="submit" loading={saving}>
          {saving ? "Saving…" : "Save preferences"}
        </Button>

        {state?.error && (
          <p
            role="alert"
            className="border border-rust bg-rust-soft px-3 py-2 text-sm text-rust"
          >
            {state.error}
          </p>
        )}
        {state?.message && (
          <p
            role="status"
            className="border border-verified bg-verified-soft px-3 py-2 text-sm text-verified"
          >
            {state.message}
          </p>
        )}
      </form>

      {/*
        Push outcomes get their own alert/status regions rather than sharing the
        preference form's. Folding them into one region would make "preferences
        saved" and "notifications enabled" indistinguishable, and a separate
        live region duplicating the copy above it would just double every
        announcement.
      */}
      {pushResult.error && (
        <p role="alert" className="border border-rust bg-rust-soft px-3 py-2 text-sm text-rust">
          {pushResult.error}
        </p>
      )}
      {pushResult.message && (
        <p
          role="status"
          className="border border-verified bg-verified-soft px-3 py-2 text-sm text-verified"
        >
          {pushResult.message}
        </p>
      )}
    </div>
  );
}
