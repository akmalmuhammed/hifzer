import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, BookMarked, BookOpen, Compass, EyeOff, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { getAyahById, getSurahInfo, listJuzs, listSurahs } from "@/hifzer/quran/lookup.server";
import { getQuranReadProgress } from "@/hifzer/quran/read-progress.server";
import { clerkEnabled } from "@/lib/clerk-config";
import { QuranCompletionProgress } from "./quran-completion-progress";
import { QuranProgressBackfill } from "./quran-progress-backfill";
import { QuranSurahSearch } from "./quran-surah-search";

export const metadata = {
  title: "Qur'an",
};

export default async function QuranIndexPage() {
  const totalAyahs = 6236;
  let readCoverage = {
    uniqueReadAyahCount: 0,
    completionPct: 0,
    completionKhatmahCount: 0,
    lastReadAyahId: null as number | null,
    lastReadAt: null as string | null,
  };
  if (clerkEnabled()) {
    const { userId } = await auth();
    if (userId) {
      const profile = await getOrCreateUserProfile(userId);
      if (profile) {
        readCoverage = await getQuranReadProgress(profile.id);
      }
    }
  }

  const progressAyahId = readCoverage.lastReadAyahId ?? 1;

  const surahs = listSurahs();
  const juzs = listJuzs();
  const lastAyah = getAyahById(progressAyahId) ?? getAyahById(1);
  const lastSurah = getSurahInfo(lastAyah?.surahNumber ?? 1);
  const surahProgress = lastSurah && lastAyah ? Math.round((lastAyah.ayahNumber / lastSurah.ayahCount) * 100) : 0;
  const nextSurahNumber = lastSurah &&
      lastAyah &&
      lastAyah.ayahNumber >= lastSurah.ayahCount &&
      lastSurah.surahNumber < 114
    ? lastSurah.surahNumber + 1
    : null;
  const nextSurahHref = nextSurahNumber != null
    ? `/quran/read?${new URLSearchParams({ view: "compact", surah: String(nextSurahNumber) }).toString()}`
    : null;

  const trackedParams = new URLSearchParams({ view: "compact" });
  if (lastAyah) {
    trackedParams.set("surah", String(lastAyah.surahNumber));
    trackedParams.set("cursor", String(lastAyah.id));
  }
  const trackedHref = `/quran/read?${trackedParams.toString()}`;
  const anonymousHref = `${trackedHref}&anon=1`;

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Qur&apos;an</Pill>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
            Read the Qur&apos;an with focus.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Resume instantly or open an anonymous window.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
            Keep your reading flow clean: one primary resume path, one private path, smart bookmarks, and quick jump controls.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/quran/glossary"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.24)] bg-[rgba(var(--kw-accent-rgb),0.1)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Open Qur&apos;anic glossary search
            </Link>
            <Link
              href="/quran/bookmarks"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-ink)]"
            >
              Open smart bookmarks
              <BookMarked size={14} />
            </Link>
          </div>
        </div>
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

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[rgba(var(--kw-accent-rgb),0.09)]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Pill tone="accent">Continue reading</Pill>
              <span className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Tracked mode</span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              {lastSurah?.nameTransliteration ?? "Surah 1"} {lastAyah ? `${lastAyah.surahNumber}:${lastAyah.ayahNumber}` : "1:1"}
            </p>
            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
              Surah progress {surahProgress}% | Last tracked global ayah #{lastAyah?.id ?? 1}
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-[rgba(var(--kw-accent-rgb),0.75)] transition-[width]"
                style={{ width: `${surahProgress}%` }}
              />
            </div>
            <Link
              href={trackedHref}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-4 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Continue where I stopped
              <ArrowRight size={15} />
            </Link>
            {nextSurahHref ? (
              <Link
                href={nextSurahHref}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
              >
                Go to next surah
                <ArrowRight size={15} />
              </Link>
            ) : null}
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-12 -top-20 h-40 w-40 rounded-full bg-[rgba(255,152,52,0.12)]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Pill tone="warn">Private mode</Pill>
              <span className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">No tracking</span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">Anonymous window</p>
            <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
              Read without updating last-read position and without streak tracking from browse audio playback.
            </p>
            <Link
              href={anonymousHref}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgba(255,152,52,0.35)] bg-[rgba(255,152,52,0.14)] px-4 py-2 text-sm font-semibold text-[rgb(163,89,24)]"
            >
              Open anonymous window
              <EyeOff size={15} />
            </Link>
          </div>
        </Card>
      </div>

      <Card className="mt-8">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-[color:var(--kw-faint)]" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Search surahs</p>
        </div>
        <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
          Find a surah by name, English meaning, or number.
        </p>
        <div className="mt-4">
          <QuranSurahSearch
            surahs={surahs.map((s) => ({
              surahNumber: s.surahNumber,
              nameTransliteration: s.nameTransliteration,
              nameArabic: s.nameArabic,
              nameEnglish: s.nameEnglish,
              ayahCount: s.ayahCount,
            }))}
          />
        </div>
      </Card>

      <Card className="mt-8">
        <QuranProgressBackfill
          defaultSurahNumber={lastAyah?.surahNumber ?? 1}
          surahs={surahs.map((surah) => ({
            surahNumber: surah.surahNumber,
            ayahCount: surah.ayahCount,
            startAyahId: surah.startAyahId,
            nameTransliteration: surah.nameTransliteration,
          }))}
        />
      </Card>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Quick jump</p>
          </div>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Start compact reading from any surah.</p>
          <form className="mt-4 flex flex-wrap items-center gap-2" method="get" action="/quran/read">
            <input type="hidden" name="view" value="compact" />
            <label className="sr-only" htmlFor="quran-jump-surah">
              Surah
            </label>
            <select
              id="quran-jump-surah"
              name="surah"
              defaultValue={String(lastAyah?.surahNumber ?? 1)}
              className="h-10 min-w-[220px] rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
            >
              {surahs.map((surah) => (
                <option key={surah.surahNumber} value={surah.surahNumber}>
                  Surah {surah.surahNumber} - {surah.nameTransliteration}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-4 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Open surah
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Jump by juz</p>
          </div>
          <p className="mt-2 text-sm text-[color:var(--kw-muted)]">Start compact reading from any juz range.</p>
          <form className="mt-4 flex flex-wrap items-center gap-2" method="get" action="/quran/read">
            <input type="hidden" name="view" value="compact" />
            <label className="sr-only" htmlFor="quran-jump-juz">
              Juz
            </label>
            <select
              id="quran-jump-juz"
              name="juz"
              defaultValue="1"
              className="h-10 min-w-[220px] rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 text-sm text-[color:var(--kw-ink)]"
            >
              {juzs.map((juz) => (
                <option key={juz.juzNumber} value={juz.juzNumber}>
                  Juz {juz.juzNumber}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-4 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Open juz
            </button>
          </form>
        </Card>
      </div>

    </div>
  );
}
