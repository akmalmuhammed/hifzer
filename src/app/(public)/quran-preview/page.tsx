import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { SURAH_INDEX } from "@/hifzer/quran/data/surah-index";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qur'an Preview",
  description:
    "Preview surah names and structure before signing in, then open the full Hifzer Qur'an reader when you are ready.",
  alternates: {
    canonical: "/quran-preview",
  },
};

export default function QuranPreviewPage() {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-[1.4rem] pb-24 pt-14 text-center md:pb-32 md:pt-24">
      <Pill tone="neutral">Qur&apos;an</Pill>
      <h1 className="mx-auto mt-5 max-w-[56rem] text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.6rem,5.8vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[color:var(--kw-ink)]">
        Preview the Qur&apos;an reader.
        <span className="block text-[color:var(--kw-faint)]">Read before creating an account.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-[clamp(1.1rem,1.6vw,1.3rem)] leading-[1.42] tracking-[-0.014em] text-[color:var(--kw-muted)]">
        Start reading without an account. Sign in when you want progress, bookmarks, and Quran.com sync to follow you.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="gap-2">
          <Link href="/quran/read?view=compact&anon=1&surah=1&cursor=1&translation=1&tafsir=1&ignoreSaved=1">
            Try read-only reader <ArrowRight size={16} />
          </Link>
        </Button>
        <Button asChild variant="secondary" className="gap-2">
          <Link href="/login?redirect_url=%2Fquran">
            Sign in to save progress <ArrowRight size={16} />
          </Link>
        </Button>
        <Button asChild variant="secondary" className="gap-2">
          <Link href="/">
            Back to landing <ArrowRight size={16} />
          </Link>
        </Button>
      </div>

      <div className="mt-16 grid gap-3 text-left sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
        {SURAH_INDEX.map((surah) => (
          <Card key={surah.surahNumber} className="rounded-[20px]! border-0! p-5! shadow-none!">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.84rem] font-medium tabular-nums text-[color:var(--kw-faint)]">
                  Surah {surah.surahNumber} - {surah.ayahCount} ayahs
                </p>
                <p className="mt-2 text-[1.3rem] font-semibold leading-[1.3] text-[color:var(--kw-ink)]">
                  <span dir="rtl" lang="ar">{surah.nameArabic}</span>
                </p>
                <p className="mt-1 truncate text-[0.94rem] text-[color:var(--kw-muted)]">
                  {surah.nameTransliteration} - {surah.nameEnglish}
                </p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--kw-page)] text-[color:var(--kw-faint)]">
                <BookOpenText size={18} />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
