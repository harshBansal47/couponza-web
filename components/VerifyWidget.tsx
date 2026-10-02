"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import type { CouponPublic } from "@/lib/types";

type Stats = Pick<CouponPublic, "success_count" | "fail_count" | "last_verified_at" | "success_rate">;

export default function VerifyWidget({ coupon }: { coupon: CouponPublic }) {
  const [stats, setStats] = useState<Stats>({
    success_count: coupon.success_count,
    fail_count: coupon.fail_count,
    last_verified_at: coupon.last_verified_at,
    success_rate: coupon.success_rate,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "limited">("idle");

  async function report(worked: boolean) {
    if (status === "sending") return;
    setStatus("sending");
    try {
      const updated = await api.verifyCoupon(coupon.id, worked);
      setStats(updated);
      setStatus("done");
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 429 ? "limited" : "idle");
    }
  }

  const total = stats.success_count + stats.fail_count;

  return (
    <div className="rounded-md border border-ledger-line px-4 py-4">
      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-ink-soft">Success rate</dt>
          <dd className="font-mono text-base text-ink">
            {stats.success_rate !== null ? `${Math.round(stats.success_rate * 100)}%` : "No reports yet"}
            {total > 0 && (
              <span className="text-ink-soft">
                {" "}
                ({total} report{total === 1 ? "" : "s"})
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-ink-soft">Last confirmed</dt>
          <dd className="font-mono text-base text-ink">{formatRelativeTime(stats.last_verified_at)}</dd>
        </div>
      </dl>

      {status === "done" ? (
        <p className="text-sm text-verified">Thanks — that helps the next person.</p>
      ) : status === "limited" ? (
        <p className="text-sm text-ink-soft">You&apos;ve already reported on this one recently.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-ink-soft">Did this work for you?</span>
          <button
            type="button"
            onClick={() => report(true)}
            disabled={status === "sending"}
            className="rounded-sm border border-verified px-3 py-1.5 text-sm text-verified transition-colors hover:bg-verified-soft disabled:opacity-50"
          >
            Worked
          </button>
          <button
            type="button"
            onClick={() => report(false)}
            disabled={status === "sending"}
            className="rounded-sm border border-rust px-3 py-1.5 text-sm text-rust transition-colors hover:bg-rust-soft disabled:opacity-50"
          >
            Didn&apos;t work
          </button>
        </div>
      )}
    </div>
  );
}
