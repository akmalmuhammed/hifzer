import clsx from "clsx";
import Link from "next/link";
import { SquarePen } from "lucide-react";
import type { JournalEntryType } from "@/hifzer/journal/local-store";
import { buildJournalPrefillHref } from "@/hifzer/journal/prefill";

export function JournalPrefillLink(props: {
  ayahId: number;
  prompt?: string | null;
  title?: string | null;
  type?: JournalEntryType;
  label?: string;
  ariaLabel?: string;
  variant?: "button" | "icon";
  className?: string;
}) {
  const href = buildJournalPrefillHref({
    ayahId: props.ayahId,
    prompt: props.prompt,
    title: props.title,
    type: props.type ?? "reflection",
  });

  const label = props.label ?? "Add to journal";

  return (
    <Link
      href={href}
      className={clsx(
        props.variant === "icon"
          ? "inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] transition hover:bg-[color:var(--kw-hover-strong)]"
          : "inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] transition hover:bg-white",
        props.className,
      )}
      aria-label={props.ariaLabel ?? label}
      title={props.ariaLabel ?? label}
    >
      <SquarePen size={props.variant === "icon" ? 16 : 14} />
      {props.variant === "icon" ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </Link>
  );
}
