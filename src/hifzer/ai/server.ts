import "server-only";

import type { AyahExplanationGatewayRequest, AyahExplanationGatewayResponse } from "./contracts";
import { getHifzerAiGatewayConfig } from "./config";

function buildGatewayUrl(baseUrl: string): string {
  return new URL("/v1/quran/explain-ayah", baseUrl).toString();
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
  const config = getHifzerAiGatewayConfig();
  if (!config.baseUrl) {
    return {
      ok: false,
      status: "not_configured",
      detail: "AI explanation is not configured on this deployment yet.",
    };
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), config.timeoutMs);

  try {
    const response = await fetch(buildGatewayUrl(config.baseUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(config.bearerToken ? { authorization: `Bearer ${config.bearerToken}` } : {}),
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: abortController.signal,
    });

    const payload = (await response.json().catch(() => null)) as AyahExplanationGatewayResponse | null;
    if (!response.ok) {
      const failure = payload && !payload.ok ? payload : null;
      return {
        ok: false,
        status: failure?.status ?? (response.status === 503 ? "not_configured" : "error"),
        detail: parseGatewayError(failure, "AI explanation is unavailable right now."),
      };
    }

    if (!payload?.ok) {
      return {
        ok: false,
        status: payload?.status ?? "error",
        detail: payload?.detail ?? "AI explanation is unavailable right now.",
      };
    }

    return payload;
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: timedOut ? "timeout" : "error",
      detail: timedOut
        ? "AI explanation is taking longer than expected. Please try again."
        : "AI explanation is unavailable right now.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
