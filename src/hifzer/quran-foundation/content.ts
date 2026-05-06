import "server-only";

import {
  getLocalReciterMatchTokens,
  parseQuranFoundationReciterId,
} from "@/hifzer/audio/reciters";
import { resolveLocalAudioReciterId } from "@/hifzer/audio/config";
import { getQuranFoundationConfig, hasQuranFoundationContentConfig } from "./config";
import { QuranFoundationError } from "./types";

type JsonRecord = Record<string, unknown>;
type QueryValue = string | number | boolean | null | undefined;
type QueryValues = QueryValue | Array<string | number | boolean>;
type TimedCache<T> = {
  value: T | null;
  expiresAt: number;
  inFlight: Promise<T> | null;
};

const CONTENT_TOKEN_TTL_FALLBACK_MS = 50 * 60 * 1000;
const CONTENT_TOKEN_SAFETY_WINDOW_MS = 60 * 1000;
const CONTENT_TOKEN_SCOPE = "content";
const RESOURCE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FETCH_REVALIDATE_SECONDS = 60 * 60;
const MAX_DEFAULT_TAFSIRS = 2;
const DEFAULT_QURAN_FOUNDATION_AUDIO_BASE_URL = "https://verses.quran.com/";

const LANGUAGE_PRIORITY = ["english", "arabic", "urdu", "indonesian", "turkish", "persian", "bengali", "malayalam"];
const FEATURED_TRANSLATION_TOKENS = [
  "saheeh international",
  "mustafa khattab",
  "clear quran",
  "yusuf ali",
  "jalalayn",
];
const FEATURED_TAFSIR_TOKENS = [
  "ibn kathir",
  "maarif",
  "tafhim",
  "jalalayn",
  "as-saadi",
  "muyassar",
];
const FEATURED_RECITER_TOKENS = [
  "alafasy",
  "afasy",
  "husary",
  "husari",
  "abdul basit",
  "minshawi",
  "sudais",
  "shuraym",
];

type QuranFoundationRawSupportText = JsonRecord;
type QuranFoundationRawRecitationAudio = JsonRecord;

export type QuranFoundationContentStatus = "available" | "not_configured" | "degraded";

export type QuranFoundationSupportText = {
  resourceId: number;
  text: string;
  resourceName: string | null;
  languageName: string | null;
  direction: "ltr" | "rtl";
};

export type QuranFoundationContentResource = {
  id: number;
  label: string;
  authorName: string | null;
  languageName: string | null;
  direction: "ltr" | "rtl";
  slug: string | null;
};

export type QuranFoundationRecitationResource = {
  id: number;
  label: string;
  translatedName: string | null;
  languageName: string | null;
  direction: "ltr" | "rtl";
  style: string | null;
  description: string;
  matchTokens: string[];
};

export type QuranFoundationAyahEnrichment = {
  status: QuranFoundationContentStatus;
  detail: string;
  verseKey: string;
  pageNumber: number | null;
  juzNumber: number | null;
  hizbNumber: number | null;
  rubElHizbNumber: number | null;
  officialTranslation: QuranFoundationSupportText | null;
  officialTafsirs: QuranFoundationSupportText[];
};

export type QuranFoundationContentCatalog = {
  status: QuranFoundationContentStatus;
  detail: string;
  translations: QuranFoundationContentResource[];
  tafsirs: QuranFoundationContentResource[];
  defaultTranslationId: number | null;
  defaultTafsirIds: number[];
};

export type QuranFoundationRecitationCatalog = {
  status: QuranFoundationContentStatus;
  detail: string;
  recitations: QuranFoundationRecitationResource[];
};

export type QuranFoundationAyahAudioSource = {
  status: "available" | "not_configured" | "degraded" | "not_found";
  detail: string;
  verseKey: string;
  recitationId: number | null;
  recitationLabel: string | null;
  url: string | null;
};

let accessTokenCache: {
  token: string | null;
  expiresAt: number;
  inFlight: Promise<string> | null;
} = {
  token: null,
  expiresAt: 0,
  inFlight: null,
};

