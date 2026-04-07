import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type ProviderName = "gemini" | "groq";
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
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
  GROQ_FORMAT_MODEL?: string;
  QURAN_MCP_URL?: string;
};

type JsonRecord = Record<string, unknown>;

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";
const DEFAULT_QURAN_MCP_URL = "https://mcp.quran.ai";
const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GROQ_RESPONSES_URL = "https://api.groq.com/openai/v1/responses";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};
const EXPLAIN_AYAH_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    keyThemes: {
      type: "array",
      items: { type: "string" },
    },
    tafsirInsights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          source: { type: "string" },
        },
        required: ["title", "detail", "source"],
      },
    },
    wordNotes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          term: { type: "string" },
          detail: { type: "string" },
        },
        required: ["term", "detail"],
      },
    },
    reflectionPrompt: {
      type: ["string", "null"],
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          kind: {
            type: "string",
            enum: ["quran", "translation", "tafsir", "word_study", "other"],
          },
        },
        required: ["label", "kind"],
      },
    },
    groundingTools: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "summary",
    "keyThemes",
    "tafsirInsights",
    "wordNotes",
    "reflectionPrompt",
    "sources",
    "groundingTools",
  ],
} as const;

function trimValue(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function readErrorDetail(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const direct =
    readString(payload, "detail") ?? readString(payload, "message") ?? readString(payload, "error");
  if (direct) {
    return direct;
  }

  if (isRecord(payload.error)) {
    return readString(payload.error, "message") ?? readString(payload.error, "status");
  }

  return null;
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
  if (requested === "groq") {
    return "groq";
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

function unwrapMarkdownCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function stripMarkdownCodeFenceMarkers(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*$/gim, "")
    .replace(/^```\s*$/gim, "")
    .trim();
}

function extractJsonObjectCandidate(raw: string): string {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  return firstBrace >= 0 && lastBrace > firstBrace ? raw.slice(firstBrace, lastBrace + 1) : raw;
}

export function parseJsonFromText(raw: string): JsonRecord {
  const attempts = Array.from(
    new Set(
      [raw.trim(), unwrapMarkdownCodeFence(raw), stripMarkdownCodeFenceMarkers(raw.trim())]
        .flatMap((candidate) => [candidate, extractJsonObjectCandidate(candidate)])
        .map((candidate) => candidate.trim())
        .filter(Boolean),
    ),
  );

  let lastError: Error | null = null;
  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!isRecord(parsed)) {
        throw new Error("Model response was not a JSON object.");
      }
      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Model response was not valid JSON.");
    }
  }

  throw lastError ?? new Error("Model response was not valid JSON.");
}

function stripListMarker(line: string): string {
  return line.replace(/^\s*(?:[-*•]|\d+\.)\s*/, "").trim();
}

function isEmptyOrNone(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized === "none" || normalized === "null" || normalized === "n/a";
}

export function parseGroundedExplainText(raw: string): JsonRecord {
  const sectionMap = new Map<string, string[]>();
  const lines = raw.split(/\r?\n/);
  let currentSection: string | null = null;

  for (const line of lines) {
    const match = line.match(/^\s*(SUMMARY|THEMES|TAFSIR|WORD NOTES|REFLECTION|SOURCES|GROUNDING TOOLS)\s*:\s*(.*)$/i);
    if (match) {
      currentSection = match[1].toUpperCase();
      sectionMap.set(currentSection, []);
      const inlineValue = match[2]?.trim();
      if (inlineValue) {
        sectionMap.get(currentSection)?.push(inlineValue);
      }
      continue;
    }

    if (currentSection) {
      sectionMap.get(currentSection)?.push(line);
    }
  }

  const summary = (sectionMap.get("SUMMARY") ?? [])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const keyThemes = (sectionMap.get("THEMES") ?? [])
    .map(stripListMarker)
    .filter((line) => !isEmptyOrNone(line))
    .slice(0, 5);

  const tafsirInsights = (sectionMap.get("TAFSIR") ?? [])
    .map(stripListMarker)
    .filter((line) => !isEmptyOrNone(line))
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 3) {
        return {
          title: parts[0],
          detail: parts.slice(1, -1).join(" | "),
          source: parts.at(-1) ?? "Grounded tafsir",
        };
      }
      if (parts.length === 2) {
        return {
          title: parts[0],
          detail: parts[1],
          source: "Grounded tafsir",
        };
      }
      return {
        title: "Tafsir insight",
        detail: line,
        source: "Grounded tafsir",
      };
    })
    .slice(0, 4);

  const wordNotes = (sectionMap.get("WORD NOTES") ?? [])
    .map(stripListMarker)
    .filter((line) => !isEmptyOrNone(line))
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return {
          term: parts[0],
          detail: parts.slice(1).join(" | "),
        };
      }
      const [term, ...detail] = line.split(":").map((part) => part.trim()).filter(Boolean);
      if (term && detail.length) {
        return {
          term,
          detail: detail.join(": "),
        };
      }
      return {
        term: "Word note",
        detail: line,
      };
    })
    .slice(0, 4);

  const reflectionRaw = (sectionMap.get("REFLECTION") ?? [])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const reflectionPrompt = isEmptyOrNone(reflectionRaw) ? null : reflectionRaw;

  const sources = (sectionMap.get("SOURCES") ?? [])
    .map(stripListMarker)
    .filter((line) => !isEmptyOrNone(line))
    .map((line) => {
      const [labelPart, kindPart] = line.split("|").map((part) => part.trim());
      const kind = kindPart?.toLowerCase();
      return {
        label: labelPart || line,
        kind:
          kind === "quran" || kind === "translation" || kind === "tafsir" || kind === "word_study" || kind === "other"
            ? kind
            : "other",
      };
    })
    .slice(0, 8);

  const groundingTools = (sectionMap.get("GROUNDING TOOLS") ?? [])
    .map(stripListMarker)
    .filter((line) => !isEmptyOrNone(line))
    .slice(0, 8);

  return {
    summary,
    keyThemes,
    tafsirInsights,
    wordNotes,
    reflectionPrompt,
    sources,
    groundingTools,
  };
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
    if (readString(output, "type") === "text" && typeof output.text === "string" && output.text.trim()) {
      return output.text;
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

  const outputTypes = payload.outputs
    .map((output) => (isRecord(output) ? readString(output, "type") ?? "unknown" : "invalid"))
    .join(", ");
  throw new Error(`Gemini response did not include a text answer. Output types: ${outputTypes || "none"}`);
}

function extractGenerateContentText(payload: unknown): string {
  if (!isRecord(payload) || !Array.isArray(payload.candidates)) {
    throw new Error("Gemini formatted response did not include candidates.");
  }

  for (const candidate of payload.candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
      continue;
    }
    for (const part of candidate.content.parts) {
      if (isRecord(part) && typeof part.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }

  throw new Error("Gemini formatted response did not include text.");
}

function extractGroqResponseText(payload: unknown): string {
  if (!isRecord(payload)) {
    throw new Error("Groq response was not an object.");
  }

  const directText = readString(payload, "output_text");
  if (directText) {
    return directText;
  }

  if (!Array.isArray(payload.output)) {
    throw new Error("Groq response did not include output.");
  }

  for (let index = payload.output.length - 1; index >= 0; index -= 1) {
    const output = payload.output[index];
    if (!isRecord(output)) {
      continue;
    }
    if (readString(output, "type") !== "message" || !Array.isArray(output.content)) {
      continue;
    }
    for (const part of output.content) {
      if (!isRecord(part)) {
        continue;
      }
      if (readString(part, "type") === "output_text" && typeof part.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }

  throw new Error("Groq response did not include assistant text.");
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

function hasStructuredExplanationContent(payload: JsonRecord): boolean {
  return Boolean(
    readString(payload, "summary") ||
      normalizeInsights(payload.tafsirInsights).length ||
      normalizeWordNotes(payload.wordNotes).length ||
      normalizeSources(payload.sources).length ||
      coerceStringArray(payload.keyThemes, 5).length ||
      coerceStringArray(payload.groundingTools, 8).length ||
      readString(payload, "reflectionPrompt"),
  );
}

function scoreStructuredExplanation(payload: JsonRecord): number {
  return (
    (readString(payload, "summary") ? 3 : 0) +
    coerceStringArray(payload.keyThemes, 5).length +
    normalizeInsights(payload.tafsirInsights).length * 2 +
    normalizeWordNotes(payload.wordNotes).length +
    normalizeSources(payload.sources).length +
    (readString(payload, "reflectionPrompt") ? 1 : 0)
  );
}

function buildGeminiSystemInstruction(): string {
  return [
    "You are Hifzer's Quran explanation assistant.",
    "Ground every answer in the Quran MCP tools instead of model memory.",
    "Keep the tone plain, reverent, and concise.",
    "Avoid fatwa-style rulings, unsupported certainty, and speculative claims.",
    "Never use Markdown code fences.",
  ].join(" ");
}

function buildGroundedExplainAyahPrompt(input: ExplainAyahRequest): string {
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
    "3. Use the in-app translation below as the reader translation context unless it is missing or clearly insufficient.",
    "4. Fetch at least one tafsir, and only fetch a second tafsir when it adds meaningful context.",
    "5. Use word-study tools only when they genuinely clarify a term.",
    "6. Do not call list_editions unless a tafsir request cannot proceed without it.",
    "",
    "Return plain text using exactly these section headings:",
    "SUMMARY:",
    "THEMES:",
    "TAFSIR:",
    "WORD NOTES:",
    "REFLECTION:",
    "SOURCES:",
    "GROUNDING TOOLS:",
    "",
    "Formatting rules:",
    "- SUMMARY: 2-4 sentences in plain language.",
    "- THEMES: 2-5 bullet lines using '- '.",
    "- TAFSIR: up to 3 bullet lines using '- title | detail | source'.",
    "- WORD NOTES: up to 3 bullet lines using '- term | detail'. Use 'None' if not needed.",
    "- REFLECTION: one reflective question or 'None'.",
    "- SOURCES: one bullet line per source using '- label | quran|translation|tafsir|word_study|other'.",
    "- GROUNDING TOOLS: one bullet line per tool using '- tool_name'.",
    "",
    "Ayah context from Hifzer:",
    `Ayah key: ${input.verseKey}`,
    `Surah number: ${input.surahNumber}`,
    `Ayah number: ${input.ayahNumber}`,
    `Arabic text in-app: ${input.arabicText}`,
    translationContext,
  ].join("\n");
}

function buildGroundedExplainFollowupPrompt(input: ExplainAyahRequest): string {
  return [
    `Using only the grounding already gathered for Quran ayah ${input.verseKey}, produce the final notes now.`,
    "Do not call more tools unless the existing tool results are clearly insufficient.",
    "Use the exact same section headings and formatting rules from the prior instruction.",
    "Never use Markdown code fences.",
  ].join("\n");
}

function buildStructuredFormattingPrompt(input: ExplainAyahRequest, groundedText: string): string {
  return [
    `Convert the grounded notes for Quran ayah ${input.verseKey} into a JSON object that matches the schema.`,
    "Use only the grounded notes below.",
    "Do not add new facts, sources, tools, or interpretations.",
    "If a section is missing, use an empty array or null as appropriate.",
    "",
    "Grounded notes:",
    groundedText,
  ].join("\n");
}

function extractGroundingNonce(raw: string): string | null {
  const match = raw.match(/GROUNDING_NONCE:\s*([^\s<]+)/i) ?? raw.match(/<grounding_nonce>([^<]+)<\/grounding_nonce>/i);
  return match?.[1]?.trim() || null;
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function clipText(raw: string, maxChars: number): string {
  const normalized = raw.replace(/\s+/g, " ").trim();
  return normalized.length > maxChars ? `${normalized.slice(0, maxChars).trim()}...` : normalized;
}

async function withQuranMcpClient<T>(quranMcpUrl: string, run: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ name: "hifzer-ai-gateway", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(quranMcpUrl));
  try {
    await client.connect(transport);
    return await run(client);
  } finally {
    try {
      await transport.close();
    } catch {
      // Closing the stream can surface abort noise; the session is still done.
    }
  }
}

async function callQuranMcpTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<{ structuredContent: JsonRecord | null; texts: string[] }> {
  const result = await client.callTool({ name, arguments: args });
  const texts = Array.isArray(result.content)
    ? result.content
        .map((item) => (isRecord(item) && typeof item.text === "string" ? item.text : ""))
        .filter(Boolean)
    : [];

  return {
    structuredContent: isRecord(result.structuredContent) ? result.structuredContent : null,
    texts,
  };
}

function pickEditionText(result: JsonRecord | null, editionId: string): string | null {
  if (!result || !isRecord(result.results) || !Array.isArray(result.results[editionId])) {
    return null;
  }
  for (const item of result.results[editionId]) {
    if (isRecord(item) && typeof item.text === "string" && item.text.trim()) {
      return item.text.trim();
    }
  }
  return null;
}

async function fetchGroundedAyahContext(
  input: ExplainAyahRequest,
  quranMcpUrl: string,
): Promise<{
  arabicText: string;
  translation: { label: string; text: string } | null;
  tafsir: Array<{ label: string; text: string }>;
  sources: Array<{ label: string; kind: SourceKind }>;
  groundingTools: string[];
}> {
  return withQuranMcpClient(quranMcpUrl, async (client) => {
    const groundingRules = await callQuranMcpTool(client, "fetch_grounding_rules", {});
    const groundingNonce = groundingRules.texts.map(extractGroundingNonce).find(Boolean) ?? null;
    const commonArgs = groundingNonce ? { grounding_nonce: groundingNonce } : {};

    const quranResult = await callQuranMcpTool(client, "fetch_quran", {
      ayahs: input.verseKey,
      ...commonArgs,
    });
    const translationResult = await callQuranMcpTool(client, "fetch_translation", {
      ayahs: input.verseKey,
      editions: "en-abdel-haleem",
      ...commonArgs,
    });
    const tafsirResult = await callQuranMcpTool(client, "fetch_tafsir", {
      ayahs: input.verseKey,
      editions: ["ar-muyassar", "ar-jalalayn"],
      ...commonArgs,
    });

    const arabicText = pickEditionText(quranResult.structuredContent, "ar-simple-clean") ?? input.arabicText;
    const canonicalTranslationText = pickEditionText(translationResult.structuredContent, "en-abdel-haleem");
    const translation = canonicalTranslationText
      ? { label: "Abdel Haleem translation", text: canonicalTranslationText }
      : input.localTranslation
        ? { label: input.localTranslation.label, text: input.localTranslation.text }
        : null;

    const tafsir = [
      {
        label: "Tafsir al-Muyassar",
        text: clipText(stripHtml(pickEditionText(tafsirResult.structuredContent, "ar-muyassar") ?? ""), 900),
      },
      {
        label: "Tafsir al-Jalalayn",
        text: clipText(stripHtml(pickEditionText(tafsirResult.structuredContent, "ar-jalalayn") ?? ""), 700),
      },
    ].filter((item) => item.text);

    const sources: Array<{ label: string; kind: SourceKind }> = [{ label: `Quran ${input.verseKey}`, kind: "quran" }];
    if (translation) {
      sources.push({ label: translation.label, kind: "translation" });
    }
    for (const item of tafsir) {
      sources.push({ label: item.label, kind: "tafsir" });
    }

    return {
      arabicText,
      translation,
      tafsir,
      sources,
      groundingTools: ["fetch_grounding_rules", "fetch_quran", "fetch_translation", "fetch_tafsir"],
    };
  });
}

function buildGroqGroundedInput(
  input: ExplainAyahRequest,
  grounded: Awaited<ReturnType<typeof fetchGroundedAyahContext>>,
): string {
  return [
    `Explain Quran ayah ${input.verseKey} for the Hifzer reader in ${input.responseLanguage}.`,
    "Use only the grounded Quran.ai MCP material below. Do not add facts beyond it.",
    "",
    "Grounded material:",
    `Verse key: ${input.verseKey}`,
    `Arabic text: ${grounded.arabicText}`,
    grounded.translation ? `Canonical translation (${grounded.translation.label}): ${grounded.translation.text}` : null,
    ...grounded.tafsir.map((item) => `${item.label}: ${item.text}`),
    "",
    "Output rules:",
    "- Keep the summary plain and concise.",
    "- Key themes should be short phrases.",
    "- Tafsir insights must clearly attribute the source.",
    "- Only add word notes when the grounded material clearly supports them.",
    "- Preserve the exact sources and grounding tools used whenever possible.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function createGeminiInteraction(
  apiKey: string,
  body: JsonRecord,
): Promise<{ ok: true; payload: JsonRecord } | { ok: false; error: ErrorResponse }> {
  const response = await fetch(GEMINI_INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok || !payload) {
    return {
      ok: false,
      error: {
        ok: false,
        status: response.status === 401 || response.status === 403 ? "not_configured" : "error",
        detail: readErrorDetail(payload) ?? "Gemini could not start the grounded ayah explanation.",
      },
    };
  }
  return { ok: true, payload };
}

async function getGeminiInteraction(
  apiKey: string,
  interactionId: string,
): Promise<{ ok: true; payload: JsonRecord } | { ok: false; error: ErrorResponse }> {
  const response = await fetch(`${GEMINI_INTERACTIONS_URL}/${interactionId}`, {
    headers: {
      "x-goog-api-key": apiKey,
    },
  });
  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok || !payload) {
    return {
      ok: false,
      error: {
        ok: false,
        status: response.status === 401 || response.status === 403 ? "not_configured" : "error",
        detail: readErrorDetail(payload) ?? "Gemini could not retrieve the grounded ayah explanation.",
      },
    };
  }
  return { ok: true, payload };
}

function interactionNeedsPolling(payload: JsonRecord): boolean {
  const status = readString(payload, "status");
  return status === "in_progress" || status === "requires_action";
}

async function waitForGeminiInteraction(
  apiKey: string,
  payload: JsonRecord,
): Promise<{ ok: true; payload: JsonRecord } | { ok: false; error: ErrorResponse }> {
  let current = payload;
  const interactionId = readString(current, "id");
  if (!interactionId) {
    return { ok: true, payload: current };
  }

  for (let attempt = 0; attempt < 30 && interactionNeedsPolling(current); attempt += 1) {
    await sleep(750);
    const next = await getGeminiInteraction(apiKey, interactionId);
    if (!next.ok) {
      return next;
    }
    current = next.payload;
  }

  const status = readString(current, "status");
  if (status === "failed" || status === "cancelled") {
    return {
      ok: false,
      error: {
        ok: false,
        status: "error",
        detail: readErrorDetail(current) ?? `Gemini interaction ended with status "${status}".`,
      },
    };
  }

  return { ok: true, payload: current };
}

async function formatGroundedExplanation(
  apiKey: string,
  model: string,
  input: ExplainAyahRequest,
  groundedText: string,
): Promise<{ ok: true; payload: JsonRecord } | { ok: false; error: ErrorResponse }> {
  const response = await fetch(`${GEMINI_MODELS_URL}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildStructuredFormattingPrompt(input, groundedText),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 700,
        thinkingConfig: {
          thinkingBudget: 0,
        },
        responseMimeType: "application/json",
        responseJsonSchema: EXPLAIN_AYAH_RESPONSE_SCHEMA,
      },
    }),
  });
  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok || !payload) {
    return {
      ok: false,
      error: {
        ok: false,
        status: response.status === 401 || response.status === 403 ? "not_configured" : "error",
        detail: readErrorDetail(payload) ?? "Gemini could not format the grounded ayah explanation.",
      },
    };
  }

  try {
    return {
      ok: true,
      payload: parseJsonFromText(extractGenerateContentText(payload)),
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        ok: false,
        status: "error",
        detail: error instanceof Error ? error.message : "Gemini returned an invalid formatted explanation.",
      },
    };
  }
}

