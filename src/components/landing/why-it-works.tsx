import { Card } from "@/components/ui/card";
import { TrackedLink } from "@/components/telemetry/tracked-link";

const REASONS = [
  {
    title: "The next step is obvious",
    copy: "You are not dropped into clutter. Hifzer brings today's next move forward so returning feels lighter.",
  },
  {
    title: "The lanes stay honest",
    copy: "Reading, Hifz, and dua do not overwrite each other just to make the app look busier than it is.",
  },
  {
    title: "Trust stays close",
    copy: "Guided modules and source notes are nearby when you want them without turning the page into noise.",
  },
] as const;

export function WhyItWorks() {
  return (
    <section id="why-hifzer" className="py-10 md:py-12">
      <Card>
        <div className="grid gap-6 md:grid-cols-[0.92fr_1.08fr] md:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
              Why it feels calmer
            </p>
            <h2 className="kw-marketing-display mt-3 text-balance text-3xl leading-tight text-[color:var(--kw-ink)] sm:text-4xl">
              Less religious clutter. More honest return.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--kw-muted)]">
              Hifzer is trying to reduce friction, not manufacture hype. The product stays lighter
              because it helps you continue what matters instead of making you manage more digital noise.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            {REASONS.map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/72 px-4 py-4"
              >
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold text-[color:var(--kw-ink)]">Explore before you commit.</span>
          <TrackedLink
            href="/compare"
            telemetryName="landing.why.compare"
            className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
          >
            Compare Hifzer
          </TrackedLink>
          <TrackedLink
            href="/legal/sources"
            telemetryName="landing.why.science"
            className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
          >
            Read source notes
          </TrackedLink>
          <TrackedLink
            href="/motivation"
            telemetryName="landing.motivation_link"
            className="font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
          >
            Browse daily motivation
          </TrackedLink>
        </div>
      </Card>
    </section>
  );
}
