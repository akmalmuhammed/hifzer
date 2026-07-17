import { NextResponse } from "next/server";
import { isWorshipStorageError, saveFastingCheckIn } from "@/hifzer/worship/server";
import {
  normalizeExpectedVersion,
  normalizeFastingKind,
  normalizeFastingStatus,
} from "@/hifzer/worship/validators";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { isJsonMutation, isTrustedSameOriginMutation, PRIVATE_NO_STORE_HEADERS } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = { status?: unknown; kind?: unknown; expectedVersion?: unknown };

function privateJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: PRIVATE_NO_STORE_HEADERS });
}

export async function PUT(request: Request) {
  if (!isTrustedSameOriginMutation(request)) {
    return privateJson({ error: "Cross-site updates are not allowed." }, { status: 403 });
  }
  if (!isJsonMutation(request)) {
    return privateJson({ error: "Expected an application/json request." }, { status: 415 });
  }

  const userId = await resolveClerkUserIdForServer(request);
  if (!userId) {
    return privateJson({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return privateJson({ error: "Invalid JSON body." }, { status: 400 });
  }

  const status = payload.status === null ? null : normalizeFastingStatus(payload.status);
  const kind = payload.kind === null || payload.kind === undefined ? null : normalizeFastingKind(payload.kind);
  const expectedVersion = payload.expectedVersion === undefined
    ? undefined
    : normalizeExpectedVersion(payload.expectedVersion);
  if (
    (payload.status !== null && !status) ||
    (payload.kind !== null && payload.kind !== undefined && !kind) ||
    (payload.expectedVersion !== undefined && expectedVersion === null)
  ) {
    return privateJson({ error: "Invalid fasting check-in." }, { status: 400 });
  }

  try {
    const snapshot = await saveFastingCheckIn({
      clerkUserId: userId,
      status,
      kind,
      expectedVersion,
    });
    return privateJson({ ok: true, snapshot });
  } catch (error) {
    if (isWorshipStorageError(error)) {
      return privateJson({ error: error.message, code: error.code }, { status: error.status });
    }
    return privateJson({ error: "Fasting check-in could not be saved." }, { status: 500 });
  }
}
