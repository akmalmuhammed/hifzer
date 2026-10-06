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
        "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-colors duration-200",
        enabled
          ? "bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
          : "bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-strong)]",
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
