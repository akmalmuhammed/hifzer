import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookMarked, BookOpenText, CheckCircle2, Headphones, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata: Metadata = {
  title: "Hackathon API Proof",
  description:
    "A judge-ready walkthrough of how Hifzer uses Quran Foundation content, Quran.com sync, and Quran MCP-grounded understanding.",
  alternates: {
    canonical: "/judge",
  },
  robots: {
    index: false,
    follow: true,
  },
};

const proofCards = [
  {
    icon: BookOpenText,
    label: "Official reading context",
    title: "Translations and tafsir stay beside the ayah.",
    body: "Hifzer enriches the reader with trusted Qur'an text, translation, tafsir, verse context, and page/juz/hizb markers without pulling the reader out of flow.",
  },
  {
    icon: Headphones,
    label: "Trusted recitation",
    title: "Reciter audio is selected inside the same reader.",
    body: "Readers choose the reciter they need inside the same reading surface, so listening supports the ayah instead of becoming another tab.",
  },
  {
    icon: BookMarked,
    label: "Connected memory",
    title: "Bookmarks, folders, notes, goals, and streaks can sync.",
    body: "A connected Quran.com account lets saved ayahs, folders, notes, reading place, goals, and streak signals stay connected to the person who is practicing.",
  },
  {
    icon: MessageSquareQuote,
    label: "Grounded answers",
    title: "Questions start from sources, not guesswork.",
    body: "Ask Qur'an retrieves ayahs, translations, tafsir summaries, and source labels before generating an answer.",
  },
] as const;

const demoSteps = [
  "Open the read-only reader and start from Surah 1:1.",
  "Turn on translation, tafsir, and reciter audio from the reader filters.",
  "Sign in or use the prepared judge account to save a bookmark and connect Quran.com.",
  "Open Ask Qur'an to ask a source-grounded question and inspect matched ayahs.",
  "Return to the dashboard to show the daily loop: read, retain, reflect, and return tomorrow.",
] as const;

export default function JudgePage() {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-[1.4rem] pb-24 pt-14 md:pb-32 md:pt-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)] lg:items-start">
        <section className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Pill tone="brand">Quran Foundation proof</Pill>
            <Pill tone="neutral">Judge-ready route</Pill>
          </div>

          <div>
            <h1 className="max-w-4xl text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.034em] text-[color:var(--kw-ink)]">
              Hifzer keeps Qur&apos;an practice connected, sourced, and easy to resume.
            </h1>
            <p className="mt-5 max-w-2xl text-[clamp(1.1rem,1.6vw,1.3rem)] leading-[1.42] tracking-[-0.014em] text-[color:var(--kw-muted)]">
              Reviewers can see the working proof quickly: trusted Qur&apos;an content in the reader, connected
              Quran.com memory, and source-grounded AI answers in the actual Hifzer flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/quran/read?view=compact&anon=1&surah=1&cursor=1&translation=1&tafsir=1&ignoreSaved=1">
                Open read-only reader <ArrowRight size={17} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link href="/settings/quran-foundation">
                View connected sync status <ArrowRight size={17} />
              </Link>
            </Button>
          </div>
          <p className="max-w-2xl text-[0.94rem] leading-[1.5] text-[color:var(--kw-faint)]">
            Connected sync requires the prepared judge account. The read-only reader is available without signing in.
          </p>
        </section>

        <Card className="rounded-[28px]! border-0! p-7! shadow-none! md:p-9!">
          <p className="text-[0.9rem] font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
            2-minute demo path
          </p>
          <ol className="mt-5 space-y-3.5">
            {demoSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-[0.98rem] leading-[1.5] text-[color:var(--kw-ink-2)]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[rgba(var(--kw-accent-rgb),0.1)] text-xs font-semibold tabular-nums text-[rgba(var(--kw-accent-rgb),1)]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="mt-16 grid gap-4 md:mt-24 md:grid-cols-2">
        {proofCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="min-h-full rounded-[28px]! border-0! p-7! shadow-none! md:p-9!">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
                  <Icon size={21} />
                </span>
                <div>
                  <p className="text-[0.9rem] font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                    {item.label}
                  </p>
                  <h2 className="mt-2 text-[1.6rem] font-semibold leading-[1.12] tracking-[-0.025em] text-[color:var(--kw-ink)]">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-[1.02rem] leading-[1.55] text-[color:var(--kw-muted)]">{item.body}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4 rounded-[28px]! border-0! p-7! shadow-none! md:p-9!">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.45fr)] lg:items-center">
          <div>
            <Pill tone="accent">Submission proof</Pill>
            <h2 className="mt-4 text-[clamp(1.8rem,3vw,2.4rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[color:var(--kw-ink)]">
              How the API work shows up for users
            </h2>
            <p className="mt-3 text-[1.02rem] leading-[1.55] text-[color:var(--kw-muted)]">
              Hifzer uses Quran Foundation content so the reader can show trusted translations, tafsir, ayah
              metadata, and reciter audio in context. Connected Quran.com accounts unlock memory that travels:
              bookmarks, folders, notes, reading place, activity, goals, and streak signals. Grounded AI keeps
              answers tied back to ayahs, translation, tafsir summaries, and source labels.
            </p>
          </div>
          <div className="grid gap-2">
            {["Official content", "Connected memory", "Grounded answers", "Reader demo"].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[14px] bg-[color:var(--kw-page)] px-4 py-3.5 text-[0.98rem] font-medium text-[color:var(--kw-ink)]"
              >
                <CheckCircle2 size={17} className="text-[rgba(var(--kw-accent-rgb),1)]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