const translationCatalogCache: TimedCache<QuranFoundationContentResource[]> = {
  value: null,
  expiresAt: 0,
  inFlight: null,
};

const tafsirCatalogCache: TimedCache<QuranFoundationContentResource[]> = {
  value: null,
  expiresAt: 0,
  inFlight: null,
};

const recitationCatalogCache: TimedCache<QuranFoundationRecitationResource[]> = {
  value: null,
  expiresAt: 0,
  inFlight: null,
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: JsonRecord, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return null;
}

function readNumber(record: JsonRecord, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.floor(value);
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return Math.floor(parsed);
      }
    }
  }
  return null;
}

function normalizeText(input: string | null | undefined): string {
  return (input ?? "").trim().toLowerCase();
}

function normalizeDirection(input: string | null): "ltr" | "rtl" {
  const normalized = normalizeText(input);
  if (normalized === "rtl") {
    return "rtl";
  }
  if (normalized === "ltr") {
    return "ltr";
  }
  return /arabic|urdu|persian|farsi|hebrew/.test(normalized) ? "rtl" : "ltr";
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&rsquo;|&lsquo;/gi, "'")
    .replace(/&rdquo;|&ldquo;/gi, "\"")
    .replace(/&hellip;/gi, "...")
    .replace(/&mdash;/gi, "-")
    .replace(/&ndash;/gi, "-")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, digits: string) => {
      const parsed = Number(digits);
      return Number.isFinite(parsed) ? String.fromCharCode(parsed) : "";
    });
}

function stripHtml(input: string): string {
  return decodeHtmlEntities(
    input
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<li>/gi, "- ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n"),
  ).replace(/[ \t]{2,}/g, " ").trim();
}

function pushQueryValue(searchParams: URLSearchParams, key: string, value: QueryValues) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      searchParams.append(key, String(entry));
    }
    return;
  }
  if (value === null || value === undefined || value === "") {
    return;
  }
  searchParams.set(key, String(value));
}

function buildContentApiUrl(path: string, query?: Record<string, QueryValues>) {
  const config = getQuranFoundationConfig();
  const url = new URL(path.replace(/^\//, ""), `${config.contentApiBaseUrl.replace(/\/+$/, "")}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      pushQueryValue(url.searchParams, key, value);
    }
  }
  return url;
}

async function requestContentAccessToken(): Promise<string> {
  const config = getQuranFoundationConfig();
  if (!config.contentClientId || !config.contentClientSecret) {
    throw new QuranFoundationError("Quran Foundation content credentials are not configured.", {
      status: 503,
      code: "qf_content_not_configured",
      retryable: false,
    });
  }

  const tokenUrl = new URL("/oauth2/token", `${config.oauthBaseUrl.replace(/\/+$/, "")}/`);
  const auth = Buffer.from(`${config.contentClientId}:${config.contentClientSecret}`).toString("base64");
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: CONTENT_TOKEN_SCOPE,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok || !payload) {
    const message =
      (payload && typeof payload.message === "string" && payload.message) ||
      `Quran Foundation token request failed (${response.status}).`;
    throw new QuranFoundationError(message, {
      status: response.status || 503,
      code: "qf_content_auth_failed",
    });
  }

  const accessToken = readString(payload, "access_token");
  if (!accessToken) {
    throw new QuranFoundationError("Quran Foundation did not return a content access token.", {
      status: 502,
      code: "qf_content_token_missing",
    });
  }

  const expiresInSeconds = readNumber(payload, "expires_in");
  accessTokenCache = {
    token: accessToken,
    expiresAt: Date.now() + (expiresInSeconds ? expiresInSeconds * 1000 : CONTENT_TOKEN_TTL_FALLBACK_MS),
    inFlight: null,
  };
  return accessToken;
}

