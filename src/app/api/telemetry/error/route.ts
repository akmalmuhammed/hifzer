import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

type Payload = {
  errorId?: unknown;
  digest?: unknown;
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
  const source = typeof payload.source === "string" && /^[a-z-]{1,40}$/.test(payload.source)
    ? payload.source
    : "client-error";
  const path = typeof payload.path === "string" ? payload.path.split(/[?#]/, 1)[0].slice(0, 120) : null;

  const error = new Error("Client boundary reported an application error.");

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
