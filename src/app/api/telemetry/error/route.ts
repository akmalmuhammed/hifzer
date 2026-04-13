import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

type Payload = {
  errorId?: unknown;
  digest?: unknown;
  message?: unknown;
  stack?: unknown;
  source?: unknown;
  path?: unknown;
};

export async function POST(req: Request) {
  let payload: Payload = {};
  try {
    payload = (await req.json()) as Payload;
  } catch {
    payload = {};
  }

  const errorId = typeof payload.errorId === "string" ? payload.errorId : null;
  const digest = typeof payload.digest === "string" ? payload.digest : null;
  const message = typeof payload.message === "string" ? payload.message : "Unknown client error";
  const stack = typeof payload.stack === "string" ? payload.stack : null;
  const source = typeof payload.source === "string" ? payload.source : "client-error";
  const path = typeof payload.path === "string" ? payload.path : null;

  const error = new Error(message);
  if (stack) {
    error.stack = stack;
  }

  Sentry.captureException(error, {
    tags: {
      area: "client-error-report",
      source,
      errorId: errorId ?? "missing",
    },
    extra: {
      digest,
      path,
    },
  });

  return NextResponse.json({ ok: true });
}
