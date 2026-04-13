import "server-only";

import { createHash, randomBytes } from "node:crypto";
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

function base64UrlEncode(input: Buffer): string {
  return input.toString("base64url");
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
  if (!config.clientId) {
    throw new QuranFoundationError("Quran Foundation client ID is not configured.", {
      status: 503,
      code: "qf_client_id_missing",
      retryable: false,
    });
  }

  params.set("client_id", config.clientId);
  if (config.clientSecret) {
    params.set("client_secret", config.clientSecret);
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

export function buildQuranFoundationAuthorizeUrl(input: {
  state: string;
  codeChallenge: string;
  scopes: string[];
  redirectUri?: string;
}): string {
  const config = getQuranFoundationConfig();
  if (!config.clientId) {
    throw new QuranFoundationError("Quran Foundation client ID is not configured.", {
      status: 503,
      code: "qf_client_id_missing",
      retryable: false,
    });
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: input.redirectUri ?? config.redirectUri,
    scope: input.scopes.join(" "),
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${config.oauthBaseUrl}/oauth2/auth?${params.toString()}`;
}

export async function exchangeQuranFoundationCode(
  code: string,
  codeVerifier: string,
  redirectUri?: string,
): Promise<QuranFoundationTokenSet> {
  const config = getQuranFoundationConfig();
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri ?? config.redirectUri,
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

export function decodeQuranFoundationIdentity(idToken: string | null): QuranFoundationIdentity {
  if (!idToken) {
    return { sub: null, name: null, email: null };
  }
  const [, payload] = idToken.split(".");
  if (!payload) {
    return { sub: null, name: null, email: null };
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    return {
      sub: typeof decoded.sub === "string" ? decoded.sub : null,
      name:
        typeof decoded.name === "string"
          ? decoded.name
          : typeof decoded.preferred_username === "string"
            ? decoded.preferred_username
            : null,
      email: typeof decoded.email === "string" ? decoded.email : null,
    };
  } catch {
    return { sub: null, name: null, email: null };
  }
}
