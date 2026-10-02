"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/app/account/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} variant="ghost" className="w-full justify-start">
      {pending ? "Deleting…" : "Delete my account"}
    </Button>
  );
}

interface DeleteAccountFormProps {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  user: { email: string };
}

export default function DeleteAccountForm({ action, user }: DeleteAccountFormProps) {
  const [state, formAction] = useActionState(action, {} as ActionResult);

  return (
    <form action={formAction} className="mt-6 space-y-5 max-w-md">
      <fieldset className="space-y-4 border border-rust/30 rounded-lg p-5 bg-rust-soft/20">
        <legend className="text-sm font-medium text-rust">
          Delete account
        </legend>
        <p className="text-sm text-ink-soft">
          This action is irreversible. It will permanently delete:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-ink-soft">
          <li>Your profile (name, email)</li>
          <li>All saved stores and coupons</li>
          <li>All tracked products and target prices</li>
          <li>All alert history and notification preferences</li>
          <li>Browser push subscriptions</li>
        </ul>
        <p className="text-sm text-ink-soft">
          Your coupon verification reports (<em>worked / did not work</em>) will remain public
          but will no longer be attached to your account.
        </p>

        <div className="space-y-3 pt-4 border-t border-rust/30">
          <Input
            label="Confirm your email address"
            name="confirm_email"
            type="email"
            autoComplete="email"
            required
            hint="Must match the email above exactly"
          />

          <Input
            label="Current password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
            hint="Your current password is required to confirm this is really you"
          />
        </div>

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
      </fieldset>
    </form>
  );
}