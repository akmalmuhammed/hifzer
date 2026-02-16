import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { HIFZER_SEED_SOURCE_LINES, TANZIL_QURAN_DATA_JS_HEADER_LINES } from "@/hifzer/quran/attribution";

export const metadata = {
  title: "Sources",
};

export default function LegalSourcesPage() {
  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        Sources.
        <span className="block text-[rgba(31,54,217,1)]">Attribution and credits.</span>
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
        Hifzer ships locally bundled Qur&apos;an Arabic text (Tanzil Uthmani export) and Tanzil
        metadata (surah index mappings). This page lists the required attribution lines and the
        dataset notes used to build the seed.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Seed build notes</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            These lines describe the seed inputs and mappings.
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-3 text-xs leading-6 text-[color:var(--kw-ink-2)]">
            {HIFZER_SEED_SOURCE_LINES.join("\n")}
          </pre>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Tanzil metadata header</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Copied verbatim from the Tanzil <code>quran-data.js</code> metadata file header.
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-3 text-xs leading-6 text-[color:var(--kw-ink-2)]">
            {TANZIL_QURAN_DATA_JS_HEADER_LINES.join("\n")}
          </pre>
        </Card>
      </div>
    </div>
  );
}

