import { afterEach, describe, expect, it } from "vitest";
import {
  getQuranFoundationConfig,
  hasQuranFoundationContentConfig,
  hasQuranFoundationUserFlowConfig,
  normalizeQuranFoundationScopes,
} from "./config";

const ORIGINAL_ENV = {
  QF_CLIENT_ID: process.env.QF_CLIENT_ID,
  QF_CLIENT_SECRET: process.env.QF_CLIENT_SECRET,
  QF_TOKEN_ENCRYPTION_SECRET: process.env.QF_TOKEN_ENCRYPTION_SECRET,
  QF_OAUTH_REDIRECT_URI: process.env.QF_OAUTH_REDIRECT_URI,
  QF_BOOKMARK_MUSHAF_ID: process.env.QF_BOOKMARK_MUSHAF_ID,
};

afterEach(() => {
  process.env.QF_CLIENT_ID = ORIGINAL_ENV.QF_CLIENT_ID;
  process.env.QF_CLIENT_SECRET = ORIGINAL_ENV.QF_CLIENT_SECRET;
  process.env.QF_TOKEN_ENCRYPTION_SECRET = ORIGINAL_ENV.QF_TOKEN_ENCRYPTION_SECRET;
  process.env.QF_OAUTH_REDIRECT_URI = ORIGINAL_ENV.QF_OAUTH_REDIRECT_URI;
  process.env.QF_BOOKMARK_MUSHAF_ID = ORIGINAL_ENV.QF_BOOKMARK_MUSHAF_ID;
});

describe("quran foundation config", () => {
  it("normalizes requested scopes", () => {
    expect(normalizeQuranFoundationScopes("openid  bookmark  bookmark user")).toEqual([
      "openid",
      "bookmark",
      "user",
    ]);
  });

  it("resolves user-flow and content readiness separately", () => {
    process.env.QF_CLIENT_ID = "client_123";
    process.env.QF_TOKEN_ENCRYPTION_SECRET = "secret_123";
    process.env.QF_CLIENT_SECRET = "";

    expect(hasQuranFoundationUserFlowConfig()).toBe(true);
    expect(hasQuranFoundationContentConfig()).toBe(false);
  });

  it("uses the configured redirect URI and mushaf id when present", () => {
    process.env.QF_OAUTH_REDIRECT_URI = "https://example.com/api/quran-foundation/callback";
    process.env.QF_BOOKMARK_MUSHAF_ID = "11";

    const config = getQuranFoundationConfig();
    expect(config.redirectUri).toBe("https://example.com/api/quran-foundation/callback");
    expect(config.bookmarkMushafId).toBe(11);
  });
});
