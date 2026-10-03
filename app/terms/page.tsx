import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "The rules of using Couponbase.",
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink">Terms</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          Couponbase lists offers from third-party merchants. We verify them community-wide but cannot
          guarantee every code will work at every checkout — that is what the success-rate evidence on
          each page is for.
        </p>
        <p>
          Prices and availability change quickly. The price history we show is as-reported and may lag
          the merchant&apos;s live price by hours.
        </p>
        <p>
          We earn affiliate commissions on some offers. Those pages say so, and commission size never
          changes how we rank or verify a deal.
        </p>
      </div>
    </article>
  );
}
