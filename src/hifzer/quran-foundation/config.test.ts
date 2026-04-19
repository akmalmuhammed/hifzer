import { afterEach, describe, expect, it } from "vitest";
import {
  getQuranFoundationConfig,
  getQuranFoundationRequestedScopes,
  hasQuranFoundationContentConfig,
  hasQuranFoundationUserFlowConfig,
  normalizeQuranFoundationScopes,
} from "./config";

const ORIGINAL_ENV = {
  QF_OAUTH_CLIENT_ID: process.env.QF_OAUTH_CLIENT_ID,
  QF_OAUTH_CLIENT_SECRET: process.env.QF_OAUTH_CLIENT_SECRET,
  QF_CONTENT_CLIENT_ID: process.env.QF_CONTENT_CLIENT_ID,
  QF_CONTENT_CLIENT_SECRET: process.env.QF_CONTENT_CLIENT_SECRET,
  QF_USER_TOKEN_ENCRYPTION_SECRET: process.env.QF_USER_TOKEN_ENCRYPTION_SECRET,
  QF_CLIENT_ID: process.env.QF_CLIENT_ID,
  QF_CLIENT_SECRET: process.env.QF_CLIENT_SECRET,
  QF_TOKEN_ENCRYPTION_SECRET: process.env.QF_TOKEN_ENCRYPTION_SECRET,
  QF_OAUTH_REDIRECT_URI: process.env.QF_OAUTH_REDIRECT_URI,
  QF_BOOKMARK_MUSHAF_ID: process.env.QF_BOOKMARK_MUSHAF_ID,
};

function restoreEnv(name: keyof typeof ORIGINAL_ENV) {
  const value = ORIGINAL_ENV[name];
  if (typeof value === "string") {
    process.env[name] = value;
    return;
  }
  delete process.env[name];
}

afterEach(() => {
  restoreEnv("QF_OAUTH_CLIENT_ID");
  restoreEnv("QF_OAUTH_CLIENT_SECRET");
  restoreEnv("QF_CONTENT_CLIENT_ID");
  restoreEnv("QF_CONTENT_CLIENT_SECRET");
  restoreEnv("QF_USER_TOKEN_ENCRYPTION_SECRET");
  restoreEnv("QF_CLIENT_ID");
  restoreEnv("QF_CLIENT_SECRET");
  restoreEnv("QF_TOKEN_ENCRYPTION_SECRET");
  restoreEnv("QF_OAUTH_REDIRECT_URI");
  restoreEnv("QF_BOOKMARK_MUSHAF_ID");
});

describe("quran foundation config", () => {
  it("normalizes requested scopes", () => {
    expect(normalizeQuranFoundationScopes("openid  bookmark  bookmark user")).toEqual([
      "openid",
      "bookmark",
      "user",
    ]);
  });

  it("requests the expanded user scopes for connected Quran sync", () => {
    expect(getQuranFoundationRequestedScopes()).toEqual([
      "openid",
      "offline_access",
      "bookmark",
      "user",
      "activity_day",
      "reading_session",
      "collection",
    ]);
  });

  it("treats shared oauth credentials as enough for both user and content flows", () => {
    delete process.env.QF_CLIENT_ID;
    delete process.env.QF_CLIENT_SECRET;
    delete process.env.QF_CONTENT_CLIENT_ID;
    delete process.env.QF_CONTENT_CLIENT_SECRET;
    process.env.QF_OAUTH_CLIENT_ID = "oauth_client_123";
    process.env.QF_OAUTH_CLIENT_SECRET = "oauth_secret_123";
    process.env.QF_USER_TOKEN_ENCRYPTION_SECRET = "secret_123";
    delete process.env.QF_TOKEN_ENCRYPTION_SECRET;

    expect(hasQuranFoundationUserFlowConfig()).toBe(true);
    expect(hasQuranFoundationContentConfig()).toBe(true);
  });

  it("treats the server-side user flow as not ready without an oauth client secret", () => {
    delete process.env.QF_CLIENT_ID;
    delete process.env.QF_CLIENT_SECRET;
    process.env.QF_OAUTH_CLIENT_ID = "oauth_client_123";
    delete process.env.QF_OAUTH_CLIENT_SECRET;
    process.env.QF_USER_TOKEN_ENCRYPTION_SECRET = "secret_123";

    expect(hasQuranFoundationUserFlowConfig()).toBe(false);
  });

  it("falls back to the legacy env names when the new ones are not set", () => {
    delete process.env.QF_OAUTH_CLIENT_ID;
    delete process.env.QF_OAUTH_CLIENT_SECRET;
    delete process.env.QF_CONTENT_CLIENT_ID;
    delete process.env.QF_CONTENT_CLIENT_SECRET;
    delete process.env.QF_USER_TOKEN_ENCRYPTION_SECRET;
    process.env.QF_CLIENT_ID = "legacy_client_123";
    process.env.QF_CLIENT_SECRET = "legacy_secret_123";
    process.env.QF_TOKEN_ENCRYPTION_SECRET = "legacy_encrypt_123";

    const config = getQuranFoundationConfig();
    expect(config.oauthClientId).toBe("legacy_client_123");
    expect(config.oauthClientSecret).toBe("legacy_secret_123");
    expect(config.contentClientId).toBe("legacy_client_123");
    expect(config.contentClientSecret).toBe("legacy_secret_123");
    expect(config.userTokenEncryptionSecret).toBe("legacy_encrypt_123");
  });

  it("uses the configured redirect URI and mushaf id when present", () => {
    process.env.QF_OAUTH_REDIRECT_URI = "https://example.com/api/quran-foundation/callback";
    process.env.QF_BOOKMARK_MUSHAF_ID = "11";

    const config = getQuranFoundationConfig();
    expect(config.redirectUri).toBe("https://example.com/api/quran-foundation/callback");
    expect(config.bookmarkMushafId).toBe(11);
  });
});
