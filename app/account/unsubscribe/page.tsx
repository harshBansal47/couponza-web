import type { Metadata } from "next";
import Link from "next/link";
import UnsubscribeForm from "@/components/account/UnsubscribeForm";
import { unsubscribeAction } from "@/app/account/actions";
import { getAccessToken } from "@/lib/session";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Turn off email alerts",
  description: "Stop Couponza email alerts without signing in.",
  alternates: { canonical: absoluteUrl("/account/unsubscribe") },
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage() {
  // Prefill from the session when there is one, but do not require it — this
  // page is reached from a link in an alert email.
  const token = await getAccessToken();
  let email = "";
  if (token) {
    try {
      const { api } = await import("@/lib/api");
      email = (await api.me(token)).email;
    } catch {
      email = "";
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="font-serif text-3xl text-ink">Turn off email alerts</h1>
      <p className="mt-2 text-ink-soft">
        {email
          ? "This will stop email alerts for your account. Everything else on Couponza keeps working."
          : "Enter the address you receive Couponza alerts at and we will stop emailing it. You can turn alerts back on at any time."}
      </p>

      <div className="mt-8">
        <UnsubscribeForm action={unsubscribeAction} initialEmail={email} />
      </div>

      <p className="mt-8 text-sm text-ink-soft">
        <Link href="/account/notifications" className="text-inkblue hover:underline">
          Fine-tune which channels you hear from
        </Link>
      </p>
    </main>
  );
}