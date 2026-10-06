import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { getQuranFoundationConnectionStatus } from "@/hifzer/quran-foundation/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { clerkEnabled } from "@/lib/clerk-config";
import { BookmarkManagerClient } from "./bookmarks-client";

export const metadata = {
  title: "Qur'an Bookmarks",
};

export default async function QuranBookmarksPage() {
  const userId = clerkEnabled() ? await resolveClerkUserIdForServer() : null;
  const connectionStatus = await getQuranFoundationConnectionStatus(userId ?? null);

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Link
        href="/quran"
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 text-[0.94rem] font-medium text-[rgba(var(--kw-accent-rgb),1)] transition-colors duration-200 hover:bg-[rgba(var(--kw-accent-rgb),0.08)]"
      >
        <ArrowLeft size={16} />
        Back to Qur&apos;an hub
      </Link>

      <div className="mt-6">
        <Pill tone="accent">Bookmarks</Pill>
        <h1 className="kw-page-title mt-4 text-balance text-[color:var(--kw-ink)]">
          Smart bookmark system
        </h1>
        <p className="kw-page-subtitle mt-3 text-[color:var(--kw-muted)]">
          Save multiple ayah bookmarks, organize them by category, and keep personal notes. If you go offline, your latest changes stay on this device until sync finishes.
        </p>
      </div>

      <BookmarkManagerClient connectionStatus={connectionStatus} />
    </div>
  );
}