async function getContentAccessToken(): Promise<string> {
  if (
    accessTokenCache.token &&
    accessTokenCache.expiresAt > Date.now() + CONTENT_TOKEN_SAFETY_WINDOW_MS
  ) {
    return accessTokenCache.token;
  }

  if (!accessTokenCache.inFlight) {
    accessTokenCache.inFlight = requestContentAccessToken().finally(() => {
      accessTokenCache.inFlight = null;
    });
  }
  return accessTokenCache.inFlight;
}

async function quranFoundationContentRequest(
  path: string,
  options?: {
    query?: Record<string, QueryValues>;
    cacheTtlSeconds?: number;
  },
): Promise<JsonRecord> {
  const config = getQuranFoundationConfig();
  if (!config.contentClientId || !config.contentClientSecret) {
    throw new QuranFoundationError("Quran Foundation content credentials are not configured.", {
      status: 503,
      code: "qf_content_not_configured",
      retryable: false,
    });
  }

  const token = await getContentAccessToken();
  const response = await fetch(buildContentApiUrl(path, options?.query), {
    headers: {
      accept: "application/json",
      "x-auth-token": token,
      "x-client-id": config.contentClientId,
    },
    next: options?.cacheTtlSeconds ? { revalidate: options.cacheTtlSeconds } : undefined,
  });

  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok || !payload) {
    const message =
      (payload && typeof payload.message === "string" && payload.message) ||
      `Quran Foundation content request failed (${response.status}).`;
    throw new QuranFoundationError(message, {
      status: response.status || 503,
      code: "qf_content_request_failed",
    });
  }

  return payload;
}

function unwrapArray(payload: JsonRecord, ...keys: string[]): JsonRecord[] {
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }
  if (Array.isArray(payload.data)) {
    return payload.data.filter(isRecord);
  }
  return [];
}

function unwrapRecord(payload: JsonRecord, ...keys: string[]): JsonRecord {
  for (const key of keys) {
    const value = payload[key];
    if (isRecord(value)) {
      return value;
    }
  }
  return payload;
}

function buildMatchTokens(...parts: Array<string | null>): string[] {
  return Array.from(
    new Set(
      parts
        .map((part) => normalizeText(part))
        .filter(Boolean)
        .flatMap((part) => part.split(/[^a-z0-9]+/).filter(Boolean))
        .filter((part) => part.length >= 3),
    ),
  );
}

function scoreByLanguage(languageName: string | null): number {
  const normalized = normalizeText(languageName);
  const index = LANGUAGE_PRIORITY.findIndex((value) => normalized.includes(value));
  return index >= 0 ? LANGUAGE_PRIORITY.length - index : 0;
}

function scoreByTokens(label: string, needles: string[]): number {
  const normalized = normalizeText(label);
  return needles.reduce((score, needle, index) => {
    if (!normalized.includes(needle)) {
      return score;
    }
    return score + Math.max(1, needles.length - index) * 10;
  }, 0);
}

function sortContentResources(
  rows: QuranFoundationContentResource[],
  options: {
    featuredTokens: string[];
    preferredId: number | null;
  },
): QuranFoundationContentResource[] {
  return [...rows].sort((left, right) => {
    const leftScore =
      (left.id === options.preferredId ? 500 : 0) +
      scoreByLanguage(left.languageName) * 15 +
      scoreByTokens(`${left.label} ${left.authorName ?? ""}`, options.featuredTokens);
    const rightScore =
      (right.id === options.preferredId ? 500 : 0) +
      scoreByLanguage(right.languageName) * 15 +
      scoreByTokens(`${right.label} ${right.authorName ?? ""}`, options.featuredTokens);
    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }
    return left.label.localeCompare(right.label);
  });
}

function sortRecitations(rows: QuranFoundationRecitationResource[]): QuranFoundationRecitationResource[] {
  return [...rows].sort((left, right) => {
    const leftScore =
      scoreByLanguage(left.languageName) * 10 +
      scoreByTokens(`${left.label} ${left.style ?? ""}`, FEATURED_RECITER_TOKENS);
    const rightScore =
      scoreByLanguage(right.languageName) * 10 +
      scoreByTokens(`${right.label} ${right.style ?? ""}`, FEATURED_RECITER_TOKENS);
    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }
    return left.label.localeCompare(right.label);
  });
}

