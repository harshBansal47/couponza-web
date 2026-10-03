import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Couponbase works",
  description: "From sourcing to verification to disclosure — how the platform works.",
};

const STEPS: [string, string][] = [
  ["Where coupons come from", "Offers arrive from our sources — feeds, imports and staff curation — and flow through one pipeline: normalize, dedupe, validate."],
  ["How we verify them", "Each offer is structurally validated, optionally probed live, and then checked by real shoppers. Worked/didn't-work votes set the success rate you see."],
  ["How users report results", "One vote per visitor per coupon per day, keyed by a salted IP hash — real signal, no raw tracking."],
  ["How commissions work", "Some links earn us a commission. Every page says so, and commission size never changes rankings."],
  ["What Couponbase does NOT do", "We don't sell your data, don't rank by merchant spend, and don't hijack another creator's referral link."],
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink">How Couponbase works</h1>
      <ol className="mt-10 space-y-8 border-l border-ledger-line pl-8">
        {STEPS.map(([title, body], i) => (
          <li key={title}>
            <p className="font-mono text-xs uppercase tracking-widest text-verified">{i + 1} / {STEPS.length}</p>
            <h2 className="mt-1 font-serif text-xl text-ink">{title}</h2>
            <p className="mt-2 text-ink-soft">{body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-12 text-ink-soft">
        Read the full version on the{" "}
        <Link href="/trust" className="text-inkblue underline underline-offset-2">trust page</Link>.
      </p>
    </div>
  );
}
