"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/app/account/actions";

/**
 * Sign-in and registration forms. Both are Server Actions driven by
 * `useActionState`, so there is no client-side fetch and no exposed endpoint —
 * the password only ever travels in the action payload.
 */

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth loading={pending} className="mt-2">
      {pending ? pendingLabel : label}
    </Button>
  );
}

/**
 * Server Action state is opaque to the DOM, so errors are mirrored into a live
 * region — a failed submit must be announced, not just coloured red.
 */
function ActionMessages({ state }: { state: ActionResult }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="mt-4 border border-rust bg-rust-soft px-3 py-2 text-sm text-rust">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="mt-4 border border-verified bg-verified-soft px-3 py-2 text-sm text-verified">
          {state.message}
        </p>
      )}
    </>
  );
}

const EMPTY: ActionResult = {};

export function LoginForm({
  action,
  next,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  next?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <Input label="Email" name="email" type="email" autoComplete="email" required />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <SubmitButton label="Sign in" pendingLabel="Signing in…" />

      <ActionMessages state={state} />
    </form>
  );
}

export function RegisterForm({
  action,
  next,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  next?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <Input label="Name" name="full_name" autoComplete="name" hint="Optional." />

      <Input label="Email" name="email" type="email" autoComplete="email" required />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
      />

      <SubmitButton label="Create account" pendingLabel="Creating your account…" />

      <ActionMessages state={state} />

      <p className="text-sm text-ink-soft">
        Already have an account?{" "}
        <Link
          href={next ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login"}
          className="text-inkblue hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({
  action,
  token,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  token: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <Input
        label="New password"
        name="new_password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters"
      />

      <Input
        label="Confirm new password"
        name="confirm_password"
        type="password"
        autoComplete="new-password"
        required
      />

      <SubmitButton label="Reset password" pendingLabel="Resetting…" />

      <ActionMessages state={state} />
    </form>
  );
}

export function ForgotPasswordForm({
  action,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useActionState(action, EMPTY);

  return (
    <form action={formAction} className="space-y-4">
      <Input label="Email address" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />

      <SubmitButton label="Send reset link" pendingLabel="Sending…" />

      <ActionMessages state={state} />
    </form>
  );
}