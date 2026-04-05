import "server-only";

import { getSiteUrl } from "@/lib/site-url";

const DEFAULT_OAUTH_BASE_URL = "https://oauth2.quran.foundation";
const DEFAULT_USER_API_BASE_URL = "https://apis.quran.foundation/auth/v1";
const DEFAULT_BOOKMARK_MUSHAF_ID = 4;

function trimEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalPositiveInt(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

export type QuranFoundationRuntimeConfig = {
  clientId: string | null;
  clientSecret: string | null;
  encryptionSecret: string | null;
  oauthBaseUrl: string;
  userApiBaseUrl: string;
  redirectUri: string;
  bookmarkMushafId: number;
  contentTranslationResourceId: number | null;
  contentTafsirResourceId: number | null;
};

export function getQuranFoundationConfig(): QuranFoundationRuntimeConfig {
  const siteUrl = getSiteUrl();
  const redirectUri =
    trimEnv(process.env.QF_OAUTH_REDIRECT_URI) ??
    new URL("/api/quran-foundation/callback", siteUrl).toString();

  return {
    clientId: trimEnv(process.env.QF_CLIENT_ID),
    clientSecret: trimEnv(process.env.QF_CLIENT_SECRET),
    encryptionSecret: trimEnv(process.env.QF_TOKEN_ENCRYPTION_SECRET),
    oauthBaseUrl: trimEnv(process.env.QF_OAUTH_BASE_URL) ?? DEFAULT_OAUTH_BASE_URL,
    userApiBaseUrl: trimEnv(process.env.QF_USER_API_BASE_URL) ?? DEFAULT_USER_API_BASE_URL,
    redirectUri,
    bookmarkMushafId:
      parseOptionalPositiveInt(process.env.QF_BOOKMARK_MUSHAF_ID) ?? DEFAULT_BOOKMARK_MUSHAF_ID,
    contentTranslationResourceId: parseOptionalPositiveInt(process.env.QF_CONTENT_TRANSLATION_RESOURCE_ID),
    contentTafsirResourceId: parseOptionalPositiveInt(process.env.QF_CONTENT_TAFSIR_RESOURCE_ID),
  };
}

export function getQuranFoundationRequestedScopes(): string[] {
  return ["openid", "offline_access", "bookmark", "user"];
}

export function hasQuranFoundationUserFlowConfig(): boolean {
  const config = getQuranFoundationConfig();
  return Boolean(config.clientId && config.encryptionSecret);
}

export function hasQuranFoundationContentConfig(): boolean {
  const config = getQuranFoundationConfig();
  return Boolean(config.clientId && config.clientSecret);
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
