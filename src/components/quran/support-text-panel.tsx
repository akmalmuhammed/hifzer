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
        "border-t pt-4",
        isTransliteration
          ? "border-[color:var(--kw-border-2)]"
          : "border-[color:var(--kw-border-2)]",
        className,
      )}
      {...props}
    >
      <p
        className={clsx(
          "text-[0.8rem] font-semibold",
          "text-[color:var(--kw-faint)]",
        )}
      >
        {label ?? labelForKind(kind)}
      </p>
      <div
        dir={dir}
        className={clsx(
          "mt-1.5 text-[1.02rem] leading-[1.65]",
          isTransliteration
            ? "italic text-[color:var(--kw-ink-2)]"
            : "text-[color:var(--kw-muted)]",
          alignClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
