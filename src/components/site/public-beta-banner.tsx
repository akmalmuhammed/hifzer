import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";
import { getUiLanguageServer } from "@/hifzer/i18n/server";

export async function PublicBetaBanner(props: { variant?: "warning" | "soft" }) {
  const language = await getUiLanguageServer();
  const copy = getAppUiCopy(language);
  const variant = props.variant ?? "warning";
  const message = variant === "warning" ? copy.betaBanner.warning : copy.betaBanner.soft;

  return (
    <div className="flex justify-center px-4 py-2.5" role="status" aria-label={copy.betaBanner.ariaLabel}>
      <div
        className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.06)] px-4 py-1.5 backdrop-blur-sm"
        style={{ maxWidth: "min(90vw, 480px)" }}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: "rgba(var(--kw-accent-rgb),0.7)" }}
        />
        <p className="truncate text-[11px] font-semibold tracking-[0.04em] text-[color:var(--kw-ink-2)]">
          {message}
        </p>
      </div>
    </div>
  );
}
