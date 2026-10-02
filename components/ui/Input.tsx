"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

export type InputSize = "sm" | "md" | "lg";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-4 py-3 text-base",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      size = "md",
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = "",
      id,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const describedBy = [errorId, hintId, props["aria-describedby"]].filter(Boolean).join(" ") || undefined;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-soft" aria-hidden="true">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            className={`${sizeStyles[size]} w-full border border-ledger-line bg-paper-raised rounded-sm text-ink placeholder:text-ink-soft transition-colors focus:border-inkblue focus:outline-none focus-visible:outline-2 focus-visible:outline-inkblue focus-visible:outline-offset-2 disabled:bg-paper disabled:cursor-not-allowed ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""} ${error ? "border-rust focus:border-rust" : ""} ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-soft" aria-hidden="true">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-rust" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-ink-soft">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      size = "md",
      fullWidth = true,
      className = "",
      id,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const describedBy = [errorId, hintId, props["aria-describedby"]].filter(Boolean).join(" ") || undefined;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={`${sizeStyles[size]} w-full min-h-[100px] border border-ledger-line bg-paper-raised rounded-sm text-ink placeholder:text-ink-soft transition-colors focus:border-inkblue focus:outline-none focus-visible:outline-2 focus-visible:outline-inkblue focus-visible:outline-offset-2 disabled:bg-paper disabled:cursor-not-allowed resize-y ${error ? "border-rust focus:border-rust" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-rust" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-ink-soft">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

/** Label component for standalone usage */
export function Label({
  children,
  htmlFor,
  required = false,
  className = "",
}: {
  children: React.ReactNode;
  htmlFor: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={`block text-xs font-medium uppercase tracking-wider text-ink-soft ${className}`}>
      {children}
      {required && <span className="ml-1 text-rust" aria-hidden="true">*</span>}
    </label>
  );
}