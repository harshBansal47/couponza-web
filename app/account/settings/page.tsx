import type { Metadata } from "next";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import ProfileForm from "@/components/account/ProfileForm";
import DeleteAccountForm from "@/components/account/DeleteAccountForm";
import { requireAccount, updateProfileAction, deleteAccountAction } from "@/app/account/actions";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Account settings",
  description: "Your display name, password and data choices.",
  alternates: { canonical: absoluteUrl("/account/settings") },
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const { user } = await requireAccount();

  return (
    <AccountShell user={user} active="/account/settings">
      <h2 className="font-serif text-xl text-ink">Settings</h2>

      <section className="mt-6">
        <h3 className="text-sm uppercase tracking-wider text-ink-soft">Profile</h3>
        <div className="mt-3">
          <ProfileForm action={updateProfileAction} user={user} />
        </div>
      </section>

      <section className="mt-10 border-t border-ledger-line pt-6">
        <h3 className="text-sm uppercase tracking-wider text-ink-soft">Your data</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-ink-soft">Account created</dt>
            <dd className="font-mono text-xs text-ink">{new Date(user.created_at).toISOString().slice(0, 10)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-ink-soft">Verification history</dt>
            <dd className="text-ink">
              Every worked / did-not-work report you have submitted is public, attached to the
              coupon it describes. That is what makes the success rate meaningful.
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-ink-soft">
          To delete your account and everything attached to it, use the button below. We remove
          saved stores, tracked products and alert history; your coupon verification reports stay,
          without the account attached, because removing them would make other people&apos;s
          success rates less honest.
        </p>
        <DeleteAccountForm action={deleteAccountAction} user={user} />
      </section>

      <section className="mt-10 border-t border-ledger-line pt-6">
        <h3 className="text-sm uppercase tracking-wider text-ink-soft">Alerts</h3>
        <p className="mt-3 text-sm text-ink-soft">
          <Link href="/account/notifications" className="text-inkblue hover:underline">
            Choose your channels
          </Link>{" "}
          or{" "}
          <Link href="/account/unsubscribe" className="text-inkblue hover:underline">
            turn email off entirely
          </Link>
          .
        </p>
      </section>
    </AccountShell>
  );
}