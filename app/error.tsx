"use client";

import ErrorState from "@/components/ErrorState";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <ErrorState reset={reset} />
    </div>
  );
}
