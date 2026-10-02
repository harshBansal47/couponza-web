export default function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-5 flex items-baseline justify-between border-b border-ledger-line pb-2">
      <h2 className="font-serif text-xl text-ink">{children}</h2>
      {hint ? <span className="text-xs text-ink-soft">{hint}</span> : null}
    </div>
  );
}
