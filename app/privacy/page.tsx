import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Couponbase handles your data.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-serif text-3xl text-ink">Privacy</h1>
      <div className="mt-6 space-y-4 text-ink-soft">
        <p>
          We collect the minimum needed to run the service: your account email, the stores and
          products you save or track, and your notification preferences.
        </p>
        <p>
          Coupon votes and outbound clicks are logged with a <em>salted one-way hash</em> of your IP
          address, never the raw address. We forget even that hash after 90 days; the click itself
          stays (without you in it) so we can tell which deals actually help shoppers.
        </p>
        <p>
          When you click through to a store, we add a random reference to the link so the store&apos;s
          affiliate network can tell us a purchase came from Couponbase. That reference identifies the
          click, not you, and your IP address is never shared with merchants or affiliate networks.
        </p>
        <p>
          We do not sell personal data, and we do not profile you for advertising. Deal rankings are
          driven by verification evidence, not by your browsing trail.
        </p>
      </div>
    </article>
  );
}
