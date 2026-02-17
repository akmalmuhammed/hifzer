"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggleMode } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={clsx("h-9 w-9 opacity-0", className)} /> // Placeholder to prevent layout shift
    );
  }

  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={clsx(
        "relative grid h-9 w-9 place-items-center rounded-xl transition hover:bg-black/5 active:scale-95",
        "dark:hover:bg-white/10", // Manual dark hover since we use data-mode
        className
      )}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ y: -20, opacity: 0, rotate: 90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: -90 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute"
        >
          {isDark ? (
            <Moon size={18} className="text-[color:var(--kw-ink)]" />
          ) : (
            <Sun size={18} className="text-[color:var(--kw-ink)]" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
