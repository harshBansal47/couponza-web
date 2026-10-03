import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/account/AuthForms";
import { forgotPasswordAction } from "@/app/account/actions";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset email for your Couponbase account.",
  alternates: { canonical: absoluteUrl("/account/forgot-password") },
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
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
          <h1 className="font-serif text-3xl text-ink">Forgot password</h1>
          <p className="mt-2 text-ink-soft">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </header>

        <ForgotPasswordForm action={forgotPasswordAction} />

        <p className="mt-6 text-center text-sm text-ink-soft">
          Remember your password?{" "}
          <Link href="/account/login" className="text-inkblue hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-ink-soft">
          Don&apos;t have an account?{" "}
          <Link href="/account/register" className="text-inkblue hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}