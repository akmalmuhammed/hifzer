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
    <div className="pb-16 pt-10 md:pb-20 md:pt-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)] lg:items-start">
        <section className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Pill tone="brand">Quran Foundation proof</Pill>
            <Pill tone="neutral">Judge-ready route</Pill>
          </div>

          <div>
            <h1 className="max-w-4xl text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
              Hifzer keeps Qur&apos;an practice connected, sourced, and easy to resume.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--kw-muted)]">
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
          <p className="max-w-2xl text-sm leading-6 text-[color:var(--kw-faint)]">
            Connected sync requires the prepared judge account. The read-only reader is available without signing in.
          </p>
        </section>

        <Card className="border-[rgba(var(--kw-accent-rgb),0.28)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
            2-minute demo path
          </p>
          <ol className="mt-4 space-y-3">
            {demoSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-[color:var(--kw-muted)]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] text-xs font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {proofCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="min-h-full">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[20px] border border-[rgba(var(--kw-accent-rgb),0.24)] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
                  <Icon size={21} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--kw-faint)]">
                    {item.label}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{item.body}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(320px,0.45fr)] lg:items-center">
          <div>
            <Pill tone="accent">Submission proof</Pill>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              How the API work shows up for users
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
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
                className="flex items-center gap-3 rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-4 py-3 text-sm font-semibold text-[color:var(--kw-ink)]"
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
