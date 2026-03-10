import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, MoonStar } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { getAyahById } from "@/hifzer/quran/lookup.server";
import { getQuranReadProgress } from "@/hifzer/quran/read-progress.server";

export const metadata = {
  title: "Ramadan Planner",
};

const TOTAL_AYAHS = 6236;
const TRACKS = [30, 20, 10] as const;

export default async function RamadanPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const profile = await getOrCreateUserProfile(userId);
  if (!profile) {
    redirect("/quran");
  }

  const progress = await getQuranReadProgress(profile.id);
  const remainingAyahs = Math.max(0, TOTAL_AYAHS - progress.uniqueReadAyahCount);
  const cursorAyah = getAyahById(progress.lastReadAyahId ?? profile.quranCursorAyahId) ?? getAyahById(1);
  const resumeHref = `/quran/read?view=compact&surah=${cursorAyah?.surahNumber ?? 1}&cursor=${cursorAyah?.id ?? 1}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Qur'an"
        title="Ramadan planner"
        subtitle="Use this as a seasonal khatmah planner or any focused month-long reading push. The math is simple so the habit stays simple."
      />

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[rgba(var(--kw-accent-rgb),0.12)] blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Current coverage</Pill>
              <Pill tone="neutral">{progress.completionPct.toFixed(1)}%</Pill>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              {remainingAyahs} ayahs left in the current cycle
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Resume from {cursorAyah ? `${cursorAyah.surahNumber}:${cursorAyah.ayahNumber}` : "1:1"} and choose the pace that matches your season.
            </p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/75 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
            <MoonStar size={18} />
          </span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {TRACKS.map((days) => {
          const ayahsPerDay = Math.max(1, Math.ceil(remainingAyahs / days));
          const pagesPerDay = Math.max(1, Math.ceil(ayahsPerDay / 20));
          return (
            <Card key={days}>
              <Pill tone={days === 30 ? "accent" : "neutral"}>{days}-day track</Pill>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">{ayahsPerDay}</p>
              <p className="mt-1 text-sm text-[color:var(--kw-muted)]">Ayahs per day</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Roughly {pagesPerDay} page{pagesPerDay === 1 ? "" : "s"} per day from your current tracked position.
              </p>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Suggested rhythm</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Read after one prayer, listen during a second block, then return to the same passage in the evening if you want better retention. Consistency matters more than heroic daily spikes.
            </p>
          </div>
          <Link
            href={resumeHref}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
          >
            Resume reading <ArrowRight size={14} />
          </Link>
        </div>
      </Card>
    </div>
  );
}
