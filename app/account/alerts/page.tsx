import type { Metadata } from "next";
import Link from "next/link";
import AccountShell from "@/components/account/AccountShell";
import { requireAccount } from "@/app/account/actions";
import { formatRelativeTime } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import type { AlertEvent, AlertKind } from "@/lib/types";

export const metadata: Metadata = {
  title: "Alert history",
  description: "Every price-drop and coupon alert Couponbase has sent you.",
  alternates: { canonical: absoluteUrl("/account/alerts") },
  robots: { index: false, follow: false },
};

const KIND_LABEL: Record<AlertKind, string> = {
  price_drop: "Price drop",
  coupon_appeared: "New code",
  target_met: "Target reached",
};

const CHANNEL_LABEL: Record<string, string> = {
  email: "Email",
  push: "Push",
  telegram: "Telegram",
};

/**
 * Group by alert, not by row.
 *
 * Each alert that fires on three channels is three rows in this list, because
 * each row is a delivery *attempt*. Showing them flat would tell a user with
 * three channels enabled that they got the same news four times, which is
 * precisely the impression this page exists to correct.
 */
function groupByAlert(events: AlertEvent[]): { key: string; event: AlertEvent; attempts: AlertEvent[] }[] {
  const groups = new Map<string, AlertEvent[]>();
  for (const event of events) {
    // The price point is what makes an alert an alert, so it is the natural
    // identity: every channel of the same alert shares it.
    const key = `${event.price_point_id ?? event.id}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(event);
    else groups.set(key, [event]);
  }
  return [...groups.entries()].map(([key, attempts]) => ({ key, event: attempts[0]!, attempts }));
}

export default async function AlertsPage() {
  const { user, alerts } = await requireAccount();

  const groups = groupByAlert(alerts);
  const failedAttempts = alerts.filter((a) => !a.delivered);

  return (
    <AccountShell user={user} active="/account/alerts" counts={{ "/account/alerts": groups.length }}>
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
          {groups.map(({ key, event, attempts }) => (
            <li key={key} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
              <div className="min-w-0">
                <span className="mr-2 rounded-sm border border-ledger-line bg-paper px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                  {KIND_LABEL[event.kind] ?? event.kind}
                </span>
                <p className="text-sm text-ink">{event.detail ?? "An alert was raised."}</p>
                {/*
                  The per-channel delivery state is shown even when everything
                  worked, not only on failure. A user who cannot tell whether an
                  alert arrived will eventually stop trusting that we send them.
                */}
                {attempts.length > 1 && (
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ink-soft">
                    {attempts.map((attempt) => (
                      <span
                        key={attempt.id}
                        className={attempt.delivered ? undefined : "text-rust"}
                      >
                        {CHANNEL_LABEL[attempt.channel] ?? attempt.channel}
                        {attempt.delivered ? "" : " — not delivered"}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <span className="font-mono text-xs text-ink-soft">
                {formatRelativeTime(event.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {failedAttempts.length > 0 && (
        <p className="mt-4 text-xs text-ink-soft">
          {failedAttempts.length} delivery attempt{failedAttempts.length === 1 ? "" : "s"} did not
          arrive. They are listed above rather than hidden, because a bounced address or a
          withdrawn browser permission is something only you can fix.
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
