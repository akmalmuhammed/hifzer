import { auth } from "@clerk/nextjs/server";
import { SettingsDetailHeader } from "@/components/app/settings-detail-header";
import { clerkEnabled } from "@/lib/clerk-config";
import { getQuranFoundationConnectedOverview } from "@/hifzer/quran-foundation/user-features";
import { getQuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/server";
import { QuranFoundationSettingsClient } from "./quran-foundation-client";

export const metadata = {
  title: "Quran.com",
};

export default async function QuranFoundationSettingsPage() {
  const userId = clerkEnabled() ? (await auth()).userId : null;
  const [status, overview] = await Promise.all([
    getQuranFoundationConnectionStatus(userId ?? null),
    getQuranFoundationConnectedOverview(userId ?? null),
  ]);

  return (
    <div className="space-y-6">
      <SettingsDetailHeader
        title="Quran.com"
        subtitle="Keep your Quran.com reading place, bookmarks, and notes together in Hifzer."
      />
      <QuranFoundationSettingsClient initialStatus={status} initialOverview={overview} />
    </div>
  );
}
