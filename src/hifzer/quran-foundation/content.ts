import "server-only";

import { QuranClient, type Tafsir, type Translation, type Verse } from "@quranjs/api";
import { getQuranFoundationConfig, hasQuranFoundationContentConfig } from "./config";
import { QuranFoundationError } from "./types";

let client: QuranClient | null = null;
type QuranFoundationVerseKey = Parameters<QuranClient["verses"]["findByKey"]>[0];

function getContentClient(): QuranClient {
  if (client) {
    return client;
  }
  const config = getQuranFoundationConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new QuranFoundationError("Quran Foundation content credentials are not configured.", {
      status: 503,
      code: "qf_content_not_configured",
      retryable: false,
    });
  }
  client = new QuranClient({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });
  return client;
}

export type QuranFoundationAyahEnrichment = {
  status: "available" | "not_configured" | "degraded";
  detail: string;
  verseKey: string;
  pageNumber: number | null;
  juzNumber: number | null;
  hizbNumber: number | null;
  rubElHizbNumber: number | null;
  officialTranslation: {
    text: string;
    resourceName: string | null;
    languageName: string | null;
  } | null;
  officialTafsir: {
    text: string;
    resourceName: string | null;
    languageName: string | null;
  } | null;
};

function mapTranslation(row: Translation | undefined): QuranFoundationAyahEnrichment["officialTranslation"] {
  if (!row?.text) {
    return null;
  }
  return {
    text: row.text,
    resourceName: row.resourceName ?? null,
    languageName: row.languageName ?? null,
  };
}

function mapTafsir(row: Tafsir | undefined): QuranFoundationAyahEnrichment["officialTafsir"] {
  if (!row?.text) {
    return null;
  }
  return {
    text: row.text,
    resourceName: row.resourceName ?? null,
    languageName: row.languageName ?? null,
  };
}

function buildDetail(
  verse: Verse,
  officialTranslation: QuranFoundationAyahEnrichment["officialTranslation"],
  officialTafsir: QuranFoundationAyahEnrichment["officialTafsir"],
): string {
  if (officialTafsir?.resourceName) {
    return `Official Quran Foundation enrichment loaded from ${officialTafsir.resourceName}.`;
  }
  if (officialTranslation?.resourceName) {
    return `Official Quran Foundation translation loaded from ${officialTranslation.resourceName}.`;
  }
  return `Official Quran Foundation verse metadata loaded for ${verse.verseKey}.`;
}

export async function getQuranFoundationAyahEnrichment(
  verseKey: `${number}:${number}`,
): Promise<QuranFoundationAyahEnrichment> {
  if (!hasQuranFoundationContentConfig()) {
    return {
      status: "not_configured",
      detail: "Set QF_CLIENT_ID and QF_CLIENT_SECRET to enable official Quran Foundation enrichment.",
      verseKey,
      pageNumber: null,
      juzNumber: null,
      hizbNumber: null,
      rubElHizbNumber: null,
      officialTranslation: null,
      officialTafsir: null,
    };
  }

  const config = getQuranFoundationConfig();
  try {
    const verse = await getContentClient().verses.findByKey(verseKey as QuranFoundationVerseKey, {
      translations: config.contentTranslationResourceId ? [config.contentTranslationResourceId] : undefined,
      tafsirs: config.contentTafsirResourceId ? [config.contentTafsirResourceId] : undefined,
    });
    const officialTranslation = mapTranslation(verse.translations?.[0]);
    const officialTafsir = mapTafsir(verse.tafsirs?.[0]);

    return {
      status: "available",
      detail: buildDetail(verse, officialTranslation, officialTafsir),
      verseKey: verse.verseKey,
      pageNumber: Number.isFinite(verse.pageNumber) ? verse.pageNumber : null,
      juzNumber: Number.isFinite(verse.juzNumber) ? verse.juzNumber : null,
      hizbNumber: Number.isFinite(verse.hizbNumber) ? verse.hizbNumber : null,
      rubElHizbNumber: Number.isFinite(verse.rubElHizbNumber) ? verse.rubElHizbNumber : null,
      officialTranslation,
      officialTafsir,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load Quran Foundation enrichment.";
    return {
      status: "degraded",
      detail: message,
      verseKey,
      pageNumber: null,
      juzNumber: null,
      hizbNumber: null,
      rubElHizbNumber: null,
      officialTranslation: null,
      officialTafsir: null,
    };
  }
}
