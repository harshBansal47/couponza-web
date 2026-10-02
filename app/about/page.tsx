import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "What Couponza is and why it exists.",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink">About Couponza</h1>
      <div className="prose-couponza mt-6 space-y-4 text-ink-soft">
        <p>
          Couponza is a deals platform built on one idea: a discount should be <em>evidence</em>, not
          marketing. Every code on the site carries a real success rate from people who actually tried it,
          and every commission we earn is disclosed right on the page.
        </p>
        <p>
          We&apos;re building toward a different kind of shopping assistant — one that can answer
          &quot;what&apos;s the cheapest legitimate way to buy this?&quot; with price history, verified
          coupons and honest math, instead of a wall of untested promotional percentages.
        </p>
        <h2 className="pt-4 font-serif text-xl text-ink">What we will not do</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>We will not rank a deal higher because a merchant paid us more.</li>
          <li>We will not hijack another creator&apos;s referral link.</li>
          <li>We will not show a success rate we don&apos;t have evidence for.</li>
        </ul>
      </div>
    </article>
  );
}
