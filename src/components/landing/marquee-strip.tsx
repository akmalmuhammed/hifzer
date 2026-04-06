const FEATURES = [
  { label: "Daily Hifz review" },
  { label: "Qur'an reading" },
  { label: "Guided duas" },
  { label: "Private journal" },
  { label: "Bookmarks and notes" },
  { label: "Exact reading place" },
  { label: "Review before forgetting" },
  { label: "Morning and evening adhkar" },
  { label: "Streaks and milestones" },
  { label: "Works Offline" },
  { label: "Audio recitation" },
  { label: "Simple daily flow" },
];

export function MarqueeStrip() {
  const items = [...FEATURES, ...FEATURES];

  return (
    <div
      className="relative overflow-hidden border-y border-[rgba(var(--kw-accent-rgb),0.12)] bg-[rgba(var(--kw-accent-rgb),0.04)] py-5"
      aria-hidden="true"
    >
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[color:var(--kw-bg)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[color:var(--kw-bg)] to-transparent" />

      <div className="kw-marquee-track flex w-max items-center">
        {items.map((feature, i) => (
          <span key={i} className="flex shrink-0 items-center gap-5 px-5">
            {/* Accent diamond separator */}
            <span
              className="h-1.5 w-1.5 shrink-0 rotate-45 rounded-[2px]"
              style={{ background: "rgba(var(--kw-accent-rgb),0.5)" }}
            />
            <span className="whitespace-nowrap text-[13px] font-medium tracking-wide text-[color:var(--kw-ink)] opacity-70">
              {feature.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
