"use client";

import { Moon, Sun } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggleMode } = useTheme();

  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={clsx(
        "relative grid h-9 w-9 place-items-center rounded-xl transition hover:bg-[color:var(--kw-hover-soft)] active:scale-95",
        className
      )}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Moon size={18} className="text-[color:var(--kw-ink)]" />
      ) : (
        <Sun size={18} className="text-[color:var(--kw-ink)]" />
      )}
    </button>
  );
}
