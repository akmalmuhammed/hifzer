export const PRODUCT_TELEMETRY_SCHEMA_VERSION = 1;

export type ProductTelemetryValue = string | number | boolean | null;

const ALLOWED_KEYS = new Set([
  "action_kind",
  "count_bucket",
  "destination",
  "device_class",
  "duration_bucket",
  "error_code",
  "mode",
  "online",
  "outcome",
  "placement",
  "reason_code",
  "route",
  "schema_version",
  "section",
]);

const SENSITIVE_KEY = /(answer|arabic|body|content|draft|email|entry|journal|message|name|note|phone|query|stack|text|token|transcript|user.?id)/i;
const EMAIL_VALUE = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/;
const TOKEN_VALUE = /(?:bearer\s+|eyJ[a-zA-Z0-9_-]{8,}|sk_[a-zA-Z0-9_-]{8,})/i;

function safePath(value: string): string | null {
  if (value.startsWith("#")) return value.slice(0, 64);
  try {
    const parsed = new URL(value, "https://hifzer.local");
    return parsed.origin === "https://hifzer.local" ? parsed.pathname.slice(0, 120) : "external";
  } catch {
    return null;
  }
}

function safeValue(key: string, value: unknown): ProductTelemetryValue | undefined {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value !== "string") return undefined;
  const candidate = value.trim();
  if (!candidate || EMAIL_VALUE.test(candidate) || TOKEN_VALUE.test(candidate)) return undefined;
  if (key === "route" || key === "destination") return safePath(candidate) ?? undefined;
  return candidate.slice(0, 80);
}

export function sanitizeProductEvent(
  eventName: string,
  payload: Record<string, unknown> = {},
): { eventName: string; params: Record<string, ProductTelemetryValue> } | null {
  const safeEventName = eventName.trim().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64);
  if (!safeEventName) return null;
  const params: Record<string, ProductTelemetryValue> = {
    schema_version: PRODUCT_TELEMETRY_SCHEMA_VERSION,
  };
  for (const [key, value] of Object.entries(payload)) {
    const normalizedKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (!ALLOWED_KEYS.has(normalizedKey) || SENSITIVE_KEY.test(normalizedKey)) continue;
    const normalizedValue = safeValue(normalizedKey, value);
    if (normalizedValue !== undefined) params[normalizedKey] = normalizedValue;
  }
  return { eventName: safeEventName, params };
}
