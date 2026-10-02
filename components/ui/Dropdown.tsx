"use client";

import { useRef, useEffect, useState, useCallback, type ReactNode, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";

interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  divider?: boolean;
  sectionTitle?: string;
}

interface DropdownProps {
  trigger: ReactNode;
  options: DropdownOption[];
  onSelect?: (value: string, label: string) => void;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  searchable?: boolean;
  maxHeight?: number;
  align?: "left" | "right";
  closeOnSelect?: boolean;
}

export function Dropdown({
  trigger,
  options,
  onSelect,
  placeholder,
  value,
  disabled = false,
  searchable = false,
  maxHeight = 280,
  align = "left",
  closeOnSelect = true,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((opt) => {
    if (opt.divider || opt.sectionTitle) return true;
    return opt.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectableOptions = filteredOptions.filter((opt) => !opt.divider && !opt.sectionTitle && !opt.disabled);

  useEffect(() => {
    setActiveIndex(-1);
  }, [open, searchQuery]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, selectableOptions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (activeIndex >= 0) {
          const opt = selectableOptions[activeIndex];
          onSelect?.(opt.value, opt.label);
          if (closeOnSelect) setOpen(false);
        }
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, activeIndex, selectableOptions, onSelect, closeOnSelect]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open, searchable]);

  function handleOptionClick(opt: DropdownOption) {
    if (opt.disabled || opt.divider || opt.sectionTitle) return;
    onSelect?.(opt.value, opt.label);
    if (closeOnSelect) setOpen(false);
  }

  const triggerElement = typeof trigger === "function" ? trigger({ open, onClick: () => !disabled && setOpen((o) => !o) }) : (
    <div
      ref={triggerRef}
      onClick={() => !disabled && setOpen((o) => !o)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " " || e.key === "ArrowDown") && !open) {
          e.preventDefault();
          setOpen(true);
        }
      }}
      tabIndex={0}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-disabled={disabled}
      className="cursor-pointer"
    >
      {trigger}
    </div>
  );

  if (!open) return <>{triggerElement}</>;

  const menuContent = (
    <div
      ref={menuRef}
      role="listbox"
      className="absolute z-50 min-w-[200px] max-h-[280px] overflow-auto border border-ledger-line bg-paper-raised shadow-[var(--shadow-overlay)] rounded-sm mt-1"
      style={{
        maxHeight,
        [align === "left" ? "left" : "right"]: 0,
      }}
    >
      {searchable && (
        <div className="p-2 border-b border-ledger-line sticky top-0 bg-paper-raised">
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm"
            aria-label="Filter options"
          />
        </div>
      )}
      {filteredOptions.map((opt, i) => {
        if (opt.divider) {
          return <div key={`divider-${i}`} className="border-t border-ledger-line my-1" role="separator" />;
        }
        if (opt.sectionTitle) {
          return (
            <div key={`section-${i}`} className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-soft">
              {opt.sectionTitle}
            </div>
          );
        }
        const isActive = selectableOptions.findIndex((o) => o.value === opt.value) === activeIndex;
        return (
          <div
            key={opt.value}
            role="option"
            aria-selected={isActive}
            aria-disabled={opt.disabled}
            className={`px-3 py-2 text-sm cursor-pointer transition-colors ${isActive ? "bg-ledger-line/40" : ""} ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            onClick={() => handleOptionClick(opt)}
            onMouseEnter={() => setActiveIndex(selectableOptions.findIndex((o) => o.value === opt.value))}
          >
            <div className="flex items-center gap-2">
              {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
              <span>{opt.label}</span>
            </div>
          </div>
        );
      })}
      {selectableOptions.length === 0 && (
        <div className="px-3 py-4 text-center text-sm text-ink-soft">No options found</div>
      )}
    </div>
  );

  return (
    <>
      {triggerElement}
      {createPortal(menuContent, document.body)}
    </>
  );
}

/** Simpler Select-style dropdown for form inputs */
interface SelectDropdownProps {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  fullWidth?: boolean;
}

export function SelectDropdown({
  label,
  error,
  hint,
  placeholder,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  name,
  id,
  fullWidth = true,
}: SelectDropdownProps) {
  const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;

  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          {label}
          {required && <span className="ml-1 text-rust" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
        className="input appearance-none bg-no-repeat bg-right pr-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23565c4e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundPosition: "right 0.75rem center",
        }}
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
      {error && <p id={errorId} className="mt-1.5 text-sm text-rust" role="alert">{error}</p>}
      {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}