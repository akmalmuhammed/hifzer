import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getQuranFoundationConfig, normalizeQuranFoundationScopes } from "./config";
import { QuranFoundationError } from "./types";

export type QuranFoundationTokenSet = {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  scopes: string[];
};

export type QuranFoundationIdentity = {
  sub: string | null;
  name: string | null;
  email: string | null;
};

type JsonRecord = Record<string, unknown>;

type QuranFoundationOidcMetadata = {
  issuer: string;
  jwksUri: string;
  userInfoEndpoint: string | null;
};

const OIDC_METADATA_TTL_MS = 60 * 60 * 1000;

let oidcMetadataCache: {
  value: QuranFoundationOidcMetadata | null;
  expiresAt: number;
  inFlight: Promise<QuranFoundationOidcMetadata> | null;
} = {
  value: null,
  expiresAt: 0,
  inFlight: null,
};

function base64UrlEncode(input: Buffer): string {
  return input.toString("base64url");
}

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

function normalizeIssuer(input: string): string {
  return input.replace(/\/+$/, "");
}

function toIdentity(record: JsonRecord): QuranFoundationIdentity {
  return {
    sub: readString(record, "sub"),
    name: readString(record, "name", "preferred_username", "given_name"),
    email: readString(record, "email"),
  };
}

async function fetchQuranFoundationOidcMetadata(): Promise<QuranFoundationOidcMetadata> {
  const config = getQuranFoundationConfig();
  const url = new URL("/.well-known/openid-configuration", `${config.oauthBaseUrl.replace(/\/+$/, "")}/`);
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !isRecord(payload)) {
    throw new QuranFoundationError("Quran Foundation OpenID configuration could not be loaded.", {
      status: response.status || 503,
      code: "qf_oidc_metadata_unavailable",
    });
  }

  const issuer = readString(payload, "issuer");
  const jwksUri = readString(payload, "jwks_uri");
  const userInfoEndpoint = readString(payload, "userinfo_endpoint");
  if (!issuer || !jwksUri) {
    throw new QuranFoundationError("Quran Foundation OpenID metadata was missing required endpoints.", {
      status: 502,
      code: "qf_oidc_metadata_invalid",
    });
  }

  return {
    issuer,
    jwksUri,
    userInfoEndpoint,
  };
}

async function getQuranFoundationOidcMetadata(): Promise<QuranFoundationOidcMetadata> {
  if (oidcMetadataCache.value && oidcMetadataCache.expiresAt > Date.now()) {
    return oidcMetadataCache.value;
  }

  if (!oidcMetadataCache.inFlight) {
    oidcMetadataCache.inFlight = fetchQuranFoundationOidcMetadata().then((value) => {
      oidcMetadataCache.value = value;
      oidcMetadataCache.expiresAt = Date.now() + OIDC_METADATA_TTL_MS;
      return value;
    }).finally(() => {
      oidcMetadataCache.inFlight = null;
    });
  }

  return oidcMetadataCache.inFlight;
}

function buildTokenSet(payload: Record<string, unknown>): QuranFoundationTokenSet {
  const accessToken = typeof payload.access_token === "string" ? payload.access_token : "";
  if (!accessToken) {
    throw new QuranFoundationError("Quran Foundation token response did not include an access token.", {
      status: 502,
      code: "qf_missing_access_token",
    });
  }
  const expiresIn = Number(payload.expires_in);
  return {
    accessToken,
    refreshToken: typeof payload.refresh_token === "string" ? payload.refresh_token : null,
    idToken: typeof payload.id_token === "string" ? payload.id_token : null,
    accessTokenExpiresAt: Number.isFinite(expiresIn) ? new Date(Date.now() + (expiresIn * 1000)) : null,
    scopes: normalizeQuranFoundationScopes(typeof payload.scope === "string" ? payload.scope : null),
  };
}

function parseTokenResponse(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new QuranFoundationError("Quran Foundation token response was malformed.", {
      status: 502,
      code: "qf_token_response_invalid",
    });
  }
  return data as Record<string, unknown>;
}

