import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type SupportTextPanelProps = HTMLAttributes<HTMLDivElement> & {
  kind: "transliteration" | "translation";
  label?: string;
  dir?: "ltr" | "rtl";
  alignClassName?: string;
  children: ReactNode;
};

function labelForKind(kind: SupportTextPanelProps["kind"]): string {
  return kind === "transliteration" ? "Transliteration" : "Translation";
}

export function SupportTextPanel({
  kind,
  label,
  dir = "ltr",
  alignClassName,
  className,
  children,
  ...props
}: SupportTextPanelProps) {
  const isTransliteration = kind === "transliteration";

  return (
    <div
      className={clsx(
        "rounded-[18px] border px-3 py-3",
        isTransliteration
          ? "border-[rgba(245,158,11,0.18)] bg-[rgba(245,158,11,0.08)]"
          : "border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)]",
        className,
      )}
      {...props}
    >
      <p
        className={clsx(
          "text-[10px] font-semibold uppercase tracking-[0.15em]",
          isTransliteration ? "text-[rgba(180,83,9,0.9)]" : "text-[color:var(--kw-faint)]",
        )}
      >
        {label ?? labelForKind(kind)}
      </p>
      <div
        dir={dir}
        className={clsx(
          "mt-2 text-sm leading-7",
          isTransliteration
            ? "font-medium italic tracking-[0.01em] text-[color:var(--kw-ink-2)]"
            : "text-[color:var(--kw-muted)]",
          alignClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
