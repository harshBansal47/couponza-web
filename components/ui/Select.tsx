"use client";

import { forwardRef, useId, type ChangeEvent, type ReactNode, type SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value" | "defaultValue"> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  id?: string;
  name?: string;
}

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    error,
    hint,
    placeholder,
    options,
    value,
    defaultValue,
    onChange,
    disabled = false,
    required = false,
    fullWidth = true,
    id,
    name,
    className = "",
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const describedBy = [props["aria-describedby"], errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          {label}
          {required && (
            <span className="ml-1 text-rust" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value)}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            "input cursor-pointer appearance-none pr-10",
            "disabled:cursor-not-allowed disabled:bg-paper",
            className,
          ].join(" ")}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-ink-soft">
          <Chevron />
        </span>
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

/** Native multi-select with an always-visible option list. */
interface MultiSelectProps extends Omit<SelectProps, "onChange" | "value"> {
  value?: string[];
  onChange?: (value: string[]) => void;
  maxDisplay?: number;
}

export const MultiSelect = forwardRef<HTMLSelectElement, MultiSelectProps>(function MultiSelect(
  {
    label,
    error,
    hint,
    options,
    value,
    onChange,
    disabled = false,
    required = false,
    fullWidth = true,
    id,
    name,
    className = "",
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const describedBy = [props["aria-describedby"], errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          {label}
          {required && (
            <span className="ml-1 text-rust" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        name={name}
        multiple
        size={Math.min(options.length, 8)}
        value={value ?? []}
        onChange={(e) => onChange?.(Array.from(e.target.selectedOptions, (o) => o.value))}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={["input min-h-[100px] cursor-pointer", "disabled:cursor-not-allowed disabled:bg-paper", className].join(" ")}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-rust">
          {error}
        </p>
      )}
      {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
});

/** A styled checkbox with label + description, for settings-style forms. */
export function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
  id,
  name,
  className = "",
}: {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input
        id={inputId}
        name={name}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-ink)] disabled:cursor-not-allowed"
      />
      <label htmlFor={inputId} className="cursor-pointer text-sm leading-snug text-ink">
        {label}
        {description && <span className="mt-0.5 block text-sm text-ink-soft">{description}</span>}
      </label>
    </div>
  );
}

export default Select;