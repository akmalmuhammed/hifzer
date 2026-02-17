import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { listJuzs, listSurahs } from "@/hifzer/quran/lookup.server";

export const metadata = {
  title: "Qur'an",
};

export default async function QuranIndexPage() {
  const surahs = listSurahs();
  const juzs = listJuzs();

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Qur&apos;an</Pill>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
            Browse the Qur&apos;an.
            <span className="block text-[rgba(31,54,217,1)]">Arabic + English (Saheeh International).</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
            Surah index and ayah text are backed by a local seed (no external API).
          </p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
          <BookOpen size={18} />
        </span>
      </div>

      <div className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Juz</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {juzs.map((j) => (
            <Link key={j.juzNumber} href={`/quran/juz/${j.juzNumber}`}>
              <Card className="group transition hover:bg-white/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Juz {j.juzNumber}</p>
                    <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                      {j.ayahCount} ayahs - IDs {j.startAyahId}-{j.endAyahId}
                    </p>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-[rgba(43,75,255,0.22)] bg-[rgba(43,75,255,0.10)] text-[rgba(31,54,217,1)] shadow-[var(--kw-shadow-soft)] transition group-hover:bg-[rgba(43,75,255,0.14)]">
                    {j.juzNumber}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Surahs</p>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {surahs.map((s) => (
          <Link key={s.surahNumber} href={`/quran/surah/${s.surahNumber}`}>
            <Card className="group transition hover:bg-white/60">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    Surah {s.surahNumber} - {s.revelationType} - {s.ayahCount} ayahs
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                    <span dir="rtl" className="font-[500]">
                      {s.nameArabic}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
                    {s.nameTransliteration} - {s.nameEnglish}
                  </p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[rgba(43,75,255,0.22)] bg-[rgba(43,75,255,0.10)] text-[rgba(31,54,217,1)] shadow-[var(--kw-shadow-soft)] transition group-hover:bg-[rgba(43,75,255,0.14)]">
                  {s.surahNumber}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
