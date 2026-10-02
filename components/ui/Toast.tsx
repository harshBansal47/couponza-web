"use client";

import { createContext, useContext, useCallback, useMemo, useState, type ReactNode } from "react";

export type ToastType = "default" | "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const typeStyles: Record<ToastType, string> = {
  default: "border-ink bg-ink text-paper",
  success: "border-verified bg-verified-soft text-verified",
  error: "border-rust bg-rust-soft text-rust",
  warning: "border-[var(--color-rust)] bg-rust-soft text-rust",
  info: "border-inkblue bg-[var(--color-inkblue)]/10 text-inkblue",
};

const typeIcons: Record<ToastType, string> = {
  default: "",
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, options: ToastOptions = {}) => {
    const id = Date.now() + Math.random();
    const toast: Toast = {
      id,
      message,
      type: options.type ?? "default",
      duration: options.duration ?? (options.type === "error" ? 5000 : 3000),
      action: options.action,
    };
    setToasts((t) => [...t, toast]);
    if (toast.duration > 0) {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), toast.duration);
    }
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const value = useMemo(() => ({ toast: push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-sm border px-4 py-3 text-sm max-w-md shadow-[var(--shadow-overlay)] ${typeStyles[t.type]}`}
            role="alert"
            aria-live="assertive"
          >
            {typeIcons[t.type] && <span className="shrink-0 font-medium" aria-hidden="true">{typeIcons[t.type]}</span>}
            <p className="flex-1">{t.message}</p>
            {t.action && (
              <button
                onClick={() => {
                  t.action.onClick();
                  dismiss(t.id);
                }}
                className="shrink-0 underline underline-offset-2 hover:no-underline"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Convenience helpers for common toast types */
export function useTypedToast() {
  const { toast, dismiss } = useToast();
  return {
    toast,
    dismiss,
    success: (message: string, options?: Omit<ToastOptions, "type">) => toast(message, { ...options, type: "success" }),
    error: (message: string, options?: Omit<ToastOptions, "type">) => toast(message, { ...options, type: "error" }),
    warning: (message: string, options?: Omit<ToastOptions, "type">) => toast(message, { ...options, type: "warning" }),
    info: (message: string, options?: Omit<ToastOptions, "type">) => toast(message, { ...options, type: "info" }),
  };
}