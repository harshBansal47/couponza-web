"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "default" | "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  type?: ToastType;
  /** Auto-dismiss delay in ms. `0` keeps the toast up until dismissed. */
  duration?: number;
  action?: ToastAction;
}

interface Toast extends Required<Omit<ToastOptions, "action">> {
  id: number;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Must be called inside <ToastProvider> — the root layout already wraps the app. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

const DEFAULT_DURATION = 3000;
/** Errors stay longer: they usually carry something the reader needs time for. */
const ERROR_DURATION = 6000;

const typeStyles: Record<ToastType, string> = {
  default: "border-ink bg-ink text-paper",
  success: "border-verified bg-verified-soft text-verified",
  error: "border-rust bg-rust-soft text-rust",
  warning: "border-rust bg-rust-soft text-rust",
  info: "border-inkblue bg-inkblue/10 text-inkblue",
};

const typeIcons: Record<ToastType, string> = {
  default: "",
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

function ToastRow({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  // Hovering or focusing a toast pauses its countdown, so the message stays
  // readable while someone reaches for the action button.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || toast.duration <= 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.duration, onDismiss]);

  return (
    <div
      data-toast-id={toast.id}
      className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-sm border px-4 py-3 text-sm shadow-[var(--shadow-overlay)] ${typeStyles[toast.type]}`}
      role={toast.type === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {typeIcons[toast.type] && (
        <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current font-mono text-[10px]">
          {typeIcons[toast.type]}
        </span>
      )}
      <p className="flex-1">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="shrink-0 underline underline-offset-2 hover:no-underline"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-50 transition-opacity hover:opacity-100"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = Date.now() + Math.random();
      const type = options.type ?? "default";
      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type,
          duration: options.duration ?? (type === "error" ? ERROR_DURATION : DEFAULT_DURATION),
          action: options.action,
        },
      ]);
    },
    [],
  );

  const value = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((t) => (
          <ToastRow key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Same context, with the type pre-filled. */
export function useTypedToast() {
  const { toast, dismiss } = useToast();
  return useMemo(
    () => ({
      toast,
      dismiss,
      success: (message: string, options?: Omit<ToastOptions, "type">) =>
        toast(message, { ...options, type: "success" }),
      error: (message: string, options?: Omit<ToastOptions, "type">) =>
        toast(message, { ...options, type: "error" }),
      warning: (message: string, options?: Omit<ToastOptions, "type">) =>
        toast(message, { ...options, type: "warning" }),
      info: (message: string, options?: Omit<ToastOptions, "type">) =>
        toast(message, { ...options, type: "info" }),
    }),
    [toast, dismiss],
  );
}