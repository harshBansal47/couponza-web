const STEPS = [
  { glyph: "🔎", title: "Find a deal", body: "Search a store or product. Codes are listed with their real success rate, best first." },
  { glyph: "🎟️", title: "Reveal and copy", body: "One tap reveals the code. Copy it, then head to the store through our link." },
  { glyph: "✅", title: "Tell us if it worked", body: "Your report updates the success rate for the next shopper. Dead codes drop away." },
];

/** A real sequence, so the numbered steps are meaningful here. */
export default function HowItWorks() {
  return (
    <ol className="relative grid gap-5 md:grid-cols-3">
      <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-9 hidden border-t-2 border-dashed border-inkblue/30 md:block" />
      {STEPS.map((s, i) => (
        <li key={s.title} className="lift relative rounded-[22px] border border-ledger-line bg-white p-6 text-center shadow-[var(--shadow-hairline)]">
          <span className="bg-brand relative mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[22px] text-3xl shadow-[var(--shadow-glow)]">
            <span aria-hidden="true">{s.glyph}</span>
            <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-sun font-serif text-sm font-extrabold text-ink">
              {i + 1}
            </span>
          </span>
          <h3 className="mt-4 font-serif text-lg font-bold text-ink">{s.title}</h3>
          <p className="mt-1.5 text-sm text-ink-soft">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
