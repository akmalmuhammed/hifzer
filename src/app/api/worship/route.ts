import { NextResponse } from "next/server";
import { getWorshipSnapshot, isWorshipStorageError } from "@/hifzer/worship/server";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function privateJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: PRIVATE_NO_STORE_HEADERS });
}

export async function GET(request: Request) {
  const userId = await resolveClerkUserIdForServer(request);
  if (!userId) {
    return privateJson({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return privateJson({ ok: true, snapshot: await getWorshipSnapshot(userId) });
  } catch (error) {
    if (isWorshipStorageError(error)) {
      return privateJson({ error: error.message, code: error.code }, { status: error.status });
    }
    return privateJson({ error: "Private worship data is temporarily unavailable." }, { status: 500 });
  }
}
