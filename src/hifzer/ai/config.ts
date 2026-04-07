import "server-only";

function trimEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const DEFAULT_AI_GATEWAY_TIMEOUT_MS = 60_000;
const MIN_AI_GATEWAY_TIMEOUT_MS = 5_000;
const MAX_AI_GATEWAY_TIMEOUT_MS = 120_000;

function readTimeoutMs(value: string | undefined): number {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) {
    return DEFAULT_AI_GATEWAY_TIMEOUT_MS;
  }
  return Math.min(MAX_AI_GATEWAY_TIMEOUT_MS, Math.max(MIN_AI_GATEWAY_TIMEOUT_MS, parsed));
}

export type HifzerAiGatewayConfig = {
  baseUrl: string | null;
  bearerToken: string | null;
  timeoutMs: number;
};

export function getHifzerAiGatewayConfig(): HifzerAiGatewayConfig {
  return {
    baseUrl: trimEnv(process.env.HIFZER_AI_GATEWAY_URL),
    bearerToken: trimEnv(process.env.HIFZER_AI_GATEWAY_TOKEN),
    timeoutMs: readTimeoutMs(process.env.HIFZER_AI_GATEWAY_TIMEOUT_MS),
  };
}

export function hasHifzerAiGatewayConfig(): boolean {
  return Boolean(getHifzerAiGatewayConfig().baseUrl);
}
