import { NextResponse } from "next/server";
import {
  JournalStorageError,
  isJournalStorageError,
  listPrivateJournalEntries,
  savePrivateJournalEntry,
} from "@/hifzer/journal/server";
import type { JournalBlock, JournalLinkedAyah, JournalLinkedDua } from "@/hifzer/journal/local-store";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";

type SavePayload = {
  id?: unknown;
  ownerId?: unknown;
  expectedVersion?: unknown;
  clientMutationId?: unknown;
  mutationType?: unknown;
  type?: unknown;
  title?: unknown;
  content?: unknown;
  blocks?: unknown;
  tags?: unknown;
  pinned?: unknown;
  createdAt?: unknown;
  linkedAyah?: unknown;
  linkedDua?: unknown;
  duaStatus?: unknown;
  autoDeleteAt?: unknown;
};

function asOptionalString(input: unknown): string | null {
  return typeof input === "string" ? input : null;
}

function asOptionalStringPreservingOmission(input: unknown): string | null | undefined {
  if (input === undefined || typeof input === "string") {
    return input;
  }
  return input === null ? null : undefined;
}

function asOptionalBoolean(input: unknown): boolean | undefined {
  if (typeof input === "boolean") {
    return input;
  }
  if (typeof input === "string") {
    if (input === "1" || input === "true") {
      return true;
    }
    if (input === "0" || input === "false") {
      return false;
    }
  }
  return undefined;
}

function asOptionalInteger(input: unknown): number | undefined {
  if (input == null || input === "") {
    return undefined;
  }
  const value = Number(input);
  return Number.isSafeInteger(value) ? value : Number.NaN;
}

function asStringArray(input: unknown): string[] | null {
  if (!Array.isArray(input)) {
    return null;
  }
  return input.filter((item): item is string => typeof item === "string");
}

function asBlocksPreservingOmission(input: unknown): JournalBlock[] | null | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (!Array.isArray(input)) {
    return null;
  }
  return input as JournalBlock[];
}

function asLinkedAyahPreservingOmission(input: unknown): JournalLinkedAyah | null | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (!input || typeof input !== "object") {
    return null;
  }
  return input as JournalLinkedAyah;
}

function asLinkedDuaPreservingOmission(input: unknown): JournalLinkedDua | null | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (!input || typeof input !== "object") {
    return null;
  }
  return input as JournalLinkedDua;
}

function handleError(error: unknown) {
  if (isJournalStorageError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.authoritativeEntry !== undefined
          ? { authoritativeEntry: error.authoritativeEntry }
          : {}),
      },
      { status: error.status },
    );
  }
  if (error instanceof JournalStorageError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.authoritativeEntry !== undefined
          ? { authoritativeEntry: error.authoritativeEntry }
          : {}),
      },
      { status: error.status },
    );
  }
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

export async function GET(request: Request) {
  const userId = await resolveClerkUserIdForServer(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const view = new URL(request.url).searchParams.get("view");
    const entries = await listPrivateJournalEntries(userId, new Date(), { summary: view === "summary" });
    return NextResponse.json({ ok: true, entries });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  const userId = await resolveClerkUserIdForServer(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SavePayload;
  try {
    payload = (await req.json()) as SavePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const entry = await savePrivateJournalEntry(userId, {
      id: asOptionalString(payload.id),
      ownerId: asOptionalString(payload.ownerId),
      expectedVersion: asOptionalInteger(payload.expectedVersion),
      clientMutationId: asOptionalString(payload.clientMutationId),
      mutationType: asOptionalString(payload.mutationType),
      type: asOptionalString(payload.type),
      title: asOptionalStringPreservingOmission(payload.title),
      content: asOptionalStringPreservingOmission(payload.content),
      blocks: asBlocksPreservingOmission(payload.blocks),
      tags: asStringArray(payload.tags),
      pinned: asOptionalBoolean(payload.pinned),
      createdAt: asOptionalString(payload.createdAt),
      linkedAyah: asLinkedAyahPreservingOmission(payload.linkedAyah),
      linkedDua: asLinkedDuaPreservingOmission(payload.linkedDua),
      duaStatus: asOptionalStringPreservingOmission(payload.duaStatus),
      autoDeleteAt: asOptionalStringPreservingOmission(payload.autoDeleteAt),
    });
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    return handleError(error);
  }
}
