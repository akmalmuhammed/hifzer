import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";

export const metadata = {
  title: "Qur'an Preview",
};

export default function QuranPreviewPage() {
  const topSurahs = SURAH_INDEX.slice(0, 18);

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Qur&apos;an</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        Qur&apos;an preview.
        <span className="block text-[rgba(var(--kw-accent-rgb),1)]">Browse surahs before signing in.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
        You can preview surah names and structure here. Sign in to open full ayah browsing,
        session practice, and saved progress.
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Button asChild className="gap-2">
          <Link href="/login">
            Sign in for full Qur&apos;an view <ArrowRight size={16} />
          </Link>
        </Button>
        <Button asChild variant="secondary" className="gap-2">
          <Link href="/">
            Back to landing <ArrowRight size={16} />
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topSurahs.map((surah) => (
          <Card key={surah.surahNumber}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Surah {surah.surahNumber} - {surah.ayahCount} ayahs
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--kw-ink)]">
                  <span dir="rtl">{surah.nameArabic}</span>
                </p>
                <p className="mt-1 truncate text-sm text-[color:var(--kw-muted)]">
                  {surah.nameTransliteration} - {surah.nameEnglish}
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                <BookOpenText size={18} />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
