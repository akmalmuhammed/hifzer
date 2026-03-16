import { Bell, BookOpenText, Bookmark, HandHeart, Headphones, MoonStar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { PublicAuthLink } from "@/components/landing/public-auth-link";
import styles from "./landing.module.css";

const LIVE_FEATURES = [
  {
    label: "Hifz",
    title: "Become a hafiz with steadier review.",
    body:
      "Traditional Sabaq-Sabqi-Manzil structure, review-first flow, and gentler recovery when you miss.",
    note: "The dream you delayed starts today.",
    icon: Bookmark,
    tone: "brand" as const,
  },
  {
    label: "Qur'an reading",
    title: "Never lose your place again.",
    body:
      "Continue where you left off, not where guilt tells you to restart. Keep translations and bookmarks nearby.",
    note: "Read with continuity, not friction.",
    icon: BookOpenText,
    tone: "accent" as const,
  },
  {
    label: "Daily duas",
    title: "Keep taught words close to the heart.",
    body:
      "Open repentance, gratitude, and hardship-focused duas in a calmer surface with Arabic, transliteration, and translation.",
    note: "Because you forget what to say when you need it most.",
    icon: HandHeart,
    tone: "warn" as const,
  },
  {
    label: "Recitation audio",
    title: "Listen with the reciter you trust.",
    body:
      "Replay ayahs, keep your audio preferences nearby, and turn ordinary minutes into remembrance.",
    note: "Useful on commutes, chores, and tired evenings.",
    icon: Headphones,
    tone: "neutral" as const,
  },
  {
    label: "Progress and habits",
    title: "Build the life you promised without vanity.",
    body:
      "See reading progress, Hifz movement, and consistency surfaces without reducing worship to performance.",
    note: "Small actions still carry weight.",
    icon: TrendingUp,
    tone: "accent" as const,
  },
  {
    label: "Reminders",
    title: "Receive a gentle nudge when life gets loud.",
    body:
      "A small reminder can save a lost day, especially when intention is present and attention is thin.",
    note: "Mercy often looks like one timely nudge.",
    icon: Bell,
    tone: "brand" as const,
  },
  {
    label: "Ramadan mode",
    title: "Bring structure into the month that matters most.",
    body:
      "Ramadan planning, Laylat al-Qadr guidance, and seasonal worship surfaces stay close when the heart is already turning back.",
    note: "Do not spend the month searching for structure.",
    icon: MoonStar,
    tone: "warn" as const,
  },
] as const;

const REQUESTED_NEXT = [
  "Tafsir and deeper meaning surfaces",
  "Prayer-linked timing and qibla-aware moments",
  "Private reflection and journaling spaces",
  "Hijri and Islamic calendar layers",
] as const;

export function SessionWalkthrough() {
  return (
    <section id="features" className="py-10 md:py-14">
      <Card className={`${styles.sectionShell} px-5 py-6 sm:px-6 sm:py-7`}>
        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
              What&apos;s inside
            </p>
            <h2 className="kw-marketing-display mt-4 max-w-[14ch] text-balance text-4xl leading-[0.98] tracking-[-0.05em] text-[color:var(--kw-ink)] sm:text-5xl">
              Your space. Your tools. Explore everything.
            </h2>
            <p className="mt-4 max-w-[60ch] text-sm leading-8 text-[color:var(--kw-muted)]">
              The core app is free to use. No subscription tiers. No paid wall across the main
              reading, Hifz, and dua experience. Just open and use what serves you.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {LIVE_FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={styles.featureCard}>
                  <div className="flex items-center justify-between gap-3">
                    <Pill tone={item.tone}>{item.label}</Pill>
                    <span className="grid h-10 w-10 place-items-center rounded-[16px] border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink-2)]">
                      <Icon size={16} />
                    </span>
                  </div>
                  <p className="mt-4 text-lg font-semibold leading-7 tracking-tight text-[color:var(--kw-ink)]">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{item.body}</p>
                  <p className="mt-4 text-sm font-semibold text-[color:var(--kw-ink-2)]">{item.note}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[0.88fr_1.12fr] xl:items-start">
          <div className="rounded-[24px] border border-[color:var(--kw-border)] bg-[color:var(--kw-card)] px-4 py-4 shadow-[var(--kw-shadow-soft)]">
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
              And when something still feels missing, tell us.
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              The roadmap stays open because real worship tools should be shaped by real worship
              needs.
            </p>
            <div className="mt-4">
              <Button asChild size="lg">
                <PublicAuthLink signedInHref="/roadmap" signedOutHref="/signup">
                  See what&apos;s next
                </PublicAuthLink>
              </Button>
            </div>
          </div>

          <div className={styles.storyGrid}>
            {REQUESTED_NEXT.map((item) => (
              <div key={item} className={styles.storyCard}>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone="neutral">Requested next</Pill>
                  <Pill tone="brand">Roadmap</Pill>
                </div>
                <p className="mt-4 text-base font-semibold leading-7 tracking-tight text-[color:var(--kw-ink)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
