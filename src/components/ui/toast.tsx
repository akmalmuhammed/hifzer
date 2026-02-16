"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

type ToastTone = "neutral" | "success" | "warning";

export type ToastInput = {
  title: string;
  message?: string;
  tone?: ToastTone;
};

type ToastItem = ToastInput & {
  id: string;
  createdAt: number;
};

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast: (toast) => {
        const item: ToastItem = {
          id: `t_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          createdAt: Date.now(),
          title: toast.title,
          message: toast.message,
          tone: toast.tone ?? "neutral",
        };
        setItems((current) => [item, ...current].slice(0, 4));
      },
    }),
    [],
  );

  useEffect(() => {
    if (items.length === 0) {
      return;
    }
    const timers = items.map((item) =>
      window.setTimeout(() => {
        setItems((current) => current.filter((t) => t.id !== item.id));
      }, 4500),
    );
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [items]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={(id) => setItems((s) => s.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

function toneClasses(tone: ToastTone): string {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-950";
  }
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }
  return "border-slate-200 bg-white/80 text-slate-950";
}

function ToastViewport(props: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  const { items, onDismiss } = props;
  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={clsx(
            "pointer-events-auto rounded-2xl border px-3 py-2 shadow-[var(--kw-shadow-soft)] backdrop-blur",
            toneClasses(item.tone ?? "neutral"),
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              {item.message ? (
                <p className="mt-0.5 line-clamp-2 text-sm opacity-80">{item.message}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="rounded-md p-1 opacity-70 transition hover:opacity-100 focus-visible:opacity-100"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