function mapContentResource(row: JsonRecord): QuranFoundationContentResource | null {
  const id = readNumber(row, "id", "resource_id");
  const label = readString(row, "name", "translated_name", "resource_name");
  if (!id || !label) {
    return null;
  }
  const languageName = readString(row, "language_name");
  return {
    id,
    label,
    authorName: readString(row, "author_name"),
    languageName,
    direction: normalizeDirection(readString(row, "direction") ?? languageName),
    slug: readString(row, "slug"),
  };
}

function mapRecitationResource(row: JsonRecord): QuranFoundationRecitationResource | null {
  const id = readNumber(row, "id", "recitation_id");
  const label = readString(row, "reciter_name", "translated_name", "name");
  if (!id || !label) {
    return null;
  }
  const languageName = readString(row, "language_name");
  const style = readString(row, "style");
  const translatedName = readString(row, "translated_name");
  const descriptionParts = [style, languageName ? `${languageName} recitation` : null, "Official Quran.com audio"].filter(Boolean);
  return {
    id,
    label,
    translatedName,
    languageName,
    direction: normalizeDirection(readString(row, "direction") ?? languageName),
    style,
    description: descriptionParts.join(" · "),
    matchTokens: buildMatchTokens(label, translatedName, style, languageName),
  };
}

function mapSupportText(row: QuranFoundationRawSupportText): QuranFoundationSupportText | null {
  const resourceId = readNumber(row, "resource_id", "id");
  const text = stripHtml(readString(row, "text", "translation", "tafsir") ?? "");
  if (!resourceId || !text) {
    return null;
  }
  const languageName = readString(row, "language_name");
  return {
    resourceId,
    text,
    resourceName: readString(row, "resource_name", "name", "translated_name"),
    languageName,
    direction: normalizeDirection(readString(row, "direction") ?? languageName),
  };
}

async function withTimedCache<T>(cache: TimedCache<T>, loader: () => Promise<T>): Promise<T> {
  if (cache.value && cache.expiresAt > Date.now()) {
    return cache.value;
  }
  if (!cache.inFlight) {
    cache.inFlight = loader().then((value) => {
      cache.value = value;
      cache.expiresAt = Date.now() + RESOURCE_CACHE_TTL_MS;
      return value;
    }).finally(() => {
      cache.inFlight = null;
    });
  }
  return cache.inFlight;
}

async function listContentResources(
  path: string,
  arrayKey: string,
  cache: TimedCache<QuranFoundationContentResource[]>,
  options: {
    featuredTokens: string[];
    preferredId: number | null;
  },
): Promise<QuranFoundationContentResource[]> {
  return withTimedCache(cache, async () => {
    const payload = await quranFoundationContentRequest(path, {
      cacheTtlSeconds: FETCH_REVALIDATE_SECONDS,
    });
    return sortContentResources(
      unwrapArray(payload, arrayKey).map(mapContentResource).filter(Boolean) as QuranFoundationContentResource[],
      options,
    );
  });
}

function buildCatalogDetail(kind: "translation" | "tafsir" | "recitation", count: number): string {
  if (count <= 0) {
    return `Official Quran Foundation ${kind}s are unavailable right now.`;
  }
  return `Official Quran Foundation ${kind}s are ready to enrich the reader.`;
}

function resolveDefaultTranslationId(
  translations: QuranFoundationContentResource[],
  preferredId: number | null,
): number | null {
  if (preferredId && translations.some((item) => item.id === preferredId)) {
    return preferredId;
  }
  return translations[0]?.id ?? null;
}

function resolveDefaultTafsirIds(
  tafsirs: QuranFoundationContentResource[],
  preferredId: number | null,
): number[] {
  const selected: number[] = [];
  if (preferredId && tafsirs.some((item) => item.id === preferredId)) {
    selected.push(preferredId);
  }
  for (const item of tafsirs) {
    if (!selected.includes(item.id)) {
      selected.push(item.id);
    }
    if (selected.length >= 1) {
      break;
    }
  }
  return selected;
}

