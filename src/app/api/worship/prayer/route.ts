import { NextResponse } from "next/server";
import { isWorshipStorageError, savePrayerCheckIn } from "@/hifzer/worship/server";
import {
  normalizeExpectedVersion,
  normalizePrayerName,
  normalizePrayerStatus,
} from "@/hifzer/worship/validators";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { isJsonMutation, isTrustedSameOriginMutation, PRIVATE_NO_STORE_HEADERS } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = { prayer?: unknown; status?: unknown; expectedVersion?: unknown };

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

  const prayer = normalizePrayerName(payload.prayer);
  const status = payload.status === null ? null : normalizePrayerStatus(payload.status);
  const expectedVersion = payload.expectedVersion === undefined
    ? undefined
    : normalizeExpectedVersion(payload.expectedVersion);
  if (!prayer || (payload.status !== null && !status) || (payload.expectedVersion !== undefined && expectedVersion === null)) {
    return privateJson({ error: "Invalid prayer check-in." }, { status: 400 });
  }

  try {
    const snapshot = await savePrayerCheckIn({
      clerkUserId: userId,
      prayer,
      status,
      expectedVersion,
    });
    return privateJson({ ok: true, snapshot });
  } catch (error) {
    if (isWorshipStorageError(error)) {
      return privateJson({ error: error.message, code: error.code }, { status: error.status });
    }
    return privateJson({ error: "Prayer check-in could not be saved." }, { status: 500 });
  }
}
