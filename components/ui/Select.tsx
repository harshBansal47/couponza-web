"use client";

import { forwardRef, useId, useState, type SelectHTMLAttributes, type ReactNode } from "react";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  id?: string;
  name?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      placeholder,
      options,
      value,
      onChange,
      disabled = false,
      required = false,
      fullWidth = true,
      id: providedId,
      name,
      className = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = providedId || generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = hint ? `${selectId}-hint` : undefined;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {label}
            {required && <span className="ml-1 text-rust" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value ?? ""}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
            className="input appearance-none bg-no-repeat bg-right pr-10 cursor-pointer disabled:bg-paper disabled:cursor-not-allowed"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23565c4e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundPosition: "right 0.75rem center",
            }}
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
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        {error && <p id={errorId} className="mt-1.5 text-sm text-rust" role="alert">{error}</p>}
        {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

/** Multi-select variant */
interface MultiSelectProps extends Omit<SelectProps, "onChange"> {
  value?: string[];
  onChange?: (value: string[]) => void;
  maxDisplay?: number;
}

export const MultiSelect = forwardRef<HTMLSelectElement, MultiSelectProps>(
  (
    {
      label,
      error,
      hint,
      placeholder,
      options,
      value,
      onChange,
      disabled = false,
      required = false,
      fullWidth = true,
      maxDisplay = 3,
      id: providedId,
      name,
      className = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = providedId || generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const [open, setOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
      onChange?.(selected);
    };

    const displayValue = value && value.length > 0
      ? value.slice(0, maxDisplay).map((v) => options.find((o) => o.value === v)?.label).filter(Boolean).join(", ")
      : placeholder;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {label}
            {required && <span className="ml-1 text-rust" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            name={name}
            multiple
            value={value ?? []}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
            className="input appearance-none min-h-[100px] cursor-pointer disabled:bg-paper disabled:cursor-not-allowed"
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          {(!value || value.length === 0) && placeholder && (
            <div className="pointer-events-none absolute inset-0 flex items-center px-4 text-ink-soft">
              {placeholder}
            </div>
          )}
        </div>
        {error && <p id={errorId} className="mt-1.5 text-sm text-rust" role="alert">{error}</p>}
        {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";