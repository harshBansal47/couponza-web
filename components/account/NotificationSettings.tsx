"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Select";
import type { ActionResult } from "@/app/account/actions";

/**
 * Notification preferences, including browser push.
 *
 * Push needs an explicit permission prompt — a subscription request without one
 * always rejects — so the toggle is only offered once the browser grants it. The
 * subscription is stashed in a hidden field and submitted with the form, which
 * keeps the whole thing one Server Action rather than a second round-trip.
 */

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Saving…" : "Save preferences"}
    </Button>
  );
}

/**
 * VAPID keys arrive URL-safe base64; `applicationServerKey` wants raw bytes.
 * Allocating through `new ArrayBuffer` keeps the result a plain `ArrayBuffer`
 * rather than a possibly-shared one, which is what the DOM types expect.
 */
function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalised);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buffer;
}

type PushState =
  | { kind: "unsupported" }
  | { kind: "off" }
  | { kind: "asking" }
  | { kind: "denied" }
  | { kind: "ready"; subscription: unknown };

export default function NotificationSettings({
  action,
  initial,
  hasSession,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  initial: {
    email_enabled: boolean;
    push_enabled: boolean;
    telegram_enabled: boolean;
  };
  hasSession: boolean;
}) {
  const [state, formAction] = useActionState(action, {} as ActionResult);
  const [push, setPush] = useState<PushState>(() =>
    typeof window !== "undefined" && !("serviceWorker" in navigator)
      ? { kind: "unsupported" }
      : { kind: "off" },
  );
  const [subscriptionJson, setSubscriptionJson] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(initial.email_enabled);
  const [telegramEnabled, setTelegramEnabled] = useState(initial.telegram_enabled);
  const [pushEnabled, setPushEnabled] = useState(initial.push_enabled);

  async function enablePush() {
    if (!VAPID_KEY) {
      setPush({ kind: "off" });
      return;
    }
    setPush({ kind: "asking" });
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush({ kind: "denied" });
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(VAPID_KEY),
      });
      setSubscriptionJson(JSON.stringify(subscription));
      setPush({ kind: "ready", subscription });
      setPushEnabled(true);
    } catch {
      // Private mode, no service worker, or a blocked permission prompt. The
      // email toggle stays available, so this is not a dead end.
      setPush({ kind: "off" });
    }
  }

  return (
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

        <div className="border border-ledger-line bg-paper-raised p-4">
          <Checkbox
            label="Browser push"
            description={
              push.kind === "unsupported"
                ? "This browser does not support web push."
                : push.kind === "denied"
                  ? "Your browser is blocking notifications for this site. Email alerts still work."
                  : "A quiet notification from this tab, even when it is in the background."
            }
            checked={pushEnabled}
            disabled={push.kind === "unsupported" || push.kind === "denied"}
            onChange={(next) => {
              setPushEnabled(next);
              // Turning push on without a subscription would silently fail on the
              // server, so always ask the browser first.
              if (next && !subscriptionJson) void enablePush();
              if (!next) setSubscriptionJson("");
            }}
          />
          <input type="hidden" name="push_subscription" value={subscriptionJson} />

          {push.kind === "off" && (
            <button
              type="button"
              onClick={() => void enablePush()}
              className="mt-3 text-sm text-inkblue hover:underline"
            >
              Enable browser push
            </button>
          )}
          {push.kind === "ready" && (
            <p role="status" className="mt-3 text-xs text-verified">
              Push is enabled on this device.
            </p>
          )}
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
            disabled={!hasSession || !initial.telegram_enabled}
            onChange={setTelegramEnabled}
          />
        </div>
      </fieldset>

      <input type="hidden" name="email_enabled" value={emailEnabled ? "true" : "false"} />
      <input type="hidden" name="push_enabled" value={pushEnabled ? "true" : "false"} />
      <input type="hidden" name="telegram_enabled" value={telegramEnabled ? "true" : "false"} />

      <SubmitButton />

      {state?.error && (
        <p role="alert" className="border border-rust bg-rust-soft px-3 py-2 text-sm text-rust">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="border border-verified bg-verified-soft px-3 py-2 text-sm text-verified">
          {state.message}
        </p>
      )}
    </form>
  );
}