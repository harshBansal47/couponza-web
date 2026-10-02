"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/app/account/actions";

/**
 * Newsletter unsubscribe.
 *
 * Rendered on the public site for signed-out readers clicking the link in an
 * alert email, so it must work without a session. That is why it asks for the
 * address instead of assuming one.
 */
export default function UnsubscribeForm({
  action,
  initialEmail = "",
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  initialEmail?: string;
}) {
  const [state, formAction] = useActionState(action, {} as ActionResult);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={initialEmail}
        required
      />

      <SubmitButton />

      {state?.error && (
        <p role="alert" className="border border-rust bg-rust-soft px-3 py-2 text-sm text-rust">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="border border-verified bg-verified-soft px-3 py-2 text-sm text-verified">
          {state.message}
        </p>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth loading={pending}>
      {pending ? "Turning off…" : "Turn off email alerts"}
    </Button>
  );
}
