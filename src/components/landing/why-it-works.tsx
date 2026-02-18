import { Card } from "@/components/ui/card";
import { TrackedLink } from "@/components/telemetry/tracked-link";

export function WhyItWorks() {
  return (
    <section className="py-10 md:py-12">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
          Why it works
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
          Hifzer combines active recall, spaced repetition, and continuous-text linking into one daily
          loop so you do not just memorize forward, you retain what you already learned.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold text-[color:var(--kw-ink)]">Built for retention, not streaks.</span>
          <TrackedLink
            href="/compare"
            telemetryName="landing.why.compare"
            className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
          >
            See how we compare
          </TrackedLink>
          <TrackedLink
            href="/welcome"
            telemetryName="landing.why.science"
            className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
          >
            Read the science
          </TrackedLink>
        </div>
      </Card>
    </section>
  );
}
