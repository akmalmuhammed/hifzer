import "server-only";

import { Environment, Paddle } from "@paddle/paddle-node-sdk";

declare global {
  var __hifzer_paddle_client: Paddle | undefined;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function resolveEnvironment(): Environment {
  const value = process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase();
  // SECURITY: In production, Paddle must be explicitly set to production mode.
  // A missing or mistyped env var would silently route real users through sandbox
  // (no actual charges), creating fraudulent-subscription risk.
  if (process.env.NODE_ENV === "production" && value !== "production") {
    throw new Error(
      "PADDLE_ENVIRONMENT must be set to 'production' in production builds. " +
      `Got: ${JSON.stringify(value ?? "")}`
    );
  }
  return value === "production" ? Environment.production : Environment.sandbox;
}

export function paddleConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY?.trim());
}

export function paddleClient(): Paddle {
  if (globalThis.__hifzer_paddle_client) {
    return globalThis.__hifzer_paddle_client;
  }

  const client = new Paddle(readRequiredEnv("PADDLE_API_KEY"), {
    environment: resolveEnvironment(),
  });
  globalThis.__hifzer_paddle_client = client;
  return client;
}

export function paddleWebhookSecret(): string {
  return readRequiredEnv("PADDLE_WEBHOOK_SECRET");
}

export function paddlePaidPriceId(): string {
  return readRequiredEnv("PADDLE_PRICE_ID_PAID");
}

export function appPublicUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000"
  );
}