async function postTokenExchange(params: URLSearchParams): Promise<QuranFoundationTokenSet> {
  const config = getQuranFoundationConfig();
  if (!config.oauthClientId) {
    throw new QuranFoundationError("Quran Foundation OAuth client ID is not configured.", {
      status: 503,
      code: "qf_client_id_missing",
      retryable: false,
    });
  }

  params.set("client_id", config.oauthClientId);
  if (config.oauthClientSecret) {
    params.set("client_secret", config.oauthClientSecret);
  }

  const response = await fetch(`${config.oauthBaseUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });
  const payload = parseTokenResponse(await response.json().catch(() => null));
  if (!response.ok) {
    const message =
      (typeof payload.error_description === "string" && payload.error_description) ||
      (typeof payload.error === "string" && payload.error) ||
      `Quran Foundation token exchange failed (${response.status}).`;
    throw new QuranFoundationError(message, {
      status: response.status,
      code: typeof payload.error === "string" ? payload.error : "qf_token_exchange_failed",
      retryable: response.status >= 500 || response.status === 429,
    });
  }
  return buildTokenSet(payload);
}

export function createPkceChallenge(): { verifier: string; challenge: string } {
  const verifier = base64UrlEncode(randomBytes(32));
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function createOAuthState(): string {
  return base64UrlEncode(randomBytes(24));
}

export function createOAuthNonce(): string {
  return base64UrlEncode(randomBytes(24));
}

export function buildQuranFoundationAuthorizeUrl(input: {
  state: string;
  codeChallenge: string;
  scopes: string[];
  nonce?: string | null;
}): string {
  const config = getQuranFoundationConfig();
  if (!config.oauthClientId) {
    throw new QuranFoundationError("Quran Foundation OAuth client ID is not configured.", {
      status: 503,
      code: "qf_client_id_missing",
      retryable: false,
    });
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.oauthClientId,
    redirect_uri: config.redirectUri,
    scope: input.scopes.join(" "),
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  });
  if (input.nonce) {
    params.set("nonce", input.nonce);
  }
  return `${config.oauthBaseUrl}/oauth2/auth?${params.toString()}`;
}

export async function exchangeQuranFoundationCode(code: string, codeVerifier: string): Promise<QuranFoundationTokenSet> {
  const config = getQuranFoundationConfig();
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    redirect_uri: config.redirectUri,
  });
  return postTokenExchange(params);
}

export async function refreshQuranFoundationToken(refreshToken: string): Promise<QuranFoundationTokenSet> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return postTokenExchange(params);
}

async function verifyIdTokenPayload(idToken: string, audience: string, issuer: string, jwksUri: string) {
  const jwks = createRemoteJWKSet(new URL(jwksUri));
  return jwtVerify(idToken, jwks, {
    audience,
    issuer,
  });
}

export async function verifyQuranFoundationIdentity(
  idToken: string | null,
  options?: { expectedNonce?: string | null },
): Promise<QuranFoundationIdentity> {
  if (!idToken) {
    throw new QuranFoundationError("Quran Foundation did not return an ID token for the OpenID flow.", {
      status: 502,
      code: "qf_id_token_missing",
    });
  }

  const config = getQuranFoundationConfig();
  if (!config.oauthClientId) {
    throw new QuranFoundationError("Quran Foundation OAuth client ID is not configured.", {
      status: 503,
      code: "qf_client_id_missing",
      retryable: false,
    });
  }

  const metadata = await getQuranFoundationOidcMetadata();
  let verified;
  try {
    verified = await verifyIdTokenPayload(idToken, config.oauthClientId, metadata.issuer, metadata.jwksUri);
  } catch (error) {
    const normalizedIssuer = normalizeIssuer(metadata.issuer);
    const alternateIssuer = metadata.issuer.endsWith("/") ? normalizedIssuer : `${normalizedIssuer}/`;
    if (alternateIssuer === metadata.issuer) {
      throw error;
    }
    verified = await verifyIdTokenPayload(idToken, config.oauthClientId, alternateIssuer, metadata.jwksUri);
  }

  const payload = verified.payload as JsonRecord;
  const expectedNonce = options?.expectedNonce?.trim() ?? null;
  if (expectedNonce) {
    const actualNonce = readString(payload, "nonce");
    if (!actualNonce || actualNonce !== expectedNonce) {
      throw new QuranFoundationError("Quran Foundation ID token nonce mismatch.", {
        status: 401,
        code: "qf_nonce_mismatch",
        retryable: false,
      });
    }
  }

  return toIdentity(payload);
}

export async function fetchQuranFoundationUserInfo(accessToken: string): Promise<QuranFoundationIdentity | null> {
  const metadata = await getQuranFoundationOidcMetadata();
  if (!metadata.userInfoEndpoint) {
    return null;
  }

  const response = await fetch(metadata.userInfoEndpoint, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !isRecord(payload)) {
    throw new QuranFoundationError("Quran Foundation user info could not be loaded.", {
      status: response.status || 503,
      code: "qf_userinfo_failed",
    });
  }

  return toIdentity(payload);
}

export async function resolveQuranFoundationIdentity(
  tokenSet: QuranFoundationTokenSet,
  options?: { expectedNonce?: string | null },
): Promise<QuranFoundationIdentity> {
  const verifiedIdentity = tokenSet.idToken
    ? await verifyQuranFoundationIdentity(tokenSet.idToken, options)
    : null;

  let userInfoIdentity: QuranFoundationIdentity | null = null;
  const needsUserInfo = !verifiedIdentity?.sub || !verifiedIdentity.name || !verifiedIdentity.email;
  if (needsUserInfo) {
    try {
      userInfoIdentity = await fetchQuranFoundationUserInfo(tokenSet.accessToken);
    } catch (error) {
      if (!verifiedIdentity?.sub) {
        throw error;
      }
    }
  }

  const identity = {
    sub: userInfoIdentity?.sub ?? verifiedIdentity?.sub ?? null,
    name: userInfoIdentity?.name ?? verifiedIdentity?.name ?? null,
    email: userInfoIdentity?.email ?? verifiedIdentity?.email ?? null,
  };

  if (!identity.sub) {
    throw new QuranFoundationError("Quran Foundation identity did not include a stable subject.", {
      status: 502,
      code: "qf_identity_missing_sub",
    });
  }

  return identity;
}

export function decodeQuranFoundationIdentity(idToken: string | null): QuranFoundationIdentity {
  if (!idToken) {
    return { sub: null, name: null, email: null };
  }
  const [, payload] = idToken.split(".");
  if (!payload) {
    return { sub: null, name: null, email: null };
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JsonRecord;
    return toIdentity(decoded);
  } catch {
    return { sub: null, name: null, email: null };
  }
}

export function resetQuranFoundationOidcCacheForTests() {
  oidcMetadataCache = {
    value: null,
    expiresAt: 0,
    inFlight: null,
  };
}
