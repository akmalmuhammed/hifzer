import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// PrismaNeon uses WebSockets under the hood. In Node runtimes, we provide `ws`.
neonConfig.webSocketConstructor = ws;

declare global {
  var __hifzer_prisma: PrismaClient | undefined;
}

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function resolvedSchema(databaseUrl: string): string | undefined {
  const override = process.env.HIFZER_DB_SCHEMA?.trim();
  if (override) {
    return override;
  }
  try {
    const value = new URL(databaseUrl).searchParams.get("schema")?.trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

export function db(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (globalThis.__hifzer_prisma) {
    return globalThis.__hifzer_prisma;
  }

  const schema = resolvedSchema(process.env.DATABASE_URL);
  const adapter = new PrismaNeon(
    { connectionString: process.env.DATABASE_URL },
    schema ? { schema } : undefined,
  );
  const client = new PrismaClient({ adapter });

  globalThis.__hifzer_prisma = client;

  return client;
}
