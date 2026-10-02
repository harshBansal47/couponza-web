"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Inline editor for a tracked product's target price.
 *
 * Kept deliberately small: the value is only committed on submit, so a stray
 * keystroke cannot fire a write per character.
 */
export default function TrackedPriceEditor({
  trackedId,
  currency,
  currentTarget,
  currentPrice,
  action,
}: {
  trackedId: string;
  currency: string;
  currentTarget: number | null;
  currentPrice: number | null;
  action: (
    trackedId: string,
    targetPrice: string,
  ) => Promise<{ error?: string; message?: string }>;
}) {
  const [value, setValue] = useState(currentTarget === null ? "" : String(currentTarget));
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(next: string) {
    startTransition(async () => {
      setError(null);
      setSaved(null);
      const result = await action(trackedId, next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setValue(next);
      setSaved(result.message ?? "Saved");
    });
  }

  const inputId = `target-${trackedId}`;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(value);
      }}
      className="mt-3 flex flex-wrap items-end gap-2"
    >
      <div className="min-w-[9rem] flex-1">
        <label
          htmlFor={inputId}
          className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft"
        >
          Alert me below ({currency})
        </label>
        <input
          id={inputId}
          name="target_price"
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={currentPrice !== null ? String(currentPrice) : "Any price"}
          onChange={(event) => setValue(event.target.value)}
          className="input w-full font-mono text-sm"
        />
      </div>
      <Button type="submit" size="sm" loading={isPending}>
        Save
      </Button>
      {value !== (currentTarget === null ? "" : String(currentTarget)) && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setValue(currentTarget === null ? "" : String(currentTarget))}
        >
          Reset
        </Button>
      )}

      {error && (
        <span role="alert" className="w-full text-xs text-rust">
          {error}
        </span>
      )}
      {saved && (
        <span role="status" className="w-full text-xs text-verified">
          {saved}
        </span>
      )}
    </form>
  );
}