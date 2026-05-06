import "server-only";

import { getSiteUrl } from "@/lib/site-url";

const DEFAULT_OAUTH_BASE_URL = "https://oauth2.quran.foundation";
const DEFAULT_USER_API_BASE_URL = "https://apis.quran.foundation/auth/v1";
const DEFAULT_CONTENT_API_BASE_URL = "https://apis.quran.foundation/content/api/v4";
const DEFAULT_BOOKMARK_MUSHAF_ID = 4;

export const QURAN_FOUNDATION_REQUESTED_USER_SCOPES = [
  "openid",
  "offline_access",
  "bookmark",
  "user",
  "activity_day",
  "reading_session",
  "collection",
  "streak",
  "goal",
  "note",
] as const;

function trimEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readFirstEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = trimEnv(process.env[name]);
    if (value) {
      return value;
    }
  }
  return null;
}

function parseOptionalPositiveInt(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

export type QuranFoundationRuntimeConfig = {
  oauthClientId: string | null;
  oauthClientSecret: string | null;
  contentClientId: string | null;
  contentClientSecret: string | null;
  userTokenEncryptionSecret: string | null;
  oauthBaseUrl: string;
  userApiBaseUrl: string;
  contentApiBaseUrl: string;
  redirectUri: string;
  bookmarkMushafId: number;
  contentTranslationResourceId: number | null;
  contentTafsirResourceId: number | null;
};

export function getQuranFoundationRedirectUri(siteUrl?: URL | string | null): string {
  const configured = trimEnv(process.env.QF_OAUTH_REDIRECT_URI);
  if (configured) {
    return configured;
  }

  const baseUrl =
    siteUrl instanceof URL
      ? siteUrl
      : typeof siteUrl === "string"
        ? new URL(siteUrl)
        : getSiteUrl();
  return new URL("/api/quran-foundation/callback", baseUrl).toString();
}

export function getQuranFoundationConfig(siteUrl?: URL | string | null): QuranFoundationRuntimeConfig {
  const redirectUri = getQuranFoundationRedirectUri(siteUrl);

  return {
    oauthClientId: readFirstEnv("QF_OAUTH_CLIENT_ID", "QF_CLIENT_ID"),
    oauthClientSecret: readFirstEnv("QF_OAUTH_CLIENT_SECRET", "QF_CLIENT_SECRET"),
    contentClientId: readFirstEnv("QF_CONTENT_CLIENT_ID", "QF_OAUTH_CLIENT_ID", "QF_CLIENT_ID"),
    contentClientSecret: readFirstEnv("QF_CONTENT_CLIENT_SECRET", "QF_OAUTH_CLIENT_SECRET", "QF_CLIENT_SECRET"),
    userTokenEncryptionSecret: readFirstEnv("QF_USER_TOKEN_ENCRYPTION_SECRET", "QF_TOKEN_ENCRYPTION_SECRET"),
    oauthBaseUrl: trimEnv(process.env.QF_OAUTH_BASE_URL) ?? DEFAULT_OAUTH_BASE_URL,
    userApiBaseUrl: trimEnv(process.env.QF_USER_API_BASE_URL) ?? DEFAULT_USER_API_BASE_URL,
    contentApiBaseUrl: trimEnv(process.env.QF_CONTENT_API_BASE_URL) ?? DEFAULT_CONTENT_API_BASE_URL,
    redirectUri,
    bookmarkMushafId:
      parseOptionalPositiveInt(process.env.QF_BOOKMARK_MUSHAF_ID) ?? DEFAULT_BOOKMARK_MUSHAF_ID,
    contentTranslationResourceId: parseOptionalPositiveInt(process.env.QF_CONTENT_TRANSLATION_RESOURCE_ID),
    contentTafsirResourceId: parseOptionalPositiveInt(process.env.QF_CONTENT_TAFSIR_RESOURCE_ID),
  };
}

export function getQuranFoundationRequestedScopes(): string[] {
  return [...QURAN_FOUNDATION_REQUESTED_USER_SCOPES];
}

export function hasQuranFoundationUserFlowConfig(): boolean {
  const config = getQuranFoundationConfig();
  return Boolean(config.oauthClientId && config.oauthClientSecret && config.userTokenEncryptionSecret);
}

export function hasQuranFoundationContentConfig(): boolean {
  const config = getQuranFoundationConfig();
  return Boolean(config.contentClientId && config.contentClientSecret);
}

export function normalizeQuranFoundationScopes(scopes: string[] | string | null | undefined): string[] {
  const values = Array.isArray(scopes) ? scopes : typeof scopes === "string" ? scopes.split(/\s+/) : [];
  return Array.from(
    new Set(
      values
        .map((scope) => scope.trim())
        .filter(Boolean),
    ),
  );
}
