"use client";

import { useOptimistic, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Save/follow toggles.
 *
 * These are optimistic: the visual state flips immediately and rolls back if the
 * Server Action fails, because waiting on a network round-trip to grey out a
 * button feels broken even when it is fast.
 *
 * The Server Actions take the item id plus the *current* saved state, so a
 * double-submit resolves to a no-op rather than stacking duplicate rows.
 */

export interface ToggleResult {
  error?: string;
  message?: string;
}

function useOptimisticToggle(
  initial: boolean,
  action: (next: boolean) => Promise<ToggleResult>,
) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(initial);

  function toggle() {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      const result = await action(next);
      // The optimistic value is only a preview; if the write failed, revert.
      if (result?.error) setOptimistic(!next);
    });
  }

  return { active: optimistic, isPending, toggle };
}

export function SaveCouponButton({
  couponId,
  initiallySaved,
  action,
  className = "",
}: {
  couponId: string;
  initiallySaved: boolean;
  action: (couponId: string, currentlySaved: boolean) => Promise<ToggleResult>;
  className?: string;
}) {
  const { active, isPending, toggle } = useOptimisticToggle(initiallySaved, (next) =>
    action(couponId, !next),
  );

  return (
    <Button
      type="button"
      variant={active ? "outline" : "ghost"}
      size="sm"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={active}
      className={className}
    >
      {active ? "Saved" : "Save"}
    </Button>
  );
}

export function FollowStoreButton({
  storeId,
  initiallySaved,
  action,
  className = "",
}: {
  storeId: string;
  initiallySaved: boolean;
  action: (storeId: string, currentlySaved: boolean) => Promise<ToggleResult>;
  className?: string;
}) {
  const { active, isPending, toggle } = useOptimisticToggle(initiallySaved, (next) =>
    action(storeId, !next),
  );

  return (
    <Button
      type="button"
      variant={active ? "primary" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={active}
      className={className}
    >
      {active ? "Following" : "Follow"}
    </Button>
  );
}

/** Follow/unfollow row for a store, used on the saved-deals page. */
export function StoreFollowRow({
  store,
  initiallySaved,
  action,
}: {
  store: { id: string; name: string; slug: string; logo_url?: string | null };
  initiallySaved: boolean;
  action: (storeId: string, currentlySaved: boolean) => Promise<ToggleResult>;
}) {
  return (
    <li className="flex items-center gap-3 border border-ledger-line bg-paper-raised p-3">
      {store.logo_url ? (
        <Image
          src={store.logo_url}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-full border border-ledger-line bg-paper object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ledger-line bg-paper font-mono text-[10px] text-ink-soft"
        >
          {store.name.charAt(0).toUpperCase()}
        </span>
      )}
      <Link
        href={`/stores/${store.slug}`}
        className="min-w-0 flex-1 truncate text-sm text-ink hover:underline"
      >
        {store.name}
      </Link>
      <FollowStoreButton
        storeId={store.id}
        initiallySaved={initiallySaved}
        action={action}
        className="shrink-0"
      />
    </li>
  );
}

/** The saved/unsaved control for a coupon, used on the saved-deals page. */
export function SavedCouponRow({
  coupon,
  storeName,
  discount,
  expiry,
  initiallySaved,
  action,
}: {
  coupon: { id: string; title: string; slug: string; code: string | null };
  storeName?: string;
  /** Headline discount, formatted by the caller's market-aware formatter. */
  discount?: string;
  /** "Expires in 3 days" / "Expired", or null for an evergreen code. */
  expiry?: string | null;
  initiallySaved: boolean;
  action: (couponId: string, currentlySaved: boolean) => Promise<ToggleResult>;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 border border-ledger-line bg-paper-raised p-3">
      <Link
        href={`/coupons/${coupon.slug}`}
        className="min-w-0 flex-1 text-sm text-ink hover:underline"
      >
        {coupon.title}
      </Link>
      {discount && <span className="text-xs text-ink-soft">{discount}</span>}
      {storeName && <span className="text-xs text-ink-soft">{storeName}</span>}
      {coupon.code && (
        <code className="break-anywhere border border-ledger-line bg-paper px-1.5 py-0.5 font-mono text-xs">
          {coupon.code}
        </code>
      )}
      {expiry && <span className="text-xs text-ink-soft">{expiry}</span>}
      <SaveCouponButton
        couponId={coupon.id}
        initiallySaved={initiallySaved}
        action={action}
        className="shrink-0"
      />
    </li>
  );
}

/**
 * Removes a saved item without the optimistic dance — a destructive action
 * should only look done once the server has agreed.
 */
export function RemoveSavedButton({
  id,
  label,
  action,
}: {
  id: string;
  label: string;
  action: (id: string) => Promise<ToggleResult>;
}) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function remove() {
    startTransition(async () => {
      setError(null);
      const result = await action(id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setRemoved(true);
    });
  }

  if (removed) {
    return (
      <span className="text-sm text-ink-soft" role="status">
        Removed.
      </span>
    );
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={isPending}>
        {isPending ? "Removing…" : label}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-rust">
          {error}
        </span>
      )}
    </>
  );
}