import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getJuzInfo, listAyahsForJuz } from "@/hifzer/quran/lookup.server";
import { getSahihTranslationByAyahId } from "@/hifzer/quran/translation.server";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const juzNumber = Number(params.id);
  const info = getJuzInfo(juzNumber);
  return {
    title: info ? `Juz ${info.juzNumber}` : "Juz",
  };
}

export default async function JuzPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const juzNumber = Number(params.id);
  const info = getJuzInfo(juzNumber);

  if (!info) {
    return (
      <div className="pb-12 pt-10 md:pb-16 md:pt-14">
        <Pill tone="warn">Not found</Pill>
        <h1 className="mt-4 font-[family-name:var(--font-kw-display)] text-4xl tracking-tight text-[color:var(--kw-ink)]">
          Juz not found.
        </h1>
        <p className="mt-3 text-sm text-[color:var(--kw-muted)]">The juz number must be between 1 and 30.</p>
        <div className="mt-6">
          <Link href="/quran" className="text-sm font-semibold text-[rgba(31,54,217,1)] hover:underline">
            Back to index
          </Link>
        </div>
      </div>
    );
  }

  const ayahs = listAyahsForJuz(juzNumber);

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Link
        href="/quran"
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mt-6">
        <Pill tone="neutral">Juz {info.juzNumber}</Pill>
        <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
          Juz {info.juzNumber}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
          {info.ayahCount} ayahs - Global IDs {info.startAyahId}-{info.endAyahId}
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {ayahs.map((a) => (
          <Card key={a.id} className="py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2.5 py-1 text-xs font-semibold text-[color:var(--kw-muted)]">
                  {a.surahNumber}:{a.ayahNumber}
                </span>
                <span className="text-xs text-[color:var(--kw-faint)]">#{a.id}</span>
              </div>
              <div className="w-full sm:w-auto">
                <AyahAudioPlayer ayahId={a.id} streakTrackSource="quran_browse" />
              </div>
            </div>

            <div dir="rtl" className="mt-4 text-right text-2xl leading-[2.1] text-[color:var(--kw-ink)]">
              {a.textUthmani}
            </div>
            <p dir="ltr" className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              {getSahihTranslationByAyahId(a.id) ?? "Translation unavailable"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
