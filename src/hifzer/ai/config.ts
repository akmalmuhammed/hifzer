import "server-only";

function trimEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export type HifzerAiGatewayConfig = {
  baseUrl: string | null;
  bearerToken: string | null;
};

export function getHifzerAiGatewayConfig(): HifzerAiGatewayConfig {
  return {
    baseUrl: trimEnv(process.env.HIFZER_AI_GATEWAY_URL),
    bearerToken: trimEnv(process.env.HIFZER_AI_GATEWAY_TOKEN),
  };
}

export function hasHifzerAiGatewayConfig(): boolean {
  return Boolean(getHifzerAiGatewayConfig().baseUrl);
}
