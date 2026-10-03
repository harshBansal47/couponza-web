import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/account/AuthForms";
import { resetPasswordAction } from "@/app/account/actions";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your Couponbase account.",
  alternates: { canonical: absoluteUrl("/account/reset-password") },
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-ledger-bg">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-2xl text-ink">Invalid reset link</h1>
          <p className="mt-3 text-ink-soft">
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <Link
            href="/account/forgot-password"
            className="mt-4 inline-block text-inkblue hover:underline"
          >
            Request a new reset link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-ledger-bg">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-ink hover:opacity-80 mb-6">
            <svg
              className="w-8 h-8 text-inkblue"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth={2} />
              <path d="M2 17l10 5 10-5" strokeWidth={2} />
              <path d="M2 12l10 5 10-5" strokeWidth={2} />
            </svg>
            <span className="font-serif text-2xl">Couponbase</span>
          </Link>
          <h1 className="font-serif text-3xl text-ink">Reset password</h1>
          <p className="mt-2 text-ink-soft">
            Enter your new password below. It must be at least 8 characters.
          </p>
        </header>

        <ResetPasswordForm action={resetPasswordAction} token={token} />

        <p className="mt-6 text-center text-sm text-ink-soft">
          Remember your password?{" "}
          <Link href="/account/login" className="text-inkblue hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}