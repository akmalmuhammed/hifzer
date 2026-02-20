import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { BookmarkManagerClient } from "./bookmarks-client";

export const metadata = {
  title: "Qur'an Bookmarks",
};

export default function QuranBookmarksPage() {
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
          Save multiple ayah bookmarks, organize them by category, and keep personal notes. Pending changes stay queued
          locally until sync succeeds.
        </p>
      </div>

      <BookmarkManagerClient />
    </div>
  );
}