async function createGroqResponse(
  apiKey: string,
  body: JsonRecord,
): Promise<{ ok: true; payload: JsonRecord } | { ok: false; error: ErrorResponse }> {
  const response = await fetch(GROQ_RESPONSES_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "groq-beta": "inference-metrics",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as JsonRecord | null;
  if (!response.ok || !payload) {
    return {
      ok: false,
      error: {
        ok: false,
        status: response.status === 401 || response.status === 403 ? "not_configured" : "error",
        detail: readErrorDetail(payload) ?? "Groq could not generate a grounded ayah explanation.",
      },
    };
  }
  return { ok: true, payload };
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
  const initialInteraction = await createGeminiInteraction(apiKey, {
    model,
    store: false,
    system_instruction: buildGeminiSystemInstruction(),
    input: buildGroundedExplainAyahPrompt(input),
    generation_config: {
      temperature: 0,
      thinking_level: "low",
      thinking_summaries: "none",
      max_output_tokens: 750,
    },
    tools: [
      {
        type: "mcp_server",
        name: "quran",
        url: quranMcpUrl,
      },
    ],
  });
  if (!initialInteraction.ok) {
    return initialInteraction.error;
  }

  const completedInteraction = await waitForGeminiInteraction(apiKey, initialInteraction.payload);
  if (!completedInteraction.ok) {
    return completedInteraction.error;
  }

  let groundedText: string | null = null;
  try {
    groundedText = extractGeminiText(completedInteraction.payload);
  } catch {
    const previousInteractionId = readString(completedInteraction.payload, "id");
    if (!previousInteractionId) {
      return {
        ok: false,
        status: "error",
        detail: "Gemini returned tool activity, but no final grounded explanation text.",
      };
    }

    const followupInteraction = await createGeminiInteraction(apiKey, {
      model,
      store: false,
      previous_interaction_id: previousInteractionId,
      system_instruction: buildGeminiSystemInstruction(),
      input: buildGroundedExplainFollowupPrompt(input),
      generation_config: {
        temperature: 0,
        thinking_level: "low",
        thinking_summaries: "none",
        max_output_tokens: 750,
      },
    });
    if (!followupInteraction.ok) {
      return followupInteraction.error;
    }

    const completedFollowup = await waitForGeminiInteraction(apiKey, followupInteraction.payload);
    if (!completedFollowup.ok) {
      return completedFollowup.error;
    }

    try {
      groundedText = extractGeminiText(completedFollowup.payload);
    } catch (error) {
      return {
        ok: false,
        status: "error",
        detail:
          error instanceof Error
            ? error.message
            : "Gemini returned tool activity, but no final grounded explanation text.",
      };
    }
  }

  const parsedGrounded = parseGroundedExplainText(groundedText);
  if (scoreStructuredExplanation(parsedGrounded) >= 8) {
    return normalizeExplainAyahResponse(input.verseKey, "gemini", model, parsedGrounded);
  }

  const formatted = await formatGroundedExplanation(apiKey, model, input, groundedText);
  if (!formatted.ok) {
    if (hasStructuredExplanationContent(parsedGrounded)) {
      return normalizeExplainAyahResponse(input.verseKey, "gemini", model, parsedGrounded);
    }
    return formatted.error;
  }

  const bestPayload =
    scoreStructuredExplanation(formatted.payload) >= scoreStructuredExplanation(parsedGrounded)
      ? formatted.payload
      : parsedGrounded;

  return normalizeExplainAyahResponse(input.verseKey, "gemini", model, bestPayload);
}

async function explainAyahWithGroq(
  input: ExplainAyahRequest,
  env: Env,
): Promise<ExplainAyahResponse | ErrorResponse> {
  const apiKey = trimValue(env.GROQ_API_KEY);
  if (!apiKey) {
    return {
      ok: false,
      status: "not_configured",
      detail: "GROQ_API_KEY is missing from the AI gateway.",
    };
  }

  const model = trimValue(env.GROQ_MODEL) ?? DEFAULT_GROQ_MODEL;
  const quranMcpUrl = trimValue(env.QURAN_MCP_URL) ?? DEFAULT_QURAN_MCP_URL;
  let groundedContext: Awaited<ReturnType<typeof fetchGroundedAyahContext>>;
  try {
    groundedContext = await fetchGroundedAyahContext(input, quranMcpUrl);
  } catch (error) {
    return {
      ok: false,
      status: "error",
      detail: error instanceof Error ? error.message : "Quran MCP grounding failed.",
    };
  }

  const strictStructuredOutput = model === "openai/gpt-oss-20b" || model === "openai/gpt-oss-120b";
  const formatted = await createGroqResponse(apiKey, {
    model,
    instructions: "You are Hifzer's grounded Quran explanation assistant. Use only the provided Quran.ai MCP material.",
    input: buildGroqGroundedInput(input, groundedContext),
    temperature: 0,
    ...(strictStructuredOutput ? { reasoning: { effort: "low" } } : {}),
    text: {
      format: {
        type: "json_schema",
        name: "ayah_explanation",
        ...(strictStructuredOutput ? { strict: true } : {}),
        schema: EXPLAIN_AYAH_RESPONSE_SCHEMA,
      },
    },
  });
  if (!formatted.ok) {
    return formatted.error;
  }

  try {
    const formattedPayload = parseJsonFromText(extractGroqResponseText(formatted.payload));
    const mergedPayload: JsonRecord = {
      ...formattedPayload,
      sources: groundedContext.sources,
      groundingTools: groundedContext.groundingTools,
    };
    return normalizeExplainAyahResponse(input.verseKey, "groq", model, mergedPayload);
  } catch (error) {
    return {
      ok: false,
      status: "error",
      detail: error instanceof Error ? error.message : "Groq returned an invalid formatted explanation.",
    };
  }
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
          groqConfigured: Boolean(trimValue(env.GROQ_API_KEY)),
          groqModel: trimValue(env.GROQ_MODEL) ?? DEFAULT_GROQ_MODEL,
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
        if (provider === "groq") {
          const result = await explainAyahWithGroq(input, env);
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
