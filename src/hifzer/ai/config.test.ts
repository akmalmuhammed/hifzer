import { afterEach, describe, expect, it } from "vitest";
import { getHifzerAiGatewayConfig } from "./config";

const ORIGINAL_ENV = {
  HIFZER_AI_GATEWAY_URL: process.env.HIFZER_AI_GATEWAY_URL,
  HIFZER_AI_GATEWAY_TOKEN: process.env.HIFZER_AI_GATEWAY_TOKEN,
  HIFZER_AI_GATEWAY_TIMEOUT_MS: process.env.HIFZER_AI_GATEWAY_TIMEOUT_MS,
};

afterEach(() => {
  process.env.HIFZER_AI_GATEWAY_URL = ORIGINAL_ENV.HIFZER_AI_GATEWAY_URL;
  process.env.HIFZER_AI_GATEWAY_TOKEN = ORIGINAL_ENV.HIFZER_AI_GATEWAY_TOKEN;
  process.env.HIFZER_AI_GATEWAY_TIMEOUT_MS = ORIGINAL_ENV.HIFZER_AI_GATEWAY_TIMEOUT_MS;
});

describe("ai/config", () => {
  it("returns the default timeout when no override is set", () => {
    delete process.env.HIFZER_AI_GATEWAY_TIMEOUT_MS;

    expect(getHifzerAiGatewayConfig().timeoutMs).toBe(60_000);
  });

  it("clamps timeout overrides into a safe range", () => {
    process.env.HIFZER_AI_GATEWAY_TIMEOUT_MS = "999999";
    expect(getHifzerAiGatewayConfig().timeoutMs).toBe(120_000);

    process.env.HIFZER_AI_GATEWAY_TIMEOUT_MS = "1000";
    expect(getHifzerAiGatewayConfig().timeoutMs).toBe(5_000);
  });
});
