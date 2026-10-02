import type { Metadata } from "next";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import { requireAccount } from "@/app/account/actions";
import { formatRelativeTime } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import type { AlertKind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Alert history",
  description: "Every price-drop and coupon alert Couponza has sent you.",
  alternates: { canonical: absoluteUrl("/account/alerts") },
  robots: { index: false, follow: false },
};

const KIND_LABEL: Record<AlertKind, string> = {
  price_drop: "Price drop",
  coupon_appeared: "New code",
  target_met: "Target reached",
};

export default async function AlertsPage() {
  const { user, alerts } = await requireAccount();

  const sent = alerts.filter((a) => a.sent_at !== null);
  const pending = alerts.filter((a) => a.sent_at === null);

  return (
    <AccountShell user={user} active="/account/alerts" counts={{ "/account/alerts": sent.length }}>
      <h2 className="font-serif text-xl text-ink">Alert history</h2>

      {alerts.length === 0 ? (
        <div className="mt-6 border border-dashed border-ledger-line px-6 py-12 text-center">
          <p className="font-serif text-lg text-ink">No alerts yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Once you follow a store or track a product, every alert we send lands here so you can
            see what you already know about.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-ledger-line border-y border-ledger-line">
          {alerts.map((alert) => (
            <li key={alert.id} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
              <div className="min-w-0">
                <span className="mr-2 rounded-sm border border-ledger-line bg-paper px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                  {KIND_LABEL[alert.kind] ?? alert.kind}
                </span>
                <p className="text-sm text-ink">{alert.message}</p>
              </div>
              <span className="font-mono text-xs text-ink-soft">
                {formatRelativeTime(alert.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {pending.length > 0 && (
        <p className="mt-4 text-xs text-ink-soft">
          {pending.length} alert{pending.length === 1 ? " is" : "s are"} queued for delivery. They
          appear here whether or not the send succeeded.
        </p>
      )}

      <p className="mt-8 text-sm text-ink-soft">
        Not getting enough? Adjust what you hear about in{" "}
        <Link href="/account/notifications" className="text-inkblue hover:underline">
          notification settings
        </Link>
        .
      </p>
    </AccountShell>
  );
}