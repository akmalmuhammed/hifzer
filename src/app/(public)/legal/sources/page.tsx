import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import {
  HIFZER_SEED_SOURCE_LINES,
  TANZIL_QURAN_DATA_JS_HEADER_LINES,
  TANZIL_SAHIH_TRANSLATION_ATTRIBUTION_LINES,
  TANZIL_SAHIH_TRANSLATION_HEADER_LINES,
} from "@/hifzer/quran/attribution";
import {
  getQuranDataSourceCostLabel,
  getQuranDataSourceEaseLabel,
  listQuranDataSourcesSorted,
} from "@/hifzer/quran/source-catalog";
import { QURAN_TRANSLATION_OPTIONS } from "@/hifzer/quran/translation-prefs";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sources",
  description: "Source attribution and dataset governance for the Qur'an text, translations, and metadata used by Hifzer.",
  alternates: {
    canonical: "/legal/sources",
  },
};

export default function LegalSourcesPage() {
  const sourceCatalog = listQuranDataSourcesSorted();
  const verifiedTranslations = QURAN_TRANSLATION_OPTIONS.filter((option) => option.sourceStatus === "verified");
  const pendingTranslations = QURAN_TRANSLATION_OPTIONS.filter((option) => option.sourceStatus !== "verified");

  return (
    <div className="pb-12 pt-10 md:pb-16 md:pt-14">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
        Sources.
        <span className="block text-[rgba(31,54,217,1)]">Attribution and source governance.</span>
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
        Hifzer now treats Qur&apos;an content as a governed source stack, not just bundled files.
        This page shows what is active in the app today, which official/open datasets are easiest
        to add next, and the required attribution lines for the bundles already shipped.
      </p>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center gap-2">
            <Pill tone="accent">Active in Hifzer</Pill>
            <span className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Current registry</span>
          </div>
          <p className="mt-4 text-sm font-semibold text-[color:var(--kw-ink)]">Core text and metadata</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Arabic text</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Tanzil Uthmani export bundled locally for the canonical Arabic reader.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="accent">Verified</Pill>
                <Pill tone="neutral">Tanzil</Pill>
              </div>
            </div>
            <div className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Metadata and transliteration</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Surah/page metadata and transliteration are bundled locally and included in the same source set.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="accent">Included</Pill>
                <Pill tone="neutral">Local bundle</Pill>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm font-semibold text-[color:var(--kw-ink)]">Translation bundle status</p>
          <div className="mt-3 space-y-3">
            {verifiedTranslations.map((option) => (
              <div key={option.id} className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{option.label}</p>
                  <Pill tone="accent">Verified</Pill>
                </div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                  Source: {option.sourceLabel}. {option.sourceNote}
                </p>
              </div>
            ))}
            {pendingTranslations.length ? (
              <div className="rounded-[20px] border border-[rgba(245,158,11,0.26)] bg-[rgba(245,158,11,0.08)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Bundled translations under review</p>
                  <Pill tone="warn">{pendingTranslations.length} pending</Pill>
                </div>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                  These translations are live in the product, but their external source records are still being normalized into the registry before further source-backed expansion.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pendingTranslations.map((option) => (
                    <Pill key={option.id} tone="neutral">{option.label}</Pill>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Pill tone="neutral">Seed notes</Pill>
            <span className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Build inputs</span>
          </div>
          <p className="mt-4 text-sm font-semibold text-[color:var(--kw-ink)]">Seed build notes</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            These lines describe the seed inputs and local bundle mappings currently used to boot the Qur&apos;an stack.
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-3 text-xs leading-6 text-[color:var(--kw-ink-2)]">
            {HIFZER_SEED_SOURCE_LINES.join("\n")}
          </pre>
        </Card>
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-2">
          <Pill tone="neutral">Adoption stack</Pill>
          <span className="text-xs uppercase tracking-wide text-[color:var(--kw-faint)]">Sorted by integration effort</span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sourceCatalog.map((source) => (
            <Card key={source.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={source.effortRank <= 2 ? "accent" : source.effortRank === 3 ? "neutral" : "warn"}>
                  #{source.effortRank}
                </Pill>
                <Pill tone="neutral">{getQuranDataSourceEaseLabel(source.ease)}</Pill>
                <Pill tone={source.cost === "approval_required" || source.cost === "legal_review" ? "warn" : "accent"}>
                  {getQuranDataSourceCostLabel(source.cost)}
                </Pill>
              </div>
              <p className="mt-4 text-sm font-semibold text-[color:var(--kw-ink)]">{source.name}</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{source.summary}</p>

              <div className="mt-4 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Setup</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{source.setupSummary}</p>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">What it needs</p>
                <ul className="mt-2 space-y-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                  {source.inputRequirements.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Best for</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {source.bestFor.map((item) => (
                    <Pill key={item} tone="neutral">{item}</Pill>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[color:var(--kw-faint)]">
                <a href={source.officialUrl} className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
                  Official site
                </a>
                {source.docsUrl ? (
                  <a href={source.docsUrl} className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
                    Docs
                  </a>
                ) : null}
                {source.termsUrl ? (
                  <a href={source.termsUrl} className="font-semibold text-[rgba(31,54,217,1)] hover:underline">
                    Terms
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Tanzil metadata header</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Copied verbatim from the Tanzil <code>quran-data.js</code> metadata file header.
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-3 text-xs leading-6 text-[color:var(--kw-ink-2)]">
            {TANZIL_QURAN_DATA_JS_HEADER_LINES.join("\n")}
          </pre>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">English translation source</p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
            Sahih translation metadata and attribution for the bundled <code>en.sahih</code> text.
          </p>
          <pre className="mt-4 whitespace-pre-wrap rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 p-3 text-xs leading-6 text-[color:var(--kw-ink-2)]">
            {[...TANZIL_SAHIH_TRANSLATION_HEADER_LINES, "", ...TANZIL_SAHIH_TRANSLATION_ATTRIBUTION_LINES].join("\n")}
          </pre>
        </Card>
      </div>
    </div>
  );
}
