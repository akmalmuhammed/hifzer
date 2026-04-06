import { auth } from "@clerk/nextjs/server";
import { SettingsDetailHeader } from "@/components/app/settings-detail-header";
import { clerkEnabled } from "@/lib/clerk-config";
import { getQuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/server";
import { QuranFoundationSettingsClient } from "./quran-foundation-client";

export const metadata = {
  title: "Quran.com",
};

export default async function QuranFoundationSettingsPage() {
  const userId = clerkEnabled() ? (await auth()).userId : null;
  const status = await getQuranFoundationConnectionStatus(userId ?? null);

  return (
    <div className="space-y-6">
      <SettingsDetailHeader
        title="Quran.com"
        subtitle="Link a Quran.com account so bookmarks can sync and the reader can show Quran Foundation enrichment."
      />
      <QuranFoundationSettingsClient initialStatus={status} />
    </div>
  );
}
