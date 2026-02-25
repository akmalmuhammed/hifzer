"use client";

import clsx from "clsx";
import { EyeOff } from "lucide-react";
import { useDistractionFree } from "@/components/providers/distraction-free-provider";

type DistractionFreeToggleProps = {
  compact?: boolean;
  className?: string;
};

export function DistractionFreeToggle(props: DistractionFreeToggleProps) {
  const { enabled, toggle } = useDistractionFree();

  return (
    <button
      type="button"
      onClick={toggle}
      className={clsx(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-[var(--kw-shadow-soft)] transition",
        enabled
          ? "border-[rgba(var(--kw-accent-rgb),0.3)] bg-[rgba(var(--kw-accent-rgb),0.14)] text-[rgba(var(--kw-accent-rgb),1)]"
          : "border-[color:var(--kw-border-2)] bg-white/75 text-[color:var(--kw-ink)] hover:bg-white",
        props.className,
      )}
      aria-pressed={enabled}
      aria-label={enabled ? "Disable distraction free mode" : "Enable distraction free mode"}
      title={enabled ? "Disable distraction free mode" : "Enable distraction free mode"}
    >
      <EyeOff size={14} />
      {props.compact ? (enabled ? "Focus on" : "Focus off") : (enabled ? "Distraction-free on" : "Distraction-free off")}
    </button>
  );
}
