const BETA_MESSAGE = "PUBLIC BETA LIVE NOW - Expect bugs, slowdowns, or occasional crashes - Thanks for your patience";

export function PublicBetaBanner() {
  return (
    <div className="border-b border-[color:var(--kw-border-2)] bg-[linear-gradient(90deg,rgba(var(--kw-accent-rgb),0.12),rgba(10,138,119,0.10),rgba(234,88,12,0.11))]">
      <div className="overflow-hidden py-1.5 [contain:layout_paint]" role="status" aria-label="Public beta notice">
        <p className="px-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-ink-2)] md:hidden">
          {BETA_MESSAGE}
        </p>
        <div className="kw-beta-marquee-track w-max items-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-ink-2)] md:text-[11px]">
          <span className="kw-beta-marquee-segment">{BETA_MESSAGE}</span>
          <span className="kw-beta-marquee-segment" aria-hidden>
            {BETA_MESSAGE}
          </span>
        </div>
      </div>
    </div>
  );
}
