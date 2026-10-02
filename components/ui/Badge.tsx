export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "verified" | "rust" | "info";
}) {
  const tones = {
    neutral: "border-ledger-line text-ink-soft",
    verified: "border-verified text-verified",
    rust: "border-rust text-rust",
    info: "border-inkblue text-inkblue",
  };
  return (
    <span className={`inline-block border px-2 py-0.5 font-mono text-xs uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}
