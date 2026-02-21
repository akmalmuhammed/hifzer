const WARNING_MESSAGE = "PUBLIC BETA LIVE NOW - Expect bugs, slowdowns, or occasional crashes - Thanks for your patience";
const SOFT_MESSAGE = "Public beta active - core flows are stable and improving weekly.";

export function PublicBetaBanner(props: { variant?: "warning" | "soft" }) {
  const variant = props.variant ?? "warning";
  const isWarning = variant === "warning";
  const message = isWarning ? WARNING_MESSAGE : SOFT_MESSAGE;

  return (
    <div
      className={
        isWarning
          ? "border-b border-[color:var(--kw-border-2)] bg-[linear-gradient(90deg,rgba(var(--kw-accent-rgb),0.12),rgba(10,138,119,0.10),rgba(234,88,12,0.11))]"
          : "border-b border-[color:var(--kw-border-2)] bg-[linear-gradient(90deg,rgba(var(--kw-accent-rgb),0.08),rgba(10,138,119,0.06),rgba(234,88,12,0.06))]"
      }
    >
      <div className="overflow-hidden py-1.5 [contain:layout_paint]" role="status" aria-label="Public beta notice">
        {isWarning ? (
          <>
            <p className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-ink-2)] md:hidden">
              {message}
            </p>
            <div className="kw-beta-marquee-track w-max items-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-ink-2)] md:text-[11px]">
              <span className="kw-beta-marquee-segment">{message}</span>
              <span className="kw-beta-marquee-segment" aria-hidden>
                {message}
              </span>
            </div>
          </>
        ) : (
          <p className="px-2 text-center text-[11px] font-semibold tracking-[0.02em] text-[color:var(--kw-ink-2)]">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
