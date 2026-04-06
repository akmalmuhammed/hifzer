import { ArrowRight } from "lucide-react";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import styles from "./landing.module.css";

const PATHS = [
  {
    label: "If you want structure",
    title: "Start with the setup flow and let it shape a starting point.",
    body: "Tell Hifzer your level, your time, and what you want to focus on first. Adjust the path once you are inside.",
  },
  {
    label: "If you want to explore",
    title: "Open the surfaces and begin where your heart already leans.",
    body: "Maybe that is a dua you want nearby, a surah you want to resume, or a reminder you have been postponing.",
  },
  {
    label: "If you want to just read",
    title: "Open the Qur'an and continue where you are.",
    body: "No dramatic reset. No pressure to turn reading into a bigger plan before you are ready.",
  },
  {
    label: "If you want to build something custom",
    title: "Use the pieces that fit your life and ignore the rest.",
    body: "Bookmarks, reminders, Hifz structure, progress, and dua can work together or stand alone. There is no single correct pattern here.",
  },
] as const;

const JOURNEY = [
  {
    day: "Day 1",
    copy: "I opened it and it felt like mine immediately.",
  },
  {
    day: "Day 30",
    copy: "I built a routine I actually kept.",
  },
  {
    day: "Day 180",
    copy: "I did not expect to still be here, but the tool grew with me.",
  },
  {
    day: "Day 365",
    copy: "Ramadan again. This time, I came prepared.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-10 md:py-14">
      <Card className={`${styles.sectionShell} px-5 py-6 sm:px-6 sm:py-7`}>
        <div className="grid gap-8 xl:grid-cols-[0.96fr_1.04fr] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              How it works
            </p>
            <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              Open it. Explore. Make it yours.
            </h2>
            <p className="mt-4 max-w-[60ch] text-sm leading-8 text-[color:var(--kw-muted)]">
              Some people want a starting plan. Some want to tap around and find their own rhythm.
              Hifzer makes room for both.
            </p>

            <div className="mt-7 space-y-3">
              {PATHS.map((item) => (
                <div key={item.label} className={styles.storyCard}>
                  <Pill tone="neutral">{item.label}</Pill>
                  <p className="mt-4 text-base font-semibold leading-7 tracking-tight text-[color:var(--kw-ink)]">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="rounded-[26px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                There is room for structure here, but there is no single correct first move.
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                The only real goal is to lower the distance between intention and action.
              </p>
            </div>

            <div className={`${styles.journeyGrid} mt-5`}>
              {JOURNEY.map((item) => (
                <div key={item.day} className={styles.journeyCard}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                    {item.day}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--kw-ink)]">{item.copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <PublicAuthLink signedInHref="/dashboard" signedOutHref="/signup">
                  Create my free space <ArrowRight size={16} />
                </PublicAuthLink>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <PublicAuthLink signedInHref="/quran/read" signedOutHref="/quran-preview">
                  Preview the Qur&apos;an reader
                </PublicAuthLink>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

