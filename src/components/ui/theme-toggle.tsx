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
        "relative grid h-[var(--kw-control-md-height)] w-[var(--kw-control-md-height)] place-items-center rounded-[var(--kw-control-md-radius)] bg-[color:var(--kw-fill-strong)] transition-colors hover:bg-[color:var(--kw-hover-strong)] active:scale-95",
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
