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
        className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 text-[0.94rem] font-medium text-[rgba(var(--kw-accent-rgb),1)] transition-colors duration-200 hover:bg-[rgba(var(--kw-accent-rgb),0.08)]"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="mt-6">
        <Pill tone="neutral">Qur&apos;an Library</Pill>
        <h1 className="kw-page-title mt-4 text-balance text-[color:var(--kw-ink)]">
          Seek meaning. Walk the path of knowledge.
        </h1>
        <p className="kw-page-subtitle mt-3 text-[color:var(--kw-muted)]">
          Every term you learn is a step Allah rewards.
          <span className="ml-2 inline-flex items-center rounded-full bg-[color:var(--kw-fill-strong)] px-2.5 py-1 align-middle text-xs font-medium leading-none text-[color:var(--kw-faint)]">
            Sahih Muslim 2699a
          </span>
        </p>
        <div className="mt-4">
          <QuranGlossaryHeaderHint />
        </div>
      </div>

      <div className="mt-6">
        <QuranGlossaryClient />
      </div>
    </div>
  );
}
