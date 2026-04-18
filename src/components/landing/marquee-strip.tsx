const FEATURES = [
  { label: "Exact ayah place" },
  { label: "Smart bookmarks" },
  { label: "Guided dua modules" },
  { label: "Private journal" },
  { label: "Sabqi, Sabaq, Manzil" },
  { label: "Built-in audio recitation" },
  { label: "Morning and evening adhkar" },
  { label: "Review-first hifz flow" },
];

export function MarqueeStrip() {
  return (
    <div className="border-y border-[rgba(var(--kw-accent-rgb),0.12)] bg-[rgba(var(--kw-accent-rgb),0.04)] py-5">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 md:px-8">
        {FEATURES.map((feature) => (
          <span
            key={feature.label}
            className="rounded-full border border-[rgba(var(--kw-accent-rgb),0.16)] bg-[color:var(--kw-surface-soft)] px-4 py-2 text-[13px] font-medium tracking-wide text-[color:var(--kw-ink)]"
          >
            {feature.label}
          </span>
        ))}
      </div>
    </div>
  );
}
