import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildQuranFoundationAuthorizeUrl,
  createOAuthNonce,
  createOAuthState,
  createPkceChallenge,
  decodeQuranFoundationIdentity,
  exchangeQuranFoundationCode,
  resetQuranFoundationOidcCacheForTests,
  resolveQuranFoundationIdentity,
} from "./oauth";

const { jwtVerifyMock, createRemoteJWKSetMock } = vi.hoisted(() => ({
  jwtVerifyMock: vi.fn(),
  createRemoteJWKSetMock: vi.fn(() => Symbol("jwks")),
}));

vi.mock("jose", () => ({
  createRemoteJWKSet: createRemoteJWKSetMock,
  jwtVerify: jwtVerifyMock,
}));

const ORIGINAL_ENV = {
  QF_OAUTH_CLIENT_ID: process.env.QF_OAUTH_CLIENT_ID,
  QF_OAUTH_CLIENT_SECRET: process.env.QF_OAUTH_CLIENT_SECRET,
  QF_OAUTH_BASE_URL: process.env.QF_OAUTH_BASE_URL,
};

function buildIdTokenPayload(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

function restoreEnv(name: keyof typeof ORIGINAL_ENV) {
  const value = ORIGINAL_ENV[name];
  if (typeof value === "string") {
    process.env[name] = value;
    return;
  }
  delete process.env[name];
}

beforeEach(() => {
  process.env.QF_OAUTH_CLIENT_ID = "oauth_client_123";
  process.env.QF_OAUTH_CLIENT_SECRET = "oauth_secret_123";
  process.env.QF_OAUTH_BASE_URL = "https://oauth2.quran.foundation";
  resetQuranFoundationOidcCacheForTests();
  jwtVerifyMock.mockReset();
  createRemoteJWKSetMock.mockClear();
});

afterEach(() => {
  restoreEnv("QF_OAUTH_CLIENT_ID");
  restoreEnv("QF_OAUTH_CLIENT_SECRET");
  restoreEnv("QF_OAUTH_BASE_URL");
  resetQuranFoundationOidcCacheForTests();
  vi.unstubAllGlobals();
});

describe("quran foundation oauth helpers", () => {
  it("creates a verifier and challenge pair", () => {
    const result = createPkceChallenge();
    expect(result.verifier.length).toBeGreaterThan(20);
    expect(result.challenge.length).toBeGreaterThan(20);
    expect(result.verifier).not.toBe(result.challenge);
  });

  it("creates opaque oauth state", () => {
    const first = createOAuthState();
    const second = createOAuthState();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(20);
  });

  it("creates opaque oauth nonce values", () => {
    const first = createOAuthNonce();
    const second = createOAuthNonce();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(20);
  });

  it("includes nonce in the authorize url when present", () => {
    const url = new URL(
      buildQuranFoundationAuthorizeUrl({
        state: "state_123",
        codeChallenge: "challenge_123",
        nonce: "nonce_123",
        scopes: ["openid", "offline_access", "bookmark", "user"],
      }),
    );

    expect(url.origin).toBe("https://oauth2.quran.foundation");
    expect(url.pathname).toBe("/oauth2/auth");
    expect(url.searchParams.get("nonce")).toBe("nonce_123");
    expect(url.searchParams.get("code_challenge")).toBe("challenge_123");
  });

  it("decodes the identity fields from an id token payload", () => {
    const identity = decodeQuranFoundationIdentity(
      buildIdTokenPayload({
        sub: "qf-user-1",
        name: "Quran User",
        email: "reader@example.com",
      }),
    );

    expect(identity).toEqual({
      sub: "qf-user-1",
      name: "Quran User",
      email: "reader@example.com",
    });
  });

  it("verifies nonce and falls back to userinfo for missing fields", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          issuer: "https://oauth2.quran.foundation",
          jwks_uri: "https://oauth2.quran.foundation/.well-known/jwks.json",
          userinfo_endpoint: "https://oauth2.quran.foundation/userinfo",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: "qf-user-1",
          email: "reader@example.com",
          name: "Reader from userinfo",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: "qf-user-1",
        nonce: "nonce_123",
      },
    });

    const identity = await resolveQuranFoundationIdentity(
      {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        idToken: "header.payload.signature",
        accessTokenExpiresAt: null,
        scopes: ["openid", "offline_access", "bookmark", "user"],
      },
      { expectedNonce: "nonce_123" },
    );

    expect(identity).toEqual({
      sub: "qf-user-1",
      name: "Reader from userinfo",
      email: "reader@example.com",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(jwtVerifyMock).toHaveBeenCalledOnce();
  });

  it("rejects id tokens with a mismatched nonce", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        issuer: "https://oauth2.quran.foundation",
        jwks_uri: "https://oauth2.quran.foundation/.well-known/jwks.json",
        userinfo_endpoint: "https://oauth2.quran.foundation/userinfo",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: "qf-user-1",
        nonce: "different_nonce",
      },
    });

    await expect(
      resolveQuranFoundationIdentity(
        {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          idToken: "header.payload.signature",
          accessTokenExpiresAt: null,
          scopes: ["openid", "offline_access", "bookmark", "user"],
        },
        { expectedNonce: "nonce_123" },
      ),
    ).rejects.toMatchObject({
      code: "qf_nonce_mismatch",
    });
  });

  it("uses client_secret_basic for token exchange when the oauth client has a secret", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "access-token",
        refresh_token: "refresh-token",
        id_token: "id-token",
        expires_in: 3600,
        scope: "openid offline_access bookmark user",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await exchangeQuranFoundationCode("code_123", "verifier_123");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.headers).toMatchObject({
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${Buffer.from("oauth_client_123:oauth_secret_123").toString("base64")}`,
    });
    expect(String(init?.body)).not.toContain("client_secret=");
    expect(String(init?.body)).not.toContain("client_id=");
  });
});
