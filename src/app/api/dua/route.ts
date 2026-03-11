import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  createCustomDua,
  isDuaDeckError,
  listDuaDeckState,
} from "@/hifzer/ramadan/custom-dua.server";

type CreatePayload = {
  moduleId?: unknown;
  title?: unknown;
  arabic?: unknown;
  transliteration?: unknown;
  translation?: unknown;
  note?: unknown;
  sortOrder?: unknown;
};

function asOptionalString(input: unknown): string | null | undefined {
  if (input === undefined) {
    return undefined;
  }
  return typeof input === "string" ? input : null;
}

function asOptionalNumber(input: unknown): number | null | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (input === null) {
    return null;
  }
  const value = Number(input);
  return Number.isFinite(value) ? Math.floor(value) : null;
}

function handleError(error: unknown) {
  if (isDuaDeckError(error)) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const state = await listDuaDeckState(userId);
    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreatePayload;
  try {
    payload = (await req.json()) as CreatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const result = await createCustomDua(userId, {
      moduleId: asOptionalString(payload.moduleId),
      title: asOptionalString(payload.title),
      arabic: asOptionalString(payload.arabic),
      transliteration: asOptionalString(payload.transliteration),
      translation: asOptionalString(payload.translation),
      note: asOptionalString(payload.note),
      sortOrder: asOptionalNumber(payload.sortOrder),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleError(error);
  }
}
