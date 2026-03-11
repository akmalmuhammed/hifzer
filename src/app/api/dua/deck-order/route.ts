import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  isDuaDeckError,
  resetBuiltInDeckOrder,
  saveDeckOrder,
} from "@/hifzer/ramadan/custom-dua.server";

type DeckOrderPayload = {
  moduleId?: unknown;
  itemKey?: unknown;
  sortOrder?: unknown;
  reset?: unknown;
};

function asOptionalString(input: unknown): string | undefined {
  return typeof input === "string" ? input : undefined;
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

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: DeckOrderPayload;
  try {
    payload = (await req.json()) as DeckOrderPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const itemKey = asOptionalString(payload.itemKey);
  const moduleId = asOptionalString(payload.moduleId);
  if (!itemKey) {
    return NextResponse.json({ error: "itemKey is required." }, { status: 400 });
  }
  if (!moduleId) {
    return NextResponse.json({ error: "moduleId is required." }, { status: 400 });
  }

  try {
    const order = payload.reset === true
      ? await resetBuiltInDeckOrder(userId, moduleId, itemKey)
      : await saveDeckOrder(userId, {
          moduleId,
          itemKey,
          sortOrder: asOptionalNumber(payload.sortOrder),
        });
    return NextResponse.json({ ok: true, deckOrder: order });
  } catch (error) {
    return handleError(error);
  }
}
