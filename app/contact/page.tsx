import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach the Couponbase team.",
};

export default function ContactPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink">Contact</h1>
      <p className="mt-4 text-ink-soft">
        Questions, corrections, or a store you&apos;d like listed? Reach us at{" "}
        <a href="mailto:hello@couponbase.example" className="text-inkblue underline underline-offset-2">
          hello@couponbase.example
        </a>
        . If a coupon on our site didn&apos;t work, the fastest fix is the{" "}
        <em>&quot;didn&apos;t work&quot;</em> button on its page — it updates the success rate
        everyone sees.
      </p>
    </article>
  );
}
