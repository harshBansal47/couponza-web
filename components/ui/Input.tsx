"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

export type InputSize = "sm" | "md" | "lg";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  /** Visual size of the control. Overrides the native `size` attribute. */
  size?: InputSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-4 py-3 text-base",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, size = "md", leftIcon, rightIcon, fullWidth = true, className = "", id, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const describedBy = [props["aria-describedby"], errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-soft"
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            sizeStyles[size],
            "w-full rounded-sm border border-ledger-line bg-paper-raised text-ink placeholder:text-ink-soft",
            "transition-colors focus:border-inkblue focus:outline-none",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inkblue",
            "disabled:cursor-not-allowed disabled:bg-paper",
            leftIcon ? "pl-10" : "",
            rightIcon ? "pr-10" : "",
            error ? "border-rust focus:border-rust" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {rightIcon && (
          <span aria-hidden="true" className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-soft">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-rust">
          {error}
        </p>
      )}
      {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, size = "md", fullWidth = true, className = "", id, ...props },
  ref
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const describedBy = [props["aria-describedby"], errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          sizeStyles[size],
          "min-h-[100px] w-full resize-y rounded-sm border border-ledger-line bg-paper-raised text-ink",
          "placeholder:text-ink-soft transition-colors focus:border-inkblue focus:outline-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inkblue",
          "disabled:cursor-not-allowed disabled:bg-paper",
          error ? "border-rust focus:border-rust" : "",
          className,
        ].join(" ")}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-rust">
          {error}
        </p>
      )}
      {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
});

export function Label({
  children,
  htmlFor,
  required = false,
  className = "",
}: {
  children: ReactNode;
  htmlFor: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={`block text-xs font-medium uppercase tracking-wider text-ink-soft ${className}`}>
      {children}
      {required && (
        <span className="ml-1 text-rust" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export default Input;