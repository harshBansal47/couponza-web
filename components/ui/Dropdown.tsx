"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Input } from "./Input";

export type DropdownOption =
  | { value: string; label: string; icon?: ReactNode; disabled?: boolean }
  | { divider: true }
  | { sectionTitle: string };

interface DropdownProps {
  /** Rendered as the trigger. Can be a node or a render function receiving open state. */
  trigger: ReactNode | ((state: { open: boolean; toggle: () => void }) => ReactNode);
  options: DropdownOption[];
  onSelect?: (value: string, label: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  maxHeight?: number;
  align?: "left" | "right";
  closeOnSelect?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  /** Width of the menu panel, e.g. "12rem". */
  width?: string;
}

function isSelectable(opt: DropdownOption): opt is { value: string; label: string; icon?: ReactNode; disabled?: boolean } {
  return !("divider" in opt) && !("sectionTitle" in opt);
}

export function Dropdown({
  trigger,
  options,
  onSelect,
  searchable = false,
  searchPlaceholder = "Filter…",
  maxHeight = 280,
  align = "left",
  closeOnSelect = true,
  disabled = false,
  emptyMessage = "No matches",
  className = "",
  width,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // The menu is portalled and fixed-positioned, so its placement has to be
  // measured after it opens. Reading the trigger's rect during render would be
  // a ref access mid-render, which React does not allow.
  const [placement, setPlacement] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const query = searchQuery.trim().toLowerCase();

  const visibleOptions: DropdownOption[] = options.filter((opt) => {
    if (!isSelectable(opt)) return true;
    if (opt.disabled) return true;
    if (!query) return true;
    return opt.label.toLowerCase().includes(query);
  });

  const selectableOptions = visibleOptions.filter(
    (opt): opt is { value: string; label: string; icon?: ReactNode; disabled?: boolean } =>
      isSelectable(opt) && !opt.disabled
  );

  /**
   * Whether the menu is effectively empty. Dividers and section headers always
   * survive filtering, so checking `visibleOptions` would leave a bare rule
   * hanging under the search box instead of the empty message.
   */
  const isEmpty = visibleOptions.every((opt) => !isSelectable(opt));

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);
  const toggle = useCallback(() => {
    setOpen((o) => !o);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (selectableOptions.length === 0 ? -1 : (i + 1) % selectableOptions.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (selectableOptions.length === 0 ? -1 : (i - 1 + selectableOptions.length) % selectableOptions.length));
      } else if (e.key === "Enter" || e.key === " ") {
        if (activeIndex < 0) return;
        e.preventDefault();
        const opt = selectableOptions[activeIndex];
        if (opt) {
          onSelect?.(opt.value, opt.label);
          if (closeOnSelect) close();
        }
      } else if (e.key === "Tab") {
        close();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, activeIndex, selectableOptions, onSelect, closeOnSelect, close]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  useEffect(() => {
    if (open && searchable) searchInputRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    setPlacement(positionMenu(triggerRef.current, align));

    function onReposition() {
      setPlacement(positionMenu(triggerRef.current, align));
    }
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const { style } = document.body;
    const previous = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = previous;
    };
  }, [open]);

  function handleOptionClick(opt: DropdownOption) {
    if (!isSelectable(opt) || opt.disabled) return;
    onSelect?.(opt.value, opt.label);
    if (closeOnSelect) close();
  }

  const triggerContent =
    typeof trigger === "function"
      ? trigger({ open, toggle })
      : (trigger as ReactNode);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        ref={triggerRef}
        onClick={() => !disabled && toggle()}
        onKeyDown={(e: ReactKeyboardEvent) => {
          if (!disabled && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        className={disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      >
        {triggerContent}
      </div>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label="Options"
            className="fixed z-[60] min-w-[12rem] overflow-auto rounded-sm border border-ledger-line bg-paper-raised shadow-[var(--shadow-overlay)]"
            style={{
              maxHeight,
              width,
              minWidth: width,
              top: placement.top,
              left: placement.left,
            }}
          >
            {searchable && (
              <div className="sticky top-0 border-b border-ledger-line bg-paper-raised p-2">
                <Input
                  ref={searchInputRef}
                  type="search"
                  size="sm"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveIndex(-1);
                  }}
                  aria-label="Filter options"
                />
              </div>
            )}
            {isEmpty ? (
              <p className="px-3 py-4 text-center text-sm text-ink-soft">{emptyMessage}</p>
            ) : (
              visibleOptions.map((opt, i) => {
                if ("divider" in opt) {
                  return <div key={`divider-${i}`} role="separator" className="my-1 border-t border-ledger-line" />;
                }
                if ("sectionTitle" in opt) {
                  return (
                    <div
                      key={`section-${i}`}
                      className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-soft"
                    >
                      {opt.sectionTitle}
                    </div>
                  );
                }
                const selectableIndex = selectableOptions.findIndex((o) => o.value === opt.value);
                const isActive = selectableIndex === activeIndex;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isActive}
                    aria-disabled={opt.disabled || undefined}
                    onClick={() => handleOptionClick(opt)}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(selectableIndex)}
                    className={[
                      "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-ink transition-colors",
                      isActive ? "bg-ledger-line/50" : "",
                      opt.disabled ? "cursor-not-allowed opacity-40" : "hover:bg-ledger-line/30",
                    ].join(" ")}
                  >
                    {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

function positionMenu(anchor: HTMLElement | null, align: "left" | "right"): { top: number; left: number } {
  if (!anchor || typeof window === "undefined") return { top: 0, left: 0 };
  const rect = anchor.getBoundingClientRect();
  const top = Math.min(rect.bottom + 4, window.innerHeight - 16);
  return align === "left"
    ? { top, left: rect.left }
    : { top, left: Math.max(8, rect.right - (anchor.offsetWidth || 200)) };
}

export default Dropdown;
