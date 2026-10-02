"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/app/account/actions";

/**
 * Profile editor: display name and password.
 *
 * The email address is shown but not editable — changing it needs
 * re-verification, so the API deliberately does not accept it. Saying so beats
 * showing a disabled field with no explanation.
 */

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export default function ProfileForm({
  action,
  user,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  user: { email: string; full_name: string | null };
}) {
  const [state, formAction] = useActionState(action, {} as ActionResult);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);

  // Clear the password fields once the write lands; a successful save should
  // not leave a credential sitting in the DOM.
  useEffect(() => {
    if (!state?.message) return;
    if (currentPasswordRef.current) currentPasswordRef.current.value = "";
    if (newPasswordRef.current) newPasswordRef.current.value = "";
  }, [state]);

  return (
    <form action={formAction} className="max-w-prose space-y-5">
      <div>
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          Email
        </span>
        <p className="font-mono text-sm text-ink">{user.email}</p>
        <p className="mt-1 text-xs text-ink-soft">
          Your email is the key to your alert history. To change it, contact us from this address.
        </p>
      </div>

      <Input
        label="Display name"
        name="full_name"
        defaultValue={user.full_name ?? ""}
        hint="Shown in the header instead of your email address."
      />

      <fieldset className="space-y-4 border-t border-ledger-line pt-5">
        <legend className="text-sm font-medium text-ink">Change password</legend>
        <p className="text-xs text-ink-soft">
          Leave both fields empty to keep your current password.
        </p>
        <Input
          ref={currentPasswordRef}
          label="Current password"
          name="current_password"
          type="password"
          autoComplete="current-password"
        />
        <Input
          ref={newPasswordRef}
          label="New password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
        />
      </fieldset>

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