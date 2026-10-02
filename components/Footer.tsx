import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-ledger-line">
      <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-ink-soft">
        <p className="max-w-md">
          We disclose the commission on every deal page, and we never touch another
          creator&apos;s referral link. <Link href="/trust" className="text-inkblue underline underline-offset-2">Read the full policy.</Link>
        </p>
      </div>
    </footer>
  );
}
