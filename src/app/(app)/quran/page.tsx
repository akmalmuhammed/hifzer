import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, BookMarked, BookOpen, Compass, MoonStar } from "lucide-react";
import { DistractionFreeToggle } from "@/components/app/distraction-free-toggle";
import { SurahProgressSection } from "@/components/progress/surah-progress-section";
import { DisclosureCard } from "@/components/ui/disclosure-card";
import { Pill } from "@/components/ui/pill";
import { listQuranSurahProgress } from "@/hifzer/progress/surah-progress.server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { getAyahById, listJuzs, listSurahs } from "@/hifzer/quran/lookup.server";
import { getQuranReadProgress } from "@/hifzer/quran/read-progress.server";
import { clerkEnabled } from "@/lib/clerk-config";
import { QuranCompletionProgress } from "./quran-completion-progress";
import { QuranProgressBackfill } from "./quran-progress-backfill";
import { QuranReadingPlanCard } from "./quran-reading-plan-card";

export const metadata = {
  title: "Qur'an",
};

export default async function QuranIndexPage() {
  const totalAyahs = 6236;
  let profile = null as Awaited<ReturnType<typeof getOrCreateUserProfile>>;
  let readCoverage = {
    uniqueReadAyahCount: 0,
    completionPct: 0,
    completionKhatmahCount: 0,
    lastReadAyahId: null as number | null,
    lastReadAt: null as string | null,
  };
  let surahProgressItems = [] as Awaited<ReturnType<typeof listQuranSurahProgress>>;
  if (clerkEnabled()) {
    const { userId } = await auth();
    if (userId) {
      profile = await getOrCreateUserProfile(userId);
      if (profile) {
        [readCoverage, surahProgressItems] = await Promise.all([
          getQuranReadProgress(profile.id),
          listQuranSurahProgress(userId),
        ]);
      }
    }
  }

  const progressAyahId = profile?.quranCursorAyahId ?? readCoverage.lastReadAyahId ?? 1;
  const surahs = listSurahs();
  const juzs = listJuzs();
  const lastAyah = getAyahById(progressAyahId) ?? getAyahById(1);

  const trackedParams = new URLSearchParams({ view: "compact" });
  if (lastAyah) {
    trackedParams.set("surah", String(lastAyah.surahNumber));
    trackedParams.set("cursor", String(lastAyah.id));
  }
  const trackedHref = `/quran/read?${trackedParams.toString()}`;
  const anonymousHref = `${trackedHref}&anon=1`;
  const toolLinkClass = "inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] transition hover:bg-white";

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Pill tone="neutral">Qur&apos;an</Pill>
        <DistractionFreeToggle />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={trackedHref}
          className="kw-subtle-emphasis inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-4 py-2.5 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
        >
          Continue reading <ArrowRight size={14} />
        </Link>
        <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
          <BookOpen size={18} />
        </span>
      </div>

      <div className="mt-8">
        <QuranCompletionProgress
          completionPct={readCoverage.completionPct}
          completedAyahCount={readCoverage.uniqueReadAyahCount}
          totalAyahs={totalAyahs}
          currentSurahNumber={lastAyah?.surahNumber ?? 1}
          currentAyahNumber={lastAyah?.ayahNumber ?? 1}
          completedKhatmahCount={readCoverage.completionKhatmahCount}
          resumeHref={trackedHref}
        />
      </div>

      <div className="mt-8">
        <QuranReadingPlanCard
          totalAyahs={totalAyahs}
          completedAyahCount={readCoverage.uniqueReadAyahCount}
          continueHref={trackedHref}
          anonymousHref={anonymousHref}
        />
      </div>
      <div className="mt-8">
        <SurahProgressSection
          title="Surah progress"
          subtitle="Finished surahs stay marked in green, and the surah you are reading keeps its percentage so you can return to the same place easily."
          items={surahProgressItems.slice(0, 8)}
          viewAllHref="/quran/progress"
          emptyTitle="No surah progress yet"
          emptyBody="Start reading and your current and finished surahs will appear here."
        />
      </div>

      <div className="mt-8">
        <DisclosureCard
          summary={(
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">More reading tools</p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
                Open bookmarks, jump by surah or juz, save reading done elsewhere, or return to the dashboard when needed.
              </p>
            </div>
          )}
        >
          <div className="space-y-5">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Link href="/quran/glossary" className={toolLinkClass}>
                Open Qur&apos;anic glossary search
              </Link>
              <Link href="/quran/bookmarks" className={toolLinkClass}>
                Open smart bookmarks
                <BookMarked size={14} />
              </Link>
              <Link href="/dua" className={toolLinkClass}>
                Laylat al-Qadr dua
                <MoonStar size={14} />
              </Link>
              <Link href="/quran/progress" className={toolLinkClass}>
                See all surahs
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-[color:var(--kw-faint)]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Quick jump</p>
                </div>
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Start reading from any surah.</p>
                <form className="mt-4 flex flex-wrap items-center gap-2" method="get" action="/quran/read">
                  <input type="hidden" name="view" value="compact" />
                  <label className="sr-only" htmlFor="quran-jump-surah">
                    Surah
                  </label>
                  <select
                    id="quran-jump-surah"
                    name="surah"
                    defaultValue={String(lastAyah?.surahNumber ?? 1)}
                    className="h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)] sm:min-w-[220px] sm:w-auto"
                  >
                    {surahs.map((surah) => (
                      <option key={surah.surahNumber} value={surah.surahNumber}>
                        Surah {surah.surahNumber} - {surah.nameTransliteration}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="h-10 w-full rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-4 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] sm:w-auto"
                  >
                    Open surah
                  </button>
                </form>
              </div>

              <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-[color:var(--kw-faint)]" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Jump by juz</p>
                </div>
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Start reading from any juz.</p>
                <form className="mt-4 flex flex-wrap items-center gap-2" method="get" action="/quran/read">
                  <input type="hidden" name="view" value="compact" />
                  <label className="sr-only" htmlFor="quran-jump-juz">
                    Juz
                  </label>
                  <select
                    id="quran-jump-juz"
                    name="cursor"
                    defaultValue={String(juzs[0]?.startAyahId ?? 1)}
                    className="h-10 w-full rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)] sm:min-w-[220px] sm:w-auto"
                  >
                    {juzs.map((juz) => (
                      <option key={juz.juzNumber} value={juz.startAyahId}>
                        Juz {juz.juzNumber}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="h-10 w-full rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-4 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] sm:w-auto"
                  >
                    Open juz
                  </button>
                </form>
              </div>
            </div>

            <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <QuranProgressBackfill
                defaultSurahNumber={lastAyah?.surahNumber ?? 1}
                surahs={surahs.map((surah) => ({
                  surahNumber: surah.surahNumber,
                  ayahCount: surah.ayahCount,
                  startAyahId: surah.startAyahId,
                  nameTransliteration: surah.nameTransliteration,
                }))}
              />
            </div>
          </div>
        </DisclosureCard>
      </div>
    </div>
  );
}
