"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Globe2 } from "lucide-react";
import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";
import { UI_LANGUAGE_OPTIONS, type UiLanguage } from "@/hifzer/i18n/ui-language";
import { useUiLanguage } from "@/components/providers/ui-language-provider";

type UiLanguageSwitcherProps = {
  className?: string;
  selectClassName?: string;
  compact?: boolean;
  label?: string;
  showIcon?: boolean;
  onChanged?: () => void;
};

export function UiLanguageSwitcher(props: UiLanguageSwitcherProps) {
  const { language, setLanguage } = useUiLanguage();
  const router = useRouter();
  const ui = getAppUiCopy(language);
  const label = props.label ?? ui.language;

  return (
    <label className={props.className ?? "text-xs text-[color:var(--kw-muted)]"}>
      {props.compact ? null : <span className="mb-1 block">{label}</span>}
      <div className="relative">
        {props.showIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[color:var(--kw-faint)]">
            <Globe2 size={14} />
          </span>
        ) : null}
        <select
          value={language}
          onChange={(event) => {
            const next = event.target.value as UiLanguage;
            setLanguage(next);
            props.onChanged?.();
            router.refresh();
          }}
          className={clsx(
            "h-9 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-2 text-sm text-[color:var(--kw-ink)]",
            props.showIcon && "pl-9",
            props.selectClassName,
          )}
          aria-label={label}
        >
          {UI_LANGUAGE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
