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
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
      >
        <ArrowLeft size={16} />
        Back to Qur&apos;an hub
      </Link>

      <div className="mt-6">
        <Pill tone="accent">Bookmarks</Pill>
        <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
          Smart bookmark system
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
          Save multiple ayah bookmarks, organize them by category, and keep personal notes. If you go offline, your latest changes stay on this device until sync finishes.
        </p>
      </div>

      <BookmarkManagerClient connectionStatus={connectionStatus} />
    </div>
  );
}
