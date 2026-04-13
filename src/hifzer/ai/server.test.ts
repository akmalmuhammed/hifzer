import { afterEach, describe, expect, it, vi } from "vitest";
import { requestAyahExplanation, requestQuranAssistantAnswer } from "./server";

const ORIGINAL_ENV = {
  HIFZER_AI_GATEWAY_URL: process.env.HIFZER_AI_GATEWAY_URL,
  HIFZER_AI_GATEWAY_TOKEN: process.env.HIFZER_AI_GATEWAY_TOKEN,
  HIFZER_AI_GATEWAY_TIMEOUT_MS: process.env.HIFZER_AI_GATEWAY_TIMEOUT_MS,
};

const REQUEST_FIXTURE = {
  verseKey: "1:1",
  surahNumber: 1,
  ayahNumber: 1,
  arabicText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  responseLanguage: "English",
  localTranslation: {
    text: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    label: "English - Sahih International",
    sourceLabel: "QuranEnc",
    direction: "ltr" as const,
  },
};

function createAbortError(): Error {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

afterEach(() => {
  process.env.HIFZER_AI_GATEWAY_URL = ORIGINAL_ENV.HIFZER_AI_GATEWAY_URL;
  process.env.HIFZER_AI_GATEWAY_TOKEN = ORIGINAL_ENV.HIFZER_AI_GATEWAY_TOKEN;
  process.env.HIFZER_AI_GATEWAY_TIMEOUT_MS = ORIGINAL_ENV.HIFZER_AI_GATEWAY_TIMEOUT_MS;
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ai/server", () => {
  it("returns success when the AI gateway responds with a grounded explanation", async () => {
    process.env.HIFZER_AI_GATEWAY_URL = "https://gateway.example";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: true,
            provider: "gemini",
            model: "gemini-2.5-flash",
            verseKey: "1:1",
            explanation: {
              summary: "A short grounded explanation.",
              keyThemes: ["Mercy"],
              tafsirInsights: [],
              wordNotes: [],
              reflectionPrompt: null,
              sources: [{ label: "Tafsir Ibn Kathir", kind: "tafsir" }],
              groundingTools: ["fetch_quran"],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const result = await requestAyahExplanation(REQUEST_FIXTURE);

    expect(result).toMatchObject({
      ok: true,
      provider: "gemini",
      model: "gemini-2.5-flash",
      verseKey: "1:1",
    });
  });

  it("returns a timeout status when the AI gateway exceeds the configured deadline", async () => {
    process.env.HIFZER_AI_GATEWAY_URL = "https://gateway.example";
    process.env.HIFZER_AI_GATEWAY_TIMEOUT_MS = "5000";

    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_, reject) => {
          const signal = init?.signal;
          if (!signal) {
            return;
          }
          if (signal.aborted) {
            reject(createAbortError());
            return;
          }
          signal.addEventListener(
            "abort",
            () => {
              reject(createAbortError());
            },
            { once: true },
          );
        })),
    );

    const resultPromise = requestAyahExplanation(REQUEST_FIXTURE);
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await resultPromise;

    expect(result).toEqual({
      ok: false,
      status: "timeout",
      detail: "AI explanation is taking longer than expected. Please try again.",
    });
  });

  it("returns success when the Quran assistant gateway responds with grounded matches", async () => {
    process.env.HIFZER_AI_GATEWAY_URL = "https://gateway.example";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: true,
            provider: "groq",
            model: "openai/gpt-oss-20b",
            query: "ayah about sadness",
            answer: {
              summary: "The Quran acknowledges sorrow and teaches turning grief to Allah with patience and trust.",
              keyTakeaways: ["Grief is acknowledged.", "Patience and trust are central."],
              ayahMatches: [
                {
                  verseKey: "12:86",
                  surahNumber: 12,
                  ayahNumber: 86,
                  arabicText: "قال إنما أشكو بثي وحزني إلى الله",
                  translationText: "He said, I only complain of my sorrow and grief to Allah.",
                  translationLabel: "Maududi",
                  sourceUrl: "https://quran.com/12/86",
                  relevanceScore: 0.57,
                  relevanceReason: "Yaqub directs his grief to Allah.",
                },
              ],
              tafsirHighlights: [],
              followUpPrompt: "What verses speak about patience during grief?",
              sources: [{ label: "Quran 12:86", kind: "quran" }],
              groundingTools: ["fetch_grounding_rules", "search_quran", "search_tafsir"],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const result = await requestQuranAssistantAnswer({
      query: "ayah about sadness",
      responseLanguage: "English",
      currentAyah: null,
    });

    expect(result).toMatchObject({
      ok: true,
      provider: "groq",
      model: "openai/gpt-oss-20b",
      query: "ayah about sadness",
    });
  });
});