export async function getQuranFoundationContentCatalog(): Promise<QuranFoundationContentCatalog> {
  if (!hasQuranFoundationContentConfig()) {
    return {
      status: "not_configured",
      detail:
        "Set QF_CONTENT_CLIENT_ID and QF_CONTENT_CLIENT_SECRET to enable official Quran Foundation enrichment.",
      translations: [],
      tafsirs: [],
      defaultTranslationId: null,
      defaultTafsirIds: [],
    };
  }

  const config = getQuranFoundationConfig();
  try {
    const [translations, tafsirs] = await Promise.all([
      listContentResources("/resources/translations", "translations", translationCatalogCache, {
        featuredTokens: FEATURED_TRANSLATION_TOKENS,
        preferredId: config.contentTranslationResourceId,
      }),
      listContentResources("/resources/tafsirs", "tafsirs", tafsirCatalogCache, {
        featuredTokens: FEATURED_TAFSIR_TOKENS,
        preferredId: config.contentTafsirResourceId,
      }),
    ]);

    return {
      status: "available",
      detail: `${buildCatalogDetail("translation", translations.length)} ${buildCatalogDetail("tafsir", tafsirs.length)}`,
      translations,
      tafsirs,
      defaultTranslationId: resolveDefaultTranslationId(translations, config.contentTranslationResourceId),
      defaultTafsirIds: resolveDefaultTafsirIds(tafsirs, config.contentTafsirResourceId),
    };
  } catch (error) {
    return {
      status: "degraded",
      detail: error instanceof Error ? error.message : "Could not load official Quran Foundation resources.",
      translations: [],
      tafsirs: [],
      defaultTranslationId: null,
      defaultTafsirIds: [],
    };
  }
}

export async function getQuranFoundationRecitationCatalog(): Promise<QuranFoundationRecitationCatalog> {
  if (!hasQuranFoundationContentConfig()) {
    return {
      status: "not_configured",
      detail:
        "Set QF_CONTENT_CLIENT_ID and QF_CONTENT_CLIENT_SECRET to enable official Quran Foundation reciters.",
      recitations: [],
    };
  }

  try {
    const recitations = await withTimedCache(recitationCatalogCache, async () => {
      const payload = await quranFoundationContentRequest("/resources/recitations", {
        cacheTtlSeconds: FETCH_REVALIDATE_SECONDS,
      });
      return sortRecitations(
        unwrapArray(payload, "recitations")
          .map(mapRecitationResource)
          .filter(Boolean) as QuranFoundationRecitationResource[],
      );
    });

    return {
      status: "available",
      detail: buildCatalogDetail("recitation", recitations.length),
      recitations,
    };
  } catch (error) {
    return {
      status: "degraded",
      detail: error instanceof Error ? error.message : "Could not load official Quran Foundation reciters.",
      recitations: [],
    };
  }
}

function mapSelectedSupportTexts(
  rows: QuranFoundationRawSupportText[],
  selectedIds: number[],
): QuranFoundationSupportText[] {
  const mapped = rows.map(mapSupportText).filter(Boolean) as QuranFoundationSupportText[];
  if (!selectedIds.length) {
    return mapped;
  }
  const byId = new Map(mapped.map((item) => [item.resourceId, item]));
  return selectedIds.map((id) => byId.get(id)).filter(Boolean) as QuranFoundationSupportText[];
}

function buildDetail(
  verseKey: string,
  officialTranslation: QuranFoundationSupportText | null,
  officialTafsirs: QuranFoundationSupportText[],
): string {
  if (officialTafsirs.length > 0) {
    const names = officialTafsirs.map((item) => item.resourceName).filter(Boolean);
    if (names.length > 0) {
      return `Official Quran Foundation tafsir loaded from ${names.join(" and ")}.`;
    }
    return "Official Quran Foundation tafsir is ready for this ayah.";
  }
  if (officialTranslation?.resourceName) {
    return `Official Quran Foundation translation loaded from ${officialTranslation.resourceName}.`;
  }
  return `Official Quran Foundation verse metadata loaded for ${verseKey}.`;
}

