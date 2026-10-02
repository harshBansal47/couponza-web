"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { formatMoney } from "@/lib/format";
import type { ActionResult } from "@/app/account/actions";

/**
 * The "Track this" dialog.
 *
 * A product page renders this as a self-contained island: the trigger and the
 * form are in the same component, so no cross-component event bus is needed.
 * The target price is optional — a plain "tell me if it drops" is the default
 * and the common case; asking everyone to name a number would just add friction.
 */

export interface TrackProduct {
  id: string;
  name: string;
  currency: string;
  current_price: number | null;
  /** Cheapest price seen in the last 30 days, when known. */
  lowest_price_30d?: number | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth loading={pending}>
      {pending ? "Saving…" : "Track this product"}
    </Button>
  );
}

export default function TrackProductDialog({
  product,
  action,
  isSignedIn,
  loginHref,
  triggerLabel = "Track this",
  variant = "outline",
  size = "sm",
  className = "",
}: {
  product: TrackProduct;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  isSignedIn: boolean;
  loginHref?: string;
  triggerLabel?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  // Dismiss on success so the visitor is not left staring at a finished form.
  // The close happens inside the action rather than in an effect keyed off the
  // result state, which avoids a second render pass after every submission.
  const [state, formAction] = useActionState(async (prev: ActionResult, formData: FormData) => {
    const result = await action(prev, formData);
    if (result?.message) setOpen(false);
    return result;
  }, {} as ActionResult);

  // A signed-out visitor cannot track anything, so the dialog explains the next
  // step rather than showing a form that would fail on submit.
  if (!isSignedIn) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          window.location.href = loginHref ?? "/account/login";
        }}
      >
        Sign in to track
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {triggerLabel}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Track this product">
        <p className="text-sm text-ink-soft">{product.name}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 border border-ledger-line bg-paper-raised p-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-soft">Current price</dt>
            <dd className="mt-0.5 font-mono text-ink">
              {product.current_price !== null
                ? formatMoney(product.current_price, product.currency)
                : "Not captured yet"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-soft">Lowest in 30 days</dt>
            <dd className="mt-0.5 font-mono text-ink">
              {product.lowest_price_30d != null
                ? formatMoney(product.lowest_price_30d, product.currency)
                : "No history yet"}
            </dd>
          </div>
        </dl>

        <form action={formAction} className="mt-5 space-y-4">
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="currency" value={product.currency} />

          <Input
            label="Alert me when it drops below"
            name="target_price"
            inputMode="decimal"
            placeholder={product.current_price !== null ? String(product.current_price) : "e.g. 999"}
            hint={`Optional, in ${product.currency}. Leave it blank and we will email you about any drop.`}
          />

          <SubmitButton />
        </form>

        {state?.error && (
          <p role="alert" className="mt-4 border border-rust bg-rust-soft px-3 py-2 text-sm text-rust">
            {state.error}
          </p>
        )}
      </Modal>
    </>
  );
}