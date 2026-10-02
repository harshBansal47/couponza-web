"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { CouponPublic } from "@/lib/types";

export default function CouponCodePanel({ coupon }: { coupon: CouponPublic }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!coupon.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context); the code is
      // still visible on screen, so this isn't a dead end, just a lost nicety.
    }
  }

  return (
    <div className="rounded-md border border-ledger-line bg-paper-raised">
      <div className="perforated-bottom flex items-center justify-between gap-4 px-5 py-5">
        <div className="font-mono text-lg tracking-wide text-ink">
          {coupon.code ? (
            revealed ? (
              <span>{coupon.code}</span>
            ) : (
              <span aria-hidden className="select-none blur-sm">
                {"• • • • • •"}
              </span>
            )
          ) : (
            <span className="text-sm text-ink-soft">No code needed — discount applies at checkout</span>
          )}
          {!revealed && coupon.code && <span className="sr-only">Code hidden until revealed</span>}
        </div>
        {coupon.code && (
          <button
            type="button"
            onClick={() => (revealed ? handleCopy() : setRevealed(true))}
            className="shrink-0 rounded-sm border border-ink px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            {revealed ? (copied ? "Copied" : "Copy code") : "Reveal code"}
          </button>
        )}
      </div>
      <div className="px-5 pt-4 pb-5">
        <a
          href={api.goUrl(coupon.id)}
          className="block w-full rounded-sm bg-verified px-4 py-3 text-center font-medium text-paper transition-opacity hover:opacity-90"
        >
          Get this deal at the store
        </a>
      </div>
    </div>
  );
}