export async function getQuranFoundationAyahEnrichment(
  verseKey: `${number}:${number}`,
  options?: {
    translationId?: number | null;
    tafsirIds?: number[];
  },
): Promise<QuranFoundationAyahEnrichment> {
  if (!hasQuranFoundationContentConfig()) {
    return {
      status: "not_configured",
      detail:
        "Set QF_CONTENT_CLIENT_ID and QF_CONTENT_CLIENT_SECRET to enable official Quran Foundation enrichment.",
      verseKey,
      pageNumber: null,
      juzNumber: null,
      hizbNumber: null,
      rubElHizbNumber: null,
      officialTranslation: null,
      officialTafsirs: [],
    };
  }

  const catalog = await getQuranFoundationContentCatalog();
  const selectedTranslationId =
    options?.translationId && catalog.translations.some((item) => item.id === options.translationId)
      ? options.translationId
      : catalog.defaultTranslationId;
  const selectedTafsirIds = Array.from(
    new Set(
      (options?.tafsirIds ?? catalog.defaultTafsirIds)
        .filter((id) => catalog.tafsirs.some((item) => item.id === id))
        .slice(0, MAX_DEFAULT_TAFSIRS),
    ),
  );

  try {
    const payload = await quranFoundationContentRequest(`/verses/by_key/${encodeURIComponent(verseKey)}`, {
      query: {
        translations: selectedTranslationId ? [selectedTranslationId] : undefined,
        tafsirs: selectedTafsirIds.length ? selectedTafsirIds : undefined,
        words: false,
      },
      cacheTtlSeconds: FETCH_REVALIDATE_SECONDS,
    });
    const verse = unwrapRecord(payload, "verse");
    const translationRows = unwrapArray(verse, "translations");
    const tafsirRows = unwrapArray(verse, "tafsirs");
    const officialTranslation = mapSelectedSupportTexts(
      translationRows,
      selectedTranslationId ? [selectedTranslationId] : [],
    )[0] ?? null;
    const officialTafsirs = mapSelectedSupportTexts(tafsirRows, selectedTafsirIds);

    return {
      status: "available",
      detail: buildDetail(verseKey, officialTranslation, officialTafsirs),
      verseKey: readString(verse, "verse_key") ?? verseKey,
      pageNumber: readNumber(verse, "page_number", "pageNumber"),
      juzNumber: readNumber(verse, "juz_number", "juzNumber"),
      hizbNumber: readNumber(verse, "hizb_number", "hizbNumber"),
      rubElHizbNumber: readNumber(verse, "rub_el_hizb_number", "rubElHizbNumber"),
      officialTranslation,
      officialTafsirs,
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
      officialTafsirs: [],
    };
  }
}

function recitationMatchScore(resource: QuranFoundationRecitationResource, tokens: string[]): number {
  if (!tokens.length) {
    return 0;
  }
  return tokens.reduce((score, token) => {
    if (resource.matchTokens.includes(token)) {
      return score + 20;
    }
    if (normalizeText(resource.label).includes(token)) {
      return score + 10;
    }
    if (resource.style && normalizeText(resource.style).includes(token)) {
      return score + 4;
    }
    return score;
  }, 0);
}

