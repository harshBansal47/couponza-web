import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/account/AuthForms";
import { loginAction } from "@/app/account/actions";
import { getSessionUser } from "@/lib/session";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Couponbase account to see saved deals and tracked prices.",
  alternates: { canonical: absoluteUrl("/account/login") },
  // Account pages are per-user; keep them out of the index.
  robots: { index: false, follow: true },
};

/** Reads `next` defensively — it comes straight from the URL. */
function safeNext(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return undefined;
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  // Already signed in? Go straight through rather than showing a dead form.
  const user = await getSessionUser();
  if (user) {
    const { redirect } = await import("next/navigation");
    redirect(next ?? "/account");
  }

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="font-serif text-3xl text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {next
          ? "Sign in to continue where you left off."
          : "Your saved stores, followed products and alert history live here."}
      </p>

      <div className="mt-8">
        <LoginForm action={loginAction} next={next} />
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        No account yet?{" "}
        <Link
          href={next ? `/account/register?next=${encodeURIComponent(next)}` : "/account/register"}
          className="text-inkblue hover:underline"
        >
          Create one
        </Link>
      </p>
    </main>
  );
}