import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { JournalPrefillLink } from "@/components/journal/journal-prefill-link";
import { QuranViewportProgressTracker } from "@/components/quran/quran-viewport-progress-tracker";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getProfileSnapshot } from "@/hifzer/profile/server";
import { getSurahInfo, listAyahsForSurah } from "@/hifzer/quran/lookup.server";
import { getSahihTranslationByAyahId } from "@/hifzer/quran/translation.server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";

const QURAN_AUDIO_SPEED_PREF_KEY = "hifzer_quran_audio_speed_v1";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const surahNumber = Number(params.id);
  const info = getSurahInfo(surahNumber);
  return {
    title: info ? `Surah ${info.surahNumber} - ${info.nameTransliteration}` : "Surah",
  };
}

export default async function SurahPage(props: { params: Promise<{ id: string }> }) {
  const userId = await resolveClerkUserIdForServer();
  const profile = userId ? await getProfileSnapshot(userId) : null;
  const reciterId = profile?.reciterId ?? "default";
  const params = await props.params;
  const surahNumber = Number(params.id);
  const info = getSurahInfo(surahNumber);

  if (!info) {
    return (
      <div className="pb-12 pt-10 md:pb-16 md:pt-14">
        <Pill tone="warn">Not found</Pill>
        <h1 className="mt-4 font-[family-name:var(--font-kw-display)] text-4xl tracking-tight text-[color:var(--kw-ink)]">
          Surah not found.
        </h1>
        <p className="mt-3 text-sm text-[color:var(--kw-muted)]">
          The surah number must be between 1 and 114.
        </p>
        <div className="mt-6">
          <Link href="/quran" className="text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline">
            Back to index
          </Link>
        </div>
      </div>
    );
  }

  const ayahs = listAyahsForSurah(info.surahNumber);

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Link
        href="/quran"
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 text-[0.94rem] font-medium text-[rgba(var(--kw-accent-rgb),1)] transition-colors duration-200 hover:bg-[rgba(var(--kw-accent-rgb),0.08)]"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mt-6">
        <Pill tone="neutral">Surah {info.surahNumber}</Pill>
        <h1 className="kw-page-title mt-4 text-balance text-[color:var(--kw-ink)]">
          <span dir="rtl" lang="ar" className="inline-block font-[family-name:var(--font-kw-quran)] font-normal leading-[1.6] tracking-normal">{info.nameArabic}</span>
          <span className="mt-1 block text-lg font-semibold tracking-tight text-[color:var(--kw-ink-2)]">
            {info.nameTransliteration} - {info.nameEnglish}
          </span>
        </h1>
        <p className="kw-page-subtitle mt-3 text-[color:var(--kw-muted)]">
          {info.revelationType} - {info.ayahCount} ayahs
        </p>
      </div>

      <div className="mt-10 rounded-[var(--kw-radius-xl)] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-card)]">
        <QuranViewportProgressTracker enabled={Boolean(userId)} />
        {ayahs.map((a) => (
          <Card
            key={a.id}
            className="!rounded-none !border-0 !border-b !border-[color:var(--kw-border-2)] !bg-transparent py-7 !shadow-none last:!border-b-0 sm:px-8"
            data-quran-track="1"
            data-quran-ayah-id={a.id}
            data-quran-surah-number={a.surahNumber}
            data-quran-ayah-number={a.ayahNumber}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[color:var(--kw-fill)] px-2.5 py-1 text-xs font-medium tabular-nums text-[color:var(--kw-faint)]">
                  {info.surahNumber}:{a.ayahNumber}
                </span>
              </div>
              <div className="w-full sm:w-auto">
                <AyahAudioPlayer
                  ayahId={a.id}
                  reciterId={reciterId}
                  streakTrackSource="quran_browse"
                  speedPrefKey={QURAN_AUDIO_SPEED_PREF_KEY}
                />
              </div>
            </div>

            <div dir="rtl" lang="ar" className="mt-5 text-right font-[family-name:var(--font-kw-quran)] text-[1.9rem] leading-[2.2] text-[color:var(--kw-ink)] sm:text-[2.1rem]">
              {a.textUthmani}
            </div>
            <p dir="ltr" className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              {getSahihTranslationByAyahId(a.id) ?? "Translation unavailable"}
            </p>
            <div className="mt-4">
              <JournalPrefillLink
                ayahId={a.id}
                label="Add to journal"
                ariaLabel={`Add Surah ${info.surahNumber}:${a.ayahNumber} to journal`}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
