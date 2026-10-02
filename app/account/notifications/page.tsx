import type { Metadata } from "next";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import NotificationSettings from "@/components/account/NotificationSettings";
import { requireAccount, updatePreferencesAction } from "@/app/account/actions";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Notification settings",
  description: "Choose how Couponza reaches you about price drops and confirmed codes.",
  alternates: { canonical: absoluteUrl("/account/notifications") },
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const { user, prefs } = await requireAccount();

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
          initial={{
            email_enabled: prefs.email_enabled,
            push_enabled: prefs.push_enabled,
            telegram_enabled: prefs.telegram_enabled,
          }}
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