import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/account/AuthForms";
import { registerAction } from "@/app/account/actions";
import { getSessionUser } from "@/lib/session";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free Couponbase account to track prices and get alerted when codes are confirmed.",
  alternates: { canonical: absoluteUrl("/account/register") },
  robots: { index: false, follow: true },
};

function safeNext(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return undefined;
  return raw;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  const user = await getSessionUser();
  if (user) {
    const { redirect } = await import("next/navigation");
    redirect(next ?? "/account");
  }

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="font-serif text-3xl text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Save the stores you use, follow a product, and we will email you when its price drops or a
        code is confirmed working.
      </p>

      <div className="mt-8">
        <RegisterForm action={registerAction} next={next} />
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Already registered?{" "}
        <Link
          href={next ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login"}
          className="text-inkblue hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-6 border-t border-ledger-line pt-4 text-xs text-ink-soft">
        We email you when something you asked about changes. Nothing else, and no selling your
        address. Turn alerts off at any time from{" "}
        <Link href="/account/notifications" className="text-inkblue hover:underline">
          notification settings
        </Link>
        .
      </p>
    </main>
  );
}