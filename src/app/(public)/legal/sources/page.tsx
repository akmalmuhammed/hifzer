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
    <div className="mx-auto w-full max-w-[44rem] px-[1.4rem] pb-24 pt-14 md:pb-32 md:pt-24">
      <Pill tone="neutral">Legal</Pill>
      <h1 className="mt-5 text-balance font-[family-name:var(--font-kw-display)] text-[clamp(2.25rem,4.6vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[color:var(--kw-ink)]">
        Sources.
        <span className="block text-[color:var(--kw-faint)]">Attribution and trusted source status.</span>
      </h1>
      <p className="mt-5 max-w-3xl text-[1.15rem] leading-[1.45] tracking-[-0.012em] text-[color:var(--kw-muted)]">
        This page lists the Qur&apos;an text, translations, metadata, and external source providers used in Hifzer,
        with attribution and current verification status.
      </p>

      <div className="mt-10 grid gap-12 border-t border-[color:var(--kw-border-2)] pt-10">
        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <div className="flex items-center gap-2">
            <Pill tone="accent">Active in Hifzer</Pill>
            <span className="text-[0.84rem] font-medium text-[color:var(--kw-faint)]">Verified today</span>
          </div>
          <p className="mt-4 text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">Core text and metadata</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-[16px] bg-[color:var(--kw-tile)] p-5">
              <p className="text-[1.02rem] font-semibold tracking-[-0.01em] text-[color:var(--kw-ink)]">Arabic text</p>
              <p className="mt-2 text-[0.98rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
                Tanzil Uthmani export bundled locally for the canonical Arabic reader.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="accent">Verified</Pill>
                <Pill tone="neutral">Tanzil</Pill>
              </div>
            </div>
            <div className="rounded-[16px] bg-[color:var(--kw-tile)] p-5">
              <p className="text-[1.02rem] font-semibold tracking-[-0.01em] text-[color:var(--kw-ink)]">Metadata and transliteration</p>
              <p className="mt-2 text-[0.98rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
                Surah/page metadata and transliteration are bundled locally and included in the same source set.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="accent">Included</Pill>
                <Pill tone="neutral">Local bundle</Pill>
              </div>
            </div>
          </div>

          <p className="mt-10 text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">Translation bundle status</p>
          <div className="mt-3 space-y-3">
            {verifiedTranslations.map((option) => (
              <div key={option.id} className="rounded-[16px] bg-[color:var(--kw-tile)] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[1.02rem] font-semibold tracking-[-0.01em] text-[color:var(--kw-ink)]">{option.label}</p>
                  <Pill tone="accent">Verified</Pill>
                </div>
                <p className="mt-2 text-[0.98rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
                  Source: {option.sourceLabel}. {option.sourceNote}
                </p>
              </div>
            ))}
            {pendingTranslations.length ? (
              <div className="rounded-[16px] bg-[color:var(--kw-pill-warn-bg)] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[1.02rem] font-semibold tracking-[-0.01em] text-[color:var(--kw-ink)]">Bundled translations under review</p>
                  <Pill tone="warn">{pendingTranslations.length} pending</Pill>
                </div>
                <p className="mt-2 text-[0.98rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
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

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <div className="flex items-center gap-2">
            <Pill tone="neutral">Source notes</Pill>
            <span className="text-[0.84rem] font-medium text-[color:var(--kw-faint)]">Local bundle inputs</span>
          </div>
          <p className="mt-4 text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">Local source notes</p>
          <p className="mt-2 text-[0.98rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            These lines describe the local Qur&apos;an bundle mappings currently used by Hifzer.
          </p>
          <pre className="mt-5 overflow-x-auto whitespace-pre-wrap rounded-[16px] bg-[color:var(--kw-tile)] p-5 text-[0.8rem] leading-6 text-[color:var(--kw-ink-2)]">
            {HIFZER_SEED_SOURCE_LINES.join("\n")}
          </pre>
        </Card>
      </div>

      <div className="mt-12 border-t border-[color:var(--kw-border-2)] pt-10">
        <div className="flex items-center gap-2">
          <Pill tone="neutral">Possible source additions</Pill>
          <span className="text-[0.84rem] font-medium text-[color:var(--kw-faint)]">Sorted by integration effort</span>
        </div>
        <div className="mt-2 grid">
          {sourceCatalog.map((source) => (
            <Card key={source.id} className="rounded-none! border-x-0! border-t-0! bg-transparent! px-0! py-8! shadow-none! last:border-b-0!">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={source.effortRank <= 2 ? "accent" : source.effortRank === 3 ? "neutral" : "warn"}>
                  #{source.effortRank}
                </Pill>
                <Pill tone="neutral">{getQuranDataSourceEaseLabel(source.ease)}</Pill>
                <Pill tone={source.cost === "approval_required" || source.cost === "legal_review" ? "warn" : "accent"}>
                  {getQuranDataSourceCostLabel(source.cost)}
                </Pill>
              </div>
              <p className="mt-4 text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">{source.name}</p>
              <p className="mt-2 text-[0.98rem] leading-[1.6] text-[color:var(--kw-ink-2)]">{source.summary}</p>

              <div className="mt-5 rounded-[16px] bg-[color:var(--kw-tile)] p-5">
                <p className="text-[0.84rem] font-semibold text-[color:var(--kw-faint)]">Setup</p>
                <p className="mt-2 text-[0.98rem] leading-[1.6] text-[color:var(--kw-ink-2)]">{source.setupSummary}</p>
              </div>

              <div className="mt-4">
                <p className="text-[0.84rem] font-semibold text-[color:var(--kw-faint)]">What it needs</p>
                <ul className="mt-2 space-y-1.5 text-[0.98rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
                  {source.inputRequirements.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <p className="text-[0.84rem] font-semibold text-[color:var(--kw-faint)]">Best for</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {source.bestFor.map((item) => (
                    <Pill key={item} tone="neutral">{item}</Pill>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[0.98rem] text-[color:var(--kw-faint)]">
                <a href={source.officialUrl} className="text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
                  Official site
                </a>
                {source.docsUrl ? (
                  <a href={source.docsUrl} className="text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
                    Docs
                  </a>
                ) : null}
                {source.termsUrl ? (
                  <a href={source.termsUrl} className="text-[rgba(var(--kw-accent-rgb),1)] underline underline-offset-2 hover:no-underline">
                    Terms
                  </a>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-12 border-t border-[color:var(--kw-border-2)] pt-10">
        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <p className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">Tanzil metadata header</p>
          <p className="mt-2 text-[0.98rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Copied verbatim from the Tanzil <code>quran-data.js</code> metadata file header.
          </p>
          <pre className="mt-5 overflow-x-auto whitespace-pre-wrap rounded-[16px] bg-[color:var(--kw-tile)] p-5 text-[0.8rem] leading-6 text-[color:var(--kw-ink-2)]">
            {TANZIL_QURAN_DATA_JS_HEADER_LINES.join("\n")}
          </pre>
        </Card>

        <Card className="rounded-none! border-0! bg-transparent! p-0! shadow-none!">
          <p className="text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">English translation source</p>
          <p className="mt-2 text-[0.98rem] leading-[1.6] text-[color:var(--kw-ink-2)]">
            Sahih translation metadata and attribution for the bundled <code>en.sahih</code> text.
          </p>
          <pre className="mt-5 overflow-x-auto whitespace-pre-wrap rounded-[16px] bg-[color:var(--kw-tile)] p-5 text-[0.8rem] leading-6 text-[color:var(--kw-ink-2)]">
            {[...TANZIL_SAHIH_TRANSLATION_HEADER_LINES, "", ...TANZIL_SAHIH_TRANSLATION_ATTRIBUTION_LINES].join("\n")}
          </pre>
        </Card>
      </div>
    </div>
  );
}
