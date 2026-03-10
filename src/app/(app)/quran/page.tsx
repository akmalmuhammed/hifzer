import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowRight, BookMarked, BookOpen, Compass, EyeOff, Headphones, MoonStar, Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getReciterLabel } from "@/hifzer/audio/reciters";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { getAyahById, getSurahInfo, listJuzs, listSurahs } from "@/hifzer/quran/lookup.server";
import { getQuranReadProgress } from "@/hifzer/quran/read-progress.server";
import { DEFAULT_QURAN_TRANSLATION_ID, getQuranTranslationOption } from "@/hifzer/quran/translation-prefs";
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
  if (clerkEnabled()) {
    const { userId } = await auth();
    if (userId) {
      profile = await getOrCreateUserProfile(userId);
      if (profile) {
        readCoverage = await getQuranReadProgress(profile.id);
      }
    }
  }

  const progressAyahId = readCoverage.lastReadAyahId ?? profile?.quranCursorAyahId ?? 1;
  const selectedTranslation = getQuranTranslationOption(profile?.quranTranslationId ?? DEFAULT_QURAN_TRANSLATION_ID);

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
  const activeReciterLabel = getReciterLabel(profile?.reciterId ?? "default");

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Qur&apos;an</Pill>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
            Recite the Qur&apos;an. It will intercede for you.
            <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Keep one clean path for daily recitation.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
            Resume exactly where you stopped, use private mode when needed, and keep your read progress consistent.
            <span className="ml-2 inline-flex items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-0.5 align-middle text-[10px] font-semibold leading-none tracking-[0.08em] text-[color:var(--kw-faint)]">
              Sahih Muslim 804a
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/quran/glossary"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.24)] bg-[rgba(var(--kw-accent-rgb),0.1)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Open Qur&apos;anic glossary search
            </Link>
            <Link
              href="/quran/read?view=compact"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.24)] bg-[rgba(var(--kw-accent-rgb),0.1)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Continue reading <ArrowRight size={14} />
            </Link>
            <Link
              href="/quran/bookmarks"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-ink)]"
            >
              Open smart bookmarks
              <BookMarked size={14} />
            </Link>
            <Link
              href="/dua"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(194,65,12,0.22)] bg-[rgba(194,65,12,0.10)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-ember-600)]"
            >
              Laylat al-Qadr dua
              <MoonStar size={14} />
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

      <div className="mt-8">
        <QuranReadingPlanCard
          totalAyahs={totalAyahs}
          completedAyahCount={readCoverage.uniqueReadAyahCount}
          continueHref={trackedHref}
          anonymousHref={anonymousHref}
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

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-12 -top-10 h-32 w-32 rounded-full bg-[rgba(var(--kw-accent-rgb),0.12)]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Pill tone="accent">Listening mode</Pill>
              <span className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Read less, hear more</span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              Keep one reciter in your ears every day.
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Use compact mode with auto-advance for commute, chores, or evening review. Stay in the same voice when you want stronger auditory recall.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone="neutral">Active: {activeReciterLabel}</Pill>
              <Pill tone="neutral">Auto-next available</Pill>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={trackedHref}
                className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-4 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
              >
                Start listening <Headphones size={15} />
              </Link>
              <Link
                href="/settings/reciter"
                className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
              >
                Change reciter <Radio size={15} />
              </Link>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-12 -top-20 h-40 w-40 rounded-full bg-[rgba(255,152,52,0.12)]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Pill tone="warn">Khatmah rhythm</Pill>
              <span className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Seasonal planning</span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              Plan ahead for Ramadan or any focused month.
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Your current coverage is {readCoverage.completionPct.toFixed(1)}%. Use the reading-plan card above to choose a 30-day, 90-day, or year-long khatmah track and keep the same pace.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone="neutral">Khatmah completed: {readCoverage.completionKhatmahCount}</Pill>
              <Pill tone="neutral">Last tracked ayah: #{lastAyah?.id ?? 1}</Pill>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/ramadan"
                className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,152,52,0.35)] bg-[rgba(255,152,52,0.14)] px-4 py-2 text-sm font-semibold text-[rgb(163,89,24)]"
              >
                Open Ramadan planner <ArrowRight size={15} />
              </Link>
              <Link
                href={trackedHref}
                className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
              >
                Resume today&apos;s reading
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Pill tone="neutral">Source trust</Pill>
              <span className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Content provenance</span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
              Keep the Qur&apos;an stack traceable.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
              Arabic text and metadata are bundled from Tanzil. Your default translation is{" "}
              <span className="font-semibold text-[color:var(--kw-ink)]">{selectedTranslation?.label ?? "Unknown"}</span>{" "}
              from <span className="font-semibold text-[color:var(--kw-ink)]">{selectedTranslation?.sourceLabel ?? "Unknown"}</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">Arabic text: Tanzil</Pill>
            <Pill tone={selectedTranslation?.sourceStatus === "verified" ? "accent" : "warn"}>
              {selectedTranslation?.sourceStatus === "verified" ? "Translation source verified" : "Translation review pending"}
            </Pill>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-[color:var(--kw-faint)]">
          {selectedTranslation?.sourceNote ?? "Source notes unavailable for this translation."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/legal/sources"
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
          >
            View source registry
          </Link>
          <Link
            href="/settings/language"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-4 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
          >
            Review translation language
          </Link>
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
        </Card>
      </div>

    </div>
  );
}
