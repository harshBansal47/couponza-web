export default function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-7 w-1.5 rounded-full bg-gradient-to-b from-inkblue to-pink" />
        <h2 className="font-serif text-2xl font-extrabold text-ink sm:text-3xl">{children}</h2>
      </div>
      {hint ? (
        <span className="shrink-0 rounded-full bg-inkblue/10 px-3 py-1 text-xs font-semibold text-inkblue">{hint}</span>
      ) : null}
    </div>
  );
}
