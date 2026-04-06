type ProviderName = "gemini";
type SourceKind = "quran" | "translation" | "tafsir" | "word_study" | "other";

type ExplainAyahRequest = {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  responseLanguage: string;
  localTranslation: {
    text: string;
    label: string;
    sourceLabel: string | null;
    direction: "ltr" | "rtl";
  } | null;
};

type ExplainAyahResponse = {
  ok: true;
  provider: string;
  model: string;
  verseKey: string;
  explanation: {
    summary: string;
    keyThemes: string[];
    tafsirInsights: Array<{ title: string; detail: string; source: string }>;
    wordNotes: Array<{ term: string; detail: string }>;
    reflectionPrompt: string | null;
    sources: Array<{ label: string; kind: SourceKind }>;
    groundingTools: string[];
  };
};

type ErrorResponse = {
  ok: false;
  status: "not_configured" | "error";
  detail: string;
};

type Env = {
  AI_PROVIDER?: string;
  AI_GATEWAY_SHARED_SECRET?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  QURAN_MCP_URL?: string;
};

type JsonRecord = Record<string, unknown>;

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_QURAN_MCP_URL = "https://mcp.quran.ai";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function trimValue(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function json(data: ExplainAyahResponse | ErrorResponse | JsonRecord, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPositiveInt(value: unknown): number | null {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readString(record: JsonRecord, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function assertExplainAyahRequest(payload: unknown): ExplainAyahRequest | null {
  if (!isRecord(payload)) {
    return null;
  }

  const verseKey = readString(payload, "verseKey");
  const arabicText = readString(payload, "arabicText");
  const responseLanguage = readString(payload, "responseLanguage");
  const surahNumber = toPositiveInt(payload.surahNumber);
  const ayahNumber = toPositiveInt(payload.ayahNumber);
  if (!verseKey || !arabicText || !responseLanguage || !surahNumber || !ayahNumber) {
    return null;
  }

  let localTranslation: ExplainAyahRequest["localTranslation"] = null;
  if (payload.localTranslation != null) {
    if (!isRecord(payload.localTranslation)) {
      return null;
    }
    const text = readString(payload.localTranslation, "text");
    const label = readString(payload.localTranslation, "label");
    const sourceLabel = readString(payload.localTranslation, "sourceLabel");
    const direction = readString(payload.localTranslation, "direction");
    if (!text || !label || (direction !== "ltr" && direction !== "rtl")) {
      return null;
    }
    localTranslation = { text, label, sourceLabel, direction };
  }

  return {
    verseKey,
    surahNumber,
    ayahNumber,
    arabicText,
    responseLanguage,
    localTranslation,
  };
}

function authorize(request: Request, env: Env): boolean {
  const expected = trimValue(env.AI_GATEWAY_SHARED_SECRET);
  if (!expected) {
    return true;
  }
  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${expected}`;
}

function resolveProvider(env: Env): ProviderName {
  const requested = trimValue(env.AI_PROVIDER)?.toLowerCase();
  if (!requested || requested === "gemini") {
    return "gemini";
  }
  throw new Error(`Unsupported AI provider "${requested}".`);
}

function coerceStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeSources(value: unknown): Array<{ label: string; kind: SourceKind }> {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: Array<{ label: string; kind: SourceKind }> = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const label = readString(item, "label");
    const kind = readString(item, "kind");
    if (!label) {
      continue;
    }
    out.push({
      label,
      kind:
        kind === "quran" || kind === "translation" || kind === "tafsir" || kind === "word_study" || kind === "other"
          ? kind
          : "other",
    });
  }
  return out.slice(0, 8);
}

function normalizeInsights(value: unknown): Array<{ title: string; detail: string; source: string }> {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: Array<{ title: string; detail: string; source: string }> = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const title = readString(item, "title");
    const detail = readString(item, "detail");
    const source = readString(item, "source");
    if (!title || !detail || !source) {
      continue;
    }
    out.push({ title, detail, source });
  }
  return out.slice(0, 4);
}

function normalizeWordNotes(value: unknown): Array<{ term: string; detail: string }> {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: Array<{ term: string; detail: string }> = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const term = readString(item, "term");
    const detail = readString(item, "detail");
    if (!term || !detail) {
      continue;
    }
    out.push({ term, detail });
  }
  return out.slice(0, 4);
}

function parseJsonFromText(raw: string): JsonRecord {
  const trimmed = raw.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  const candidate = firstBrace >= 0 && lastBrace > firstBrace ? trimmed.slice(firstBrace, lastBrace + 1) : trimmed;
  const parsed = JSON.parse(candidate) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("Model response was not a JSON object.");
  }
  return parsed;
}

function extractGeminiText(payload: unknown): string {
  if (!isRecord(payload) || !Array.isArray(payload.outputs)) {
    throw new Error("Gemini response did not include outputs.");
  }

  for (let index = payload.outputs.length - 1; index >= 0; index -= 1) {
    const output = payload.outputs[index];
    if (!isRecord(output)) {
      continue;
    }
    if (typeof output.text === "string" && output.text.trim()) {
      return output.text;
    }
    if (Array.isArray(output.content)) {
      for (const part of output.content) {
        if (isRecord(part) && typeof part.text === "string" && part.text.trim()) {
          return part.text;
        }
      }
    }
  }

  throw new Error("Gemini response did not include a text answer.");
}

function normalizeExplainAyahResponse(
  verseKey: string,
  provider: string,
  model: string,
  payload: JsonRecord,
): ExplainAyahResponse {
  const summary = readString(payload, "summary") ?? "A grounded explanation is not available right now.";
  const reflectionPrompt = readString(payload, "reflectionPrompt");
  return {
    ok: true,
    provider,
    model,
    verseKey,
    explanation: {
      summary,
      keyThemes: coerceStringArray(payload.keyThemes, 5),
      tafsirInsights: normalizeInsights(payload.tafsirInsights),
      wordNotes: normalizeWordNotes(payload.wordNotes),
      reflectionPrompt,
      sources: normalizeSources(payload.sources),
      groundingTools: coerceStringArray(payload.groundingTools, 8),
    },
  };
}

function buildExplainAyahPrompt(input: ExplainAyahRequest): string {
  const translationContext = input.localTranslation
    ? [
        `Reader translation (${input.localTranslation.label})`,
        input.localTranslation.text,
        input.localTranslation.sourceLabel ? `Source: ${input.localTranslation.sourceLabel}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "No local translation was supplied from the app.";

  return [
    `Explain Quran ayah ${input.verseKey} for the Hifzer reader in ${input.responseLanguage}.`,
    "",
    "You must use Quran MCP tools before answering.",
    "1. Call fetch_grounding_rules first and follow them.",
    "2. Fetch the exact Arabic ayah text.",
    "3. Fetch at least one translation.",
    "4. Fetch at least one tafsir, and use a second tafsir when it adds meaningful context.",
    "5. Use word-study tools only when they genuinely clarify a term.",
    "",
    "Safety rules:",
    "- Do not answer from model memory alone.",
    "- Do not give fatwa-style rulings or claim scholarly consensus unless the tools clearly support it.",
    "- Keep the tone plain, reverent, and concise.",
    "- Prefer source-backed explanation over speculative interpretation.",
    "",
    "Return only valid JSON with this exact shape:",
    `{
  "summary": "2-4 sentences in plain language",
  "keyThemes": ["short theme", "short theme"],
  "tafsirInsights": [
    { "title": "short title", "detail": "1-3 sentences", "source": "edition or scholar name" }
  ],
  "wordNotes": [
    { "term": "Arabic word or phrase", "detail": "short explanation" }
  ],
  "reflectionPrompt": "optional reflective question or null",
  "sources": [
    { "label": "edition or scholar name", "kind": "quran|translation|tafsir|word_study|other" }
  ],
  "groundingTools": ["fetch_grounding_rules", "fetch_quran"]
}`,
    "",
    "Ayah context from Hifzer:",
    `Ayah key: ${input.verseKey}`,
    `Surah number: ${input.surahNumber}`,
    `Ayah number: ${input.ayahNumber}`,
    `Arabic text in-app: ${input.arabicText}`,
    translationContext,
  ].join("\n");
}

async function explainAyahWithGemini(
  input: ExplainAyahRequest,
  env: Env,
): Promise<ExplainAyahResponse | ErrorResponse> {
  const apiKey = trimValue(env.GEMINI_API_KEY);
  if (!apiKey) {
    return {
      ok: false,
      status: "not_configured",
      detail: "GEMINI_API_KEY is missing from the AI gateway.",
    };
  }

  const model = trimValue(env.GEMINI_MODEL) ?? DEFAULT_GEMINI_MODEL;
  const quranMcpUrl = trimValue(env.QURAN_MCP_URL) ?? DEFAULT_QURAN_MCP_URL;
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      store: false,
      input: buildExplainAyahPrompt(input),
      tools: [
        {
          type: "mcp_server",
          name: "quran",
          url: quranMcpUrl,
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok) {
    return {
      ok: false,
      status: response.status === 401 || response.status === 403 ? "not_configured" : "error",
      detail:
        (payload && readString(payload, "error")) ||
        (payload && readString(payload, "message")) ||
        "Gemini could not generate a grounded ayah explanation.",
    };
  }

  const rawText = extractGeminiText(payload);
  const normalized = normalizeExplainAyahResponse(input.verseKey, "gemini", model, parseJsonFromText(rawText));
  return normalized;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);

      if (!authorize(request, env)) {
        return json({ ok: false, status: "error", detail: "Unauthorized." }, 401);
      }

      if (request.method === "GET" && url.pathname === "/health") {
        return json({
          ok: true,
          provider: trimValue(env.AI_PROVIDER) ?? "gemini",
          geminiConfigured: Boolean(trimValue(env.GEMINI_API_KEY)),
          quranMcpUrl: trimValue(env.QURAN_MCP_URL) ?? DEFAULT_QURAN_MCP_URL,
        });
      }

      if (request.method === "POST" && url.pathname === "/v1/quran/explain-ayah") {
        const body = await request.json().catch(() => null);
        const input = assertExplainAyahRequest(body);
        if (!input) {
          return json({ ok: false, status: "error", detail: "Invalid explain-ayah payload." }, 400);
        }

        const provider = resolveProvider(env);
        if (provider === "gemini") {
          const result = await explainAyahWithGemini(input, env);
          if (result.ok) {
            return json(result, 200);
          }
          return json(result, result.status === "not_configured" ? 503 : 502);
        }
      }

      return json({ ok: false, status: "error", detail: "Not found." }, 404);
    } catch (error) {
      return json(
        {
          ok: false,
          status: "error",
          detail: error instanceof Error ? error.message : "Unexpected AI gateway error.",
        },
        500,
      );
    }
  },
};

export default worker;
