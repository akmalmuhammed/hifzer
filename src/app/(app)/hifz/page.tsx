import { auth } from "@clerk/nextjs/server";
import { SurahProgressSection } from "@/components/progress/surah-progress-section";
import { listHifzSurahProgress } from "@/hifzer/progress/surah-progress.server";
import { clerkEnabled } from "@/lib/clerk-config";
import { SessionClient } from "../session/session-client";

export const metadata = {
  title: "Hifz",
};

export default async function HifzPage() {
  let items = [] as Awaited<ReturnType<typeof listHifzSurahProgress>>;
  if (clerkEnabled()) {
    const { userId } = await auth();
    if (userId) {
      items = await listHifzSurahProgress(userId);
    }
  }

  return (
    <div className="space-y-8">
      <SurahProgressSection
        title="Hifz surah progress"
        subtitle="Finished surahs stay marked as completed, and the active Hifz surah keeps its memorization percentage so you can see exactly how far you are inside the current lane."
        items={items.slice(0, 6)}
        viewAllHref="/hifz/progress"
        emptyTitle="No Hifz surah progress yet"
        emptyBody="Start a Hifz session and your memorized surahs plus the current partial surah will appear here."
      />
      <SessionClient />
    </div>
  );
}
