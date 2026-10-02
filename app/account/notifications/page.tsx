import type { Metadata } from "next";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import NotificationSettings from "@/components/account/NotificationSettings";
import {
  loadPushKey,
  requireAccount,
  subscribePushAction,
  unsubscribePushAction,
  updatePreferencesAction,
} from "@/app/account/actions";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Notification settings",
  description: "Choose how Couponza reaches you about price drops and confirmed codes.",
  alternates: { canonical: absoluteUrl("/account/notifications") },
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const { user, prefs } = await requireAccount();

  /*
   * Read on the server rather than fetched from the client.
   *
   * The key has to reach the browser either way, but fetching it there means the
   * push row renders as "unsupported", then "off", then "on" as three separate
   * states on first paint. Deciding it server-side collapses that to one correct
   * answer, and keeps the API as the single source of truth for a value that
   * changes when someone rotates their VAPID keys.
   */
  const pushKey = await loadPushKey();

  return (
    <AccountShell user={user} active="/account/notifications">
      <h2 className="font-serif text-xl text-ink">Notifications</h2>
      <p className="mt-2 max-w-prose text-sm text-ink-soft">
        Pick how you hear about a price drop or a newly confirmed code. Turning everything off is a
        legitimate choice and nothing on the site will nag you about it.
      </p>

      <div className="mt-6 max-w-prose">
        <NotificationSettings
          action={updatePreferencesAction}
          subscribeAction={subscribePushAction}
          unsubscribeAction={unsubscribePushAction}
          initial={{
            email_enabled: prefs.email_enabled,
            // The checkbox is gone; push state comes from the browser. Kept only
            // so the Telegram row below can describe the account as a whole.
            push_enabled: prefs.push_enabled,
            telegram_enabled: prefs.telegram_enabled,
          }}
          vapidKey={pushKey.public_key}
          pushConfigured={pushKey.enabled}
          hasSession
        />
      </div>

      <p className="mt-8 max-w-prose border-t border-ledger-line pt-4 text-xs text-ink-soft">
        Every alert is also recorded in{" "}
        <Link href="/account/alerts" className="text-inkblue hover:underline">
          your alert history
        </Link>
        , whether or not it was delivered.
      </p>
    </AccountShell>
  );
}
