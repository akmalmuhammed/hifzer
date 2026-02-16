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

export function db(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (globalThis.__hifzer_prisma) {
    return globalThis.__hifzer_prisma;
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__hifzer_prisma = client;
  }

  return client;
}
