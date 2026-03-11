import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  deleteCustomDua,
  isDuaDeckError,
  updateCustomDua,
} from "@/hifzer/ramadan/custom-dua.server";

type UpdatePayload = {
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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: UpdatePayload;
  try {
    payload = (await req.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const result = await updateCustomDua(userId, id, {
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

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await deleteCustomDua(userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
