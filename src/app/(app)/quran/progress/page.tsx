import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { QuranOfflineStatus } from "@/components/quran/quran-offline-status";
import { SurahProgressSection } from "@/components/progress/surah-progress-section";
import { Pill } from "@/components/ui/pill";
import { listQuranSurahProgress } from "@/hifzer/progress/surah-progress.server";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Qur'an Surah Progress",
};

export default async function QuranSurahProgressPage() {
  let items = [] as Awaited<ReturnType<typeof listQuranSurahProgress>>;
  if (clerkEnabled()) {
    const { userId } = await auth();
    if (userId) {
      items = await listQuranSurahProgress(userId);
    }
  }

  const completedCount = items.filter((item) => item.isCompleted).length;
  const currentCount = items.filter((item) => item.isCurrent || !item.isCompleted).length;

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Link
        href="/quran"
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
      >
        <ArrowLeft size={16} />
        Back to Qur&apos;an
      </Link>

      <div className="mt-6">
        <Pill tone="neutral">Qur&apos;an progress</Pill>
        <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
          See every surah you have finished and where you are now.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
          Finished surahs stay softly highlighted, and the surah you are reading keeps its percentage so you can return without guessing where you stopped.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Pill tone="accent">Completed surahs: {completedCount}</Pill>
        <Pill tone="neutral">Reading now: {currentCount}</Pill>
      </div>

      <QuranOfflineStatus compact showReadyHint scope="hub" />

      <div className="mt-8">
        <SurahProgressSection
          title="Full Qur&apos;an surah list"
          subtitle="Finished surahs stay marked clearly, while the surah you are reading keeps its percentage so your place stays easy to find."
          items={items}
          defaultExpanded
          emptyTitle="No Qur&apos;an surahs yet"
          emptyBody="Start reading and your current and finished surahs will appear here."
        />
      </div>
    </div>
  );
}
