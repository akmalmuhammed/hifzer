import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

const STORIES = [
  {
    label: "The one who kept restarting",
    title: "I had restarted Hifz so many times that guilt became part of the routine.",
    body:
      "What finally helped was not hype. It was a review flow that caught the slip before it became disappearance, and a product that did not punish human weakness.",
  },
  {
    label: "The parent trying after Fajr",
    title: "My family saw me pray, but they rarely saw me with the Qur'an.",
    body:
      "A few quiet minutes of reading became sustainable once the place was saved, the next step was ready, and trying felt possible again.",
  },
  {
    label: "The revert learning words",
    title: "I needed words for fear, gratitude, and grief, not assumptions that I already knew them.",
    body:
      "Keeping authentic duas nearby turned panic into prayer and made the app feel more like a secret teacher than a public performance.",
  },
] as const;

export function StorySection() {
  return (
    <section id="stories" className="py-10 md:py-14">
      <Card className="px-5 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              Stories
            </p>
            <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              The kinds of journeys this space is built for.
            </h2>
          </div>
          <p className="max-w-[34rem] text-sm leading-7 text-[color:var(--kw-muted)]">
            Not polished success stories. Just the kinds of inner conversations Muslims keep having
            when they want to come back and stay.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STORIES.map((story) => (
            <div
              key={story.label}
              className="rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]"
            >
              <Pill tone="accent">{story.label}</Pill>
              <p className="mt-4 text-lg font-semibold leading-8 tracking-tight text-[color:var(--kw-ink)]">
                {story.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{story.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
              If one of those felt familiar, the page is doing its job.
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              The next step does not need to be dramatic. It just needs to be yours.
            </p>
          </div>
          <Button asChild size="lg">
            <PublicAuthLink signedInHref="/dashboard" signedOutHref="/signup">
              Start your return
            </PublicAuthLink>
          </Button>
        </div>
      </Card>
    </section>
  );
}

