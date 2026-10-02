import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";

import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How this works",
  description: "How Couponza verifies deals and discloses commissions.",
  alternates: { canonical: absoluteUrl("/trust") },
  openGraph: { title: "How this works", url: absoluteUrl("/trust") },
};

const PLEDGES = [
  {
    title: "Every code is community-confirmed, not just scraped",
    body: "Anyone can report whether a code worked. The success rate you see on a deal page is that real, running tally — not a guess and not paid placement.",
  },
  {
    title: "We disclose what we earn, on the page itself",
    body: "If a deal pays us a commission, that's stated on its page — not buried in a footer. It never changes the price you pay.",
    id: "commissions",
  },
  {
    title: "We never touch another creator's referral link",
    body: "Some browser extensions have been caught replacing other people's affiliate links with their own at checkout. We don't run a browser extension, and we never will do that.",
  },
];

async function loadExtendedPolicy() {
  try {
    return await api.getPageBySlug("trust-center");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export default async function TrustPage() {
  const extendedPolicy = await loadExtendedPolicy();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-serif text-3xl text-ink">How this works</h1>
      <p className="mt-3 text-ink-soft">
        Three things we commit to, whether or not anyone&apos;s checking.
      </p>

      <div className="mt-10 space-y-8">
        {PLEDGES.map((pledge) => (
          <div key={pledge.title} id={"id" in pledge ? (pledge as { id?: string }).id : undefined} className="border-t border-ledger-line pt-6">
            <h2 className="font-serif text-xl text-ink">{pledge.title}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{pledge.body}</p>
          </div>
        ))}
      </div>

      {extendedPolicy && (
        <div className="mt-10 border-t border-ledger-line pt-6">
          <h2 className="font-serif text-xl text-ink">{extendedPolicy.title}</h2>
          <div
            className="prose-sm mt-2 leading-relaxed text-ink-soft"
            // Content is authored by admins/editors through our own admin panel, not
            // arbitrary user input — same trust boundary as the rest of the CMS.
            dangerouslySetInnerHTML={{ __html: extendedPolicy.content }}
          />
        </div>
      )}
    </div>
  );
}
