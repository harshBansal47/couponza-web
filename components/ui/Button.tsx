"use client";

import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";

export type ButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "verified"
  | "danger"
  | "link";
export type ButtonSize = "sm" | "md" | "lg";

interface VariantConfig {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantConfig {
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

interface ButtonLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof VariantConfig>,
    VariantConfig {
  href: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Render through next/link instead of a raw <a>. */
  prefetch?: boolean;
}

const baseStyles =
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-inkblue focus-visible:outline-offset-2";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper border border-ink hover:bg-transparent hover:text-ink",
  outline: "bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper",
  ghost: "bg-transparent text-ink-soft hover:text-ink hover:bg-ledger-line/40",
  verified: "bg-verified text-paper border border-verified hover:opacity-90",
  danger: "bg-rust text-paper border border-rust hover:opacity-90",
  link: "bg-transparent text-inkblue underline underline-offset-2 hover:no-underline",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-sm",
  md: "px-4 py-2 text-sm rounded-sm",
  lg: "px-6 py-3 text-base rounded-md",
};

function classes({ variant = "primary", size = "md", fullWidth = false, className = "" }: VariantConfig & { className?: string }) {
  return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading = false, leftIcon, rightIcon, fullWidth, children, disabled, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading ? <Spinner /> : leftIcon ? <span aria-hidden="true">{leftIcon}</span> : null}
      {children}
      {!loading && rightIcon ? <span aria-hidden="true">{rightIcon}</span> : null}
    </button>
  );
});

/** An internal link that looks like a Button. */
export function ButtonLink({
  href,
  variant,
  size,
  leftIcon,
  rightIcon,
  fullWidth,
  children,
  className,
  prefetch,
  ...props
}: ButtonLinkProps) {
  return (
    <Link href={href} prefetch={prefetch} className={classes({ variant, size, fullWidth, className })} {...props}>
      {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
      {children}
      {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </Link>
  );
}

/** An external link (or one we want a full page load for) that looks like a Button. */
export function ButtonAnchor({ href, variant, size, leftIcon, rightIcon, fullWidth, children, className, ...props }: ButtonLinkProps) {
  return (
    <a href={href} className={classes({ variant, size, fullWidth, className })} {...props}>
      {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
      {children}
      {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </a>
  );
}

export default Button;