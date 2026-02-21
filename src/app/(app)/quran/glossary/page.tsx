import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { QuranGlossaryClient, QuranGlossaryHeaderHint } from "./quran-glossary-client";

export const metadata = {
  title: "Qur'anic Glossary",
};

export default function QuranGlossaryPage() {
  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Link
        href="/quran"
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] hover:bg-white"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mt-6">
        <Pill tone="neutral">Qur&apos;an Library</Pill>
        <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
          Seek meaning. Walk the path of knowledge.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
          Every term you learn is a step Allah rewards.
        </p>
        <p className="mt-2 inline-flex items-center rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-1 text-xs font-semibold text-[color:var(--kw-faint)]">
          Source: Sahih Muslim 2699a
        </p>
        <div className="mt-4">
          <QuranGlossaryHeaderHint />
        </div>
      </div>

      <div className="mt-8">
        <QuranGlossaryClient />
      </div>
    </div>
  );
}