async function resolveQuranFoundationRecitation(input: {
  reciterId: string;
}): Promise<{
  status: QuranFoundationContentStatus;
  detail: string;
  recitation: QuranFoundationRecitationResource | null;
}> {
  const requestedRemoteId = parseQuranFoundationReciterId(input.reciterId);
  const catalog = await getQuranFoundationRecitationCatalog();
  if (catalog.status !== "available") {
    return {
      status: catalog.status,
      detail: catalog.detail,
      recitation: null,
    };
  }
  if (requestedRemoteId) {
    return {
      status: catalog.status,
      detail: catalog.detail,
      recitation: catalog.recitations.find((item) => item.id === requestedRemoteId) ?? null,
    };
  }

  const effectiveLocalReciterId = resolveLocalAudioReciterId(input.reciterId);
  if (!effectiveLocalReciterId) {
    return {
      status: catalog.status,
      detail: catalog.detail,
      recitation: null,
    };
  }
  const tokens = getLocalReciterMatchTokens(effectiveLocalReciterId);
  const best = [...catalog.recitations]
    .map((item) => ({ item, score: recitationMatchScore(item, tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)[0];
  return {
    status: catalog.status,
    detail: catalog.detail,
    recitation: best?.item ?? null,
  };
}

function extractAudioUrl(row: QuranFoundationRawRecitationAudio): string | null {
  return normalizeRemoteAudioUrl(readString(row, "url", "audio_url"));
}

function normalizeRemoteAudioUrl(rawUrl: string | null): string | null {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  const configuredBase = process.env.QF_AUDIO_BASE_URL?.trim() || DEFAULT_QURAN_FOUNDATION_AUDIO_BASE_URL;
  const base = configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`;
  return new URL(trimmed.replace(/^\/+/, ""), base).toString();
}

function matchesVerseKey(row: QuranFoundationRawRecitationAudio, verseKey: string): boolean {
  return readString(row, "verse_key", "verseKey") === verseKey;
}

export async function getQuranFoundationAyahAudioSource(input: {
  verseKey: `${number}:${number}`;
  surahNumber: number;
  reciterId: string;
}): Promise<QuranFoundationAyahAudioSource> {
  if (!hasQuranFoundationContentConfig()) {
    return {
      status: "not_configured",
      detail:
        "Set QF_CONTENT_CLIENT_ID and QF_CONTENT_CLIENT_SECRET to enable Quran.com audio fallback.",
      verseKey: input.verseKey,
      recitationId: null,
      recitationLabel: null,
      url: null,
    };
  }

  try {
    const resolvedRecitation = await resolveQuranFoundationRecitation({ reciterId: input.reciterId });
    if (resolvedRecitation.status !== "available") {
      return {
        status: resolvedRecitation.status,
        detail: resolvedRecitation.detail,
        verseKey: input.verseKey,
        recitationId: null,
        recitationLabel: null,
        url: null,
      };
    }

    const recitation = resolvedRecitation.recitation;
    if (!recitation) {
      return {
        status: "not_found",
        detail: "No matching Quran.com reciter was found for this selection.",
        verseKey: input.verseKey,
        recitationId: null,
        recitationLabel: null,
        url: null,
      };
    }

    const payload = await quranFoundationContentRequest(
      `/recitations/${recitation.id}/by_chapter/${Math.max(1, Math.floor(input.surahNumber))}`,
      {
        cacheTtlSeconds: FETCH_REVALIDATE_SECONDS,
      },
    );
    const audioRows = unwrapArray(payload, "audio_files", "files", "recitations");
    const audioRow = audioRows.find((row) => matchesVerseKey(row, input.verseKey));
    const url = audioRow ? extractAudioUrl(audioRow) : null;
    if (!url) {
      return {
        status: "not_found",
        detail: `Quran.com did not return verse audio for ${input.verseKey}.`,
        verseKey: input.verseKey,
        recitationId: recitation.id,
        recitationLabel: recitation.label,
        url: null,
      };
    }

    return {
      status: "available",
      detail: `Streaming official Quran.com audio from ${recitation.label}.`,
      verseKey: input.verseKey,
      recitationId: recitation.id,
      recitationLabel: recitation.label,
      url,
    };
  } catch (error) {
    return {
      status: "degraded",
      detail: error instanceof Error ? error.message : "Could not load Quran.com audio right now.",
      verseKey: input.verseKey,
      recitationId: null,
      recitationLabel: null,
      url: null,
    };
  }
}
