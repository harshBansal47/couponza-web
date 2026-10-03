"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { CouponPublic } from "@/lib/types";

const CONFETTI_COLORS = ["#ff6a1a", "#ffc933", "#4f46e5", "#ff4d8d", "#0f9d58", "#7c3aed"];

/** A small fixed set of pieces; offsets are spread by index so no randomness is needed at render. */
const PIECES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 60 + (i % 3) * 22;
  return {
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist) - 20,
    rot: 180 + i * 37,
  };
});

export default function CouponCodePanel({ coupon }: { coupon: CouponPublic }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [burst, setBurst] = useState(0);

  async function handleCopy() {
    if (!coupon.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setBurst((n) => n + 1);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail (permissions, insecure context); the code is
      // still visible on screen, so this isn't a dead end, just a lost nicety.
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-ledger-line bg-white shadow-[var(--shadow-raised)]">
      <div className="bg-brand relative px-5 py-2 text-xs font-semibold text-white">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
        <span className="relative">{coupon.code ? "Your code" : "Auto-applied deal"}</span>
      </div>

      <div className="relative flex items-center justify-between gap-4 px-5 py-5">
        <div
          className={`min-w-0 flex-1 rounded-xl border-2 border-dashed px-4 py-3 text-center font-mono text-xl font-semibold tracking-widest transition-colors ${
            revealed ? "border-inkblue/50 bg-inkblue/5 text-inkblue" : "border-ledger-line bg-paper text-ink"
          }`}
        >
          {coupon.code ? (
            revealed ? (
              <span key="code" className="animate-pop inline-block break-all">
                {coupon.code}
              </span>
            ) : (
              <span aria-hidden className="select-none blur-sm">
                {"• • • • • •"}
              </span>
            )
          ) : (
            <span className="text-sm font-medium tracking-normal text-ink-soft">
              No code needed — discount applies at checkout
            </span>
          )}
          {!revealed && coupon.code && <span className="sr-only">Code hidden until revealed</span>}
        </div>

        {coupon.code && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => (revealed ? handleCopy() : setRevealed(true))}
              className={`btn ${copied ? "btn-verified" : "btn-primary"} min-w-[7.5rem]`}
            >
              {revealed ? (copied ? "Copied" : "Copy code") : "Reveal code"}
            </button>
            {/* Confetti: remounted via key on every successful copy. */}
            {burst > 0 && (
              <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
                {PIECES.map((p) => (
                  <span
                    key={p.id}
                    className="confetti-piece"
                    style={
                      {
                        "--c": p.color,
                        "--x": `${p.x}px`,
                        "--y": `${p.y}px`,
                        "--rot": `${p.rot}deg`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        <a href={api.goUrl(coupon.id)} className="btn btn-cta w-full py-3 text-base">
          Get this deal at the store
        </a>
        <p className="mt-2 text-center text-xs text-ink-soft">Opens the store. Come back and tell us if the code worked.</p>
      </div>
    </div>
  );
}
