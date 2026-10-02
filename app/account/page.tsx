import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Couponza accounts — saved deals, tracked prices and alerts.",
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink">Your Couponza account</h1>
      <p className="mt-4 text-ink-soft">
        Accounts give you saved stores, saved coupons, tracked products with price-drop alerts, and
        notification preferences (email, Telegram, browser push). The account endpoints are live on
        the API — the sign-in and tracking UI is being built next.
      </p>
      <p className="mt-4 text-ink-soft">
        Until then, API users can register at{" "}
        <code className="border border-ledger-line bg-paper-raised px-1.5 py-0.5 font-mono text-xs">
          POST /api/v1/auth/register
        </code>{" "}
        and use the{" "}
        <code className="border border-ledger-line bg-paper-raised px-1.5 py-0.5 font-mono text-xs">/api/v1/me</code>{" "}
        endpoints directly.
      </p>
    </div>
  );
}
