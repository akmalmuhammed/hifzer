import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SurahProgressSection } from "@/components/progress/surah-progress-section";
import { Pill } from "@/components/ui/pill";
import { listHifzSurahProgress } from "@/hifzer/progress/surah-progress.server";
import { clerkEnabled } from "@/lib/clerk-config";

export const metadata = {
  title: "Hifz Surah Progress",
};

export default async function HifzSurahProgressPage() {
  let items = [] as Awaited<ReturnType<typeof listHifzSurahProgress>>;
  if (clerkEnabled()) {
    const { userId } = await auth();
    if (userId) {
      items = await listHifzSurahProgress(userId);
    }
  }

  const completedCount = items.filter((item) => item.isCompleted).length;
  const currentCount = items.filter((item) => item.isCurrent || !item.isCompleted).length;

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Link
        href="/hifz"
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
      >
        <ArrowLeft size={16} />
        Back to Hifz
      </Link>

      <div className="mt-6">
        <Pill tone="neutral">Hifz progress</Pill>
        <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
          See every memorized surah and every surah still in progress.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
          Finished Hifz surahs stay marked clearly, while the surah you are working on keeps its percentage so you can return easily.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Pill tone="accent">Completed surahs: {completedCount}</Pill>
        <Pill tone="neutral">Working on now: {currentCount}</Pill>
      </div>

      <div className="mt-8">
        <SurahProgressSection
          title="Full Hifz surah list"
          subtitle="The surah you are memorizing stays easy to spot, while finished surahs remain visible for review."
          items={items}
          defaultExpanded
          emptyTitle="No Hifz surahs yet"
          emptyBody="Complete Hifz sessions and your current and finished surahs will appear here."
        />
      </div>
    </div>
  );
}
