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
    return "[&_p:first-of-type]:text-[color:var(--kw-lime-600)]";
  }
  if (tone === "warning") {
    return "[&_p:first-of-type]:text-[color:var(--kw-ember-600)]";
  }
  return "[&_p:first-of-type]:text-[color:var(--kw-ink)]";
}

function ToastViewport(props: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  const { items, onDismiss } = props;
  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(400px,calc(100vw-2rem))] flex-col gap-2.5"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={clsx(
            "kw-material pointer-events-auto rounded-[20px] border border-[color:var(--kw-border-2)] px-4 py-3 text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-float)]",
            toneClasses(item.tone ?? "neutral"),
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[0.94rem] font-semibold tracking-[-0.01em]">{item.title}</p>
              {item.message ? (
                <p className="mt-0.5 line-clamp-2 text-sm leading-[1.4] text-[color:var(--kw-muted)]">{item.message}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="rounded-full p-1.5 text-[color:var(--kw-faint)] transition duration-200 hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)] focus-visible:text-[color:var(--kw-ink)]"
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
