"use client";

import { useEffect, useRef } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    (ref.current?.querySelector("button, [href], input, select, textarea") as HTMLElement | null)?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={ref} className="w-full max-w-md border border-ledger-line bg-paper p-6 shadow-[var(--shadow-overlay)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="btn btn-ghost px-2 py-1">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
