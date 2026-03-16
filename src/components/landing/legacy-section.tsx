import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const TIME_ALTERNATIVES = [
  "A few hours of scrolling can become pages of Qur'an over a year.",
  "A handful of quiet minutes each day can become a steadier heart by next Ramadan.",
  "Small, repeated acts can become the habits your family remembers from you.",
] as const;

const LEGACY_POINTS = [
  "They were always going to memorize it.",
  "They lived with the Qur'an every single day.",
] as const;

export function LegacySection() {
  return (
    <section className="py-10 md:py-14">
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card className="px-5 py-6 sm:px-6">
          <Pill tone="warn">The legacy you leave</Pill>
          <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
            How would you want to be remembered?
          </h2>
          <p className="mt-4 text-sm leading-8 text-[color:var(--kw-muted)]">
            Imagine your janazah. What do people say about your relationship with the Qur&apos;an?
          </p>

          <div className="mt-6 space-y-3">
            {LEGACY_POINTS.map((point, index) => (
              <div
                key={point}
                className="rounded-[22px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                  {index === 0 ? "One ending" : "Another ending"}
                </p>
                <p className="mt-2 text-base font-semibold leading-7 text-[color:var(--kw-ink)]">{point}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm leading-7 text-[color:var(--kw-muted)]">
            The difference between those two endings is made of ordinary daily decisions. Made
            gentler. Made simpler. Made repeatable.
          </p>
        </Card>

        <Card className="px-5 py-6 sm:px-6">
          <Pill tone="accent">The math you cannot ignore</Pill>
          <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
            A little less scrolling can become a lot more Qur&apos;an.
          </h2>
          <p className="mt-4 text-sm leading-8 text-[color:var(--kw-muted)]">
            Not by sacrificing rest. Not by becoming someone else overnight. Just by handing even a
            portion of distracted time back to something that stays with you.
          </p>

          <div className="mt-6 space-y-3">
            {TIME_ALTERNATIVES.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]"
              >
                <p className="text-sm leading-7 text-[color:var(--kw-ink)]">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[22px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
              What stays with you matters more than what only fills the moment.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
