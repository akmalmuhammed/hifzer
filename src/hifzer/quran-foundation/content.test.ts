import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = {
  QF_CONTENT_CLIENT_ID: process.env.QF_CONTENT_CLIENT_ID,
  QF_CONTENT_CLIENT_SECRET: process.env.QF_CONTENT_CLIENT_SECRET,
  QF_CLIENT_ID: process.env.QF_CLIENT_ID,
  QF_CLIENT_SECRET: process.env.QF_CLIENT_SECRET,
};

afterEach(() => {
  process.env.QF_CONTENT_CLIENT_ID = ORIGINAL_ENV.QF_CONTENT_CLIENT_ID;
  process.env.QF_CONTENT_CLIENT_SECRET = ORIGINAL_ENV.QF_CONTENT_CLIENT_SECRET;
  process.env.QF_CLIENT_ID = ORIGINAL_ENV.QF_CLIENT_ID;
  process.env.QF_CLIENT_SECRET = ORIGINAL_ENV.QF_CLIENT_SECRET;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("quran foundation content integration", () => {
  it("requests a content-scoped access token for official enrichment", async () => {
    process.env.QF_CONTENT_CLIENT_ID = "content_client_123";
    process.env.QF_CONTENT_CLIENT_SECRET = "content_secret_123";

    const fetchMock = vi.fn(async (...[input]: Parameters<typeof fetch>) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/oauth2/token")) {
        return new Response(JSON.stringify({
          access_token: "token_123",
          expires_in: 3600,
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.includes("/resources/translations")) {
        return new Response(JSON.stringify({
          translations: [
            {
              id: 20,
              name: "Saheeh International",
              author_name: "Saheeh International",
              language_name: "English",
            },
          ],
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.includes("/resources/tafsirs")) {
        return new Response(JSON.stringify({
          tafsirs: [
            {
              id: 169,
              name: "Ibn Kathir",
              author_name: "Ibn Kathir",
              language_name: "English",
            },
          ],
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { getQuranFoundationContentCatalog } = await import("./content");
    const catalog = await getQuranFoundationContentCatalog();

    expect(catalog.status).toBe("available");
    expect(fetchMock).toHaveBeenCalled();

    const tokenCall = fetchMock.mock.calls.find(([input]) => {
      const url = typeof input === "string" ? input : input.toString();
      return url.includes("/oauth2/token");
    });

    expect(tokenCall).toBeTruthy();
    if (!tokenCall) {
      throw new Error("Expected a token request call.");
    }
    const [, tokenInit] = tokenCall;
    const body = tokenInit?.body;
    expect(body).toBeInstanceOf(URLSearchParams);
    expect((body as URLSearchParams).get("grant_type")).toBe("client_credentials");
    expect((body as URLSearchParams).get("scope")).toBe("content");
  });

  it("surfaces degraded recitation catalog errors instead of masking them as missing reciters", async () => {
    process.env.QF_CONTENT_CLIENT_ID = "content_client_123";
    process.env.QF_CONTENT_CLIENT_SECRET = "content_secret_123";

    const fetchMock = vi.fn(async (...[input]: Parameters<typeof fetch>) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/oauth2/token")) {
        return new Response(JSON.stringify({
          access_token: "token_123",
          expires_in: 3600,
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (url.includes("/resources/recitations")) {
        return new Response(JSON.stringify({
          message: "The access token does not have the required scopes",
        }), {
          status: 403,
          headers: { "content-type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { getQuranFoundationAyahAudioSource } = await import("./content");
    const audio = await getQuranFoundationAyahAudioSource({
      verseKey: "1:1",
      surahNumber: 1,
      reciterId: "abdul-basit-murattal",
    });

    expect(audio.status).toBe("degraded");
    expect(audio.detail).toContain("required scopes");
  });
});
