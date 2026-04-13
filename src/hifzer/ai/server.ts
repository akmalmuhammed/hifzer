import "server-only";

import type {
  AyahExplanationGatewayRequest,
  AyahExplanationGatewayResponse,
  QuranAssistantGatewayRequest,
  QuranAssistantAskGatewayResponse,
  QuranAssistantGatewayResponse,
} from "./contracts";
import { getHifzerAiGatewayConfig } from "./config";

function buildGatewayUrl(baseUrl: string, pathname: string): string {
  return new URL(pathname, baseUrl).toString();
}

function parseGatewayError(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null && "detail" in payload && typeof payload.detail === "string") {
    return payload.detail;
  }
  return fallback;
}

export async function requestAyahExplanation(
  input: AyahExplanationGatewayRequest,
): Promise<AyahExplanationGatewayResponse> {
  return requestGateway("/v1/quran/explain-ayah", input, {
    notConfigured: "AI explanation is not configured on this deployment yet.",
    unavailable: "AI explanation is unavailable right now.",
    timeout: "AI explanation is taking longer than expected. Please try again.",
  });
}

export async function requestQuranAssistantAnswer(
  input: QuranAssistantGatewayRequest,
): Promise<QuranAssistantAskGatewayResponse> {
  return requestGateway("/v1/quran/ask", input, {
    notConfigured: "Quran AI assistant is not configured on this deployment yet.",
    unavailable: "Quran AI assistant is unavailable right now.",
    timeout: "Quran AI assistant is taking longer than expected. Please try again.",
  });
}

export async function requestQuranAssistant(
  input: QuranAssistantGatewayRequest,
): Promise<QuranAssistantGatewayResponse> {
  return requestGateway("/v1/quran/assistant", input, {
    notConfigured: "Quran AI assistant is not configured on this deployment yet.",
    unavailable: "Quran AI assistant is unavailable right now.",
    timeout: "Quran AI assistant is taking longer than expected. Please try again.",
  });
}

async function requestGateway<TRequest, TResponse extends { ok: boolean; status?: "not_configured" | "timeout" | "error"; detail?: string }>(
  pathname: string,
  input: TRequest,
  messages: {
    notConfigured: string;
    unavailable: string;
    timeout: string;
  },
): Promise<TResponse> {
  const config = getHifzerAiGatewayConfig();
  if (!config.baseUrl) {
    return {
      ok: false,
      status: "not_configured",
      detail: messages.notConfigured,
    } as TResponse;
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), config.timeoutMs);

  try {
    const response = await fetch(buildGatewayUrl(config.baseUrl, pathname), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(config.bearerToken ? { authorization: `Bearer ${config.bearerToken}` } : {}),
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: abortController.signal,
    });

    const payload = (await response.json().catch(() => null)) as TResponse | null;
    if (!response.ok) {
      const failure = payload && !payload.ok ? payload : null;
      return {
        ok: false,
        status: failure?.status ?? (response.status === 503 ? "not_configured" : "error"),
        detail: parseGatewayError(failure, messages.unavailable),
      } as TResponse;
    }

    if (!payload?.ok) {
      return {
        ok: false,
        status: payload?.status ?? "error",
        detail: payload?.detail ?? messages.unavailable,
      } as TResponse;
    }

    return payload;
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: timedOut ? "timeout" : "error",
      detail: timedOut ? messages.timeout : messages.unavailable,
    } as TResponse;
  } finally {
    clearTimeout(timeout);
  }
}
