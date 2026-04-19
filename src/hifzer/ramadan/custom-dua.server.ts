import "server-only";

import {
  DEFAULT_DUA_MODULE_ID,
  defaultDuaDeckOrders,
  type CustomDuaSnapshot,
  type DuaDeckOrderSnapshot,
  type DuaModuleId,
} from "@/hifzer/ramadan/laylat-al-qadr";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { ensureCoreSchemaCompatibility, getCoreSchemaCapabilities } from "@/lib/db-compat";
import { db, dbConfigured } from "@/lib/db";

const TITLE_MAX_LENGTH = 120;
const BODY_MAX_LENGTH = 4000;
const NOTE_MAX_LENGTH = 600;
const SORT_ORDER_MIN = 1;
const SORT_ORDER_MAX = 9999;
const DUA_MODULE_IDS = [
  "laylat-al-qadr",
  "repentance",
  "anxiety-distress",
  "istikhara-decisions",
  "healing-shifa",
  "grief-loss",
  "family-home",
  "wealth",
  "ruqyah",
  "beautiful-names",
] satisfies readonly DuaModuleId[];

export class DuaDeckError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "DuaDeckError";
    this.status = status;
    this.code = code;
  }
}

export function isDuaDeckError(error: unknown): error is DuaDeckError {
  return error instanceof DuaDeckError;
}

type MutableCustomDuaInput = {
  moduleId?: DuaModuleId | string | null;
  title?: string | null;
  arabic?: string | null;
  transliteration?: string | null;
  translation?: string | null;
  note?: string | null;
  sortOrder?: number | null;
};

function runtimeSchemaPatchEnabled(): boolean {
  return process.env.HIFZER_RUNTIME_SCHEMA_PATCH !== "0";
}

function clampSortOrder(value: number | null | undefined, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(SORT_ORDER_MIN, Math.min(SORT_ORDER_MAX, Math.floor(value ?? fallback)));
}

function sanitizeOptionalText(input: string | null | undefined, maxLength: number): string | null {
  if (typeof input !== "string") {
    return null;
  }
  const trimmed = input.trim().replace(/\r\n/g, "\n");
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, maxLength);
}

function sanitizeRequiredText(input: string | null | undefined, maxLength: number, fieldLabel: string): string {
  const value = sanitizeOptionalText(input, maxLength);
  if (!value) {
    throw new DuaDeckError(`${fieldLabel} is required.`, 400, "VALIDATION_ERROR");
  }
  return value;
}

function normalizeModuleId(input: string | null | undefined): DuaModuleId {
  if (!input) {
    return DEFAULT_DUA_MODULE_ID;
  }
  if ((DUA_MODULE_IDS as readonly string[]).includes(input)) {
    return input as DuaModuleId;
  }
  throw new DuaDeckError("Invalid dua module.", 400, "VALIDATION_ERROR");
}

function toCustomDuaSnapshot(row: {
  id: string;
  moduleId: string;
  title: string;
  arabic: string | null;
  transliteration: string | null;
  translation: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CustomDuaSnapshot {
  return {
    id: row.id,
    moduleId: normalizeModuleId(row.moduleId),
    title: row.title,
    arabic: row.arabic,
    transliteration: row.transliteration,
    translation: row.translation,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDeckOrderSnapshot(row: {
  moduleId: string;
  itemKey: string;
  sortOrder: number;
}): DuaDeckOrderSnapshot {
  return {
    moduleId: normalizeModuleId(row.moduleId),
    itemKey: row.itemKey,
    sortOrder: row.sortOrder,
  };
}

function builtInDeckOrderMap(moduleId: DuaModuleId) {
  return new Map(defaultDuaDeckOrders(moduleId).map((entry) => [entry.itemKey, entry.sortOrder]));
}

function looksLikeMissingDuaDeckSchema(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("CustomDua") ||
    message.includes("DuaDeckOrder") ||
    message.includes("P2021") ||
    message.includes("P2022") ||
    /relation .* does not exist/i.test(message) ||
    /column .* does not exist/i.test(message)
  );
}

async function ensureDuaDeckSchemaReady(input?: { requireTables?: boolean }): Promise<boolean> {
  if (!dbConfigured()) {
    return false;
  }
  if (runtimeSchemaPatchEnabled()) {
    try {
      await ensureCoreSchemaCompatibility();
    } catch {
      // Continue and probe capabilities below.
    }
  }

  const capabilities = await getCoreSchemaCapabilities({ refresh: true });
  if (capabilities.hasCustomDuaTables) {
    return true;
  }
  if (input?.requireTables) {
    throw new DuaDeckError("Dua deck storage is not ready yet.", 503, "SCHEMA_NOT_READY");
  }
  return false;
}

async function requireProfile(clerkUserId: string) {
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    throw new DuaDeckError("Profile is unavailable.", 503, "PROFILE_UNAVAILABLE");
  }
  return profile;
}

async function nextDeckSortOrder(userId: string, moduleId: DuaModuleId): Promise<number> {
  const defaults = defaultDuaDeckOrders(moduleId);
  const builtInMax = defaults.reduce((max, entry) => Math.max(max, entry.sortOrder), 0);
  const existing = await db().duaDeckOrder.findMany({
    where: { userId, moduleId },
    select: { sortOrder: true },
    orderBy: { sortOrder: "desc" },
    take: 1,
  });
  const latest = existing[0]?.sortOrder ?? builtInMax;
  return clampSortOrder(latest + 10, builtInMax + 10);
}

async function validateDeckItemOwnership(userId: string, moduleId: DuaModuleId, itemKey: string) {
  if (itemKey.startsWith("builtin:")) {
    const builtIn = builtInDeckOrderMap(moduleId);
    if (!builtIn.has(itemKey)) {
      throw new DuaDeckError("Unknown built-in dua deck item.", 404, "ITEM_NOT_FOUND");
    }
    return;
  }

  if (!itemKey.startsWith("custom:")) {
    throw new DuaDeckError("Invalid deck item key.", 400, "VALIDATION_ERROR");
  }

  const customDuaId = itemKey.slice("custom:".length);
  if (!customDuaId) {
    throw new DuaDeckError("Invalid custom dua key.", 400, "VALIDATION_ERROR");
  }

  const customDua = await db().customDua.findFirst({
    where: {
      id: customDuaId,
      userId,
      moduleId,
    },
    select: { id: true },
  });

  if (!customDua) {
    throw new DuaDeckError("Custom dua not found.", 404, "CUSTOM_DUA_NOT_FOUND");
  }
}

export async function listDuaDeckState(clerkUserId: string): Promise<{
  customDuas: CustomDuaSnapshot[];
  deckOrders: DuaDeckOrderSnapshot[];
}> {
  if (!dbConfigured()) {
    return {
      customDuas: [],
      deckOrders: [],
    };
  }

  const schemaReady = await ensureDuaDeckSchemaReady();
  if (!schemaReady) {
    return {
      customDuas: [],
      deckOrders: [],
    };
  }

  const profile = await requireProfile(clerkUserId);

  try {
    const [customDuas, deckOrders] = await db().$transaction([
      db().customDua.findMany({
        where: { userId: profile.id },
        orderBy: [{ moduleId: "asc" }, { createdAt: "asc" }, { updatedAt: "asc" }],
      }),
      db().duaDeckOrder.findMany({
        where: { userId: profile.id },
        orderBy: [{ moduleId: "asc" }, { sortOrder: "asc" }, { updatedAt: "asc" }],
        select: {
          moduleId: true,
          itemKey: true,
          sortOrder: true,
        },
      }),
    ]);

    return {
      customDuas: customDuas.map(toCustomDuaSnapshot),
      deckOrders: deckOrders.map(toDeckOrderSnapshot),
    };
  } catch (error) {
    if (looksLikeMissingDuaDeckSchema(error)) {
      return {
        customDuas: [],
        deckOrders: [],
      };
    }
    throw error;
  }
}

export async function createCustomDua(clerkUserId: string, input: MutableCustomDuaInput): Promise<{
  customDua: CustomDuaSnapshot;
  deckOrder: DuaDeckOrderSnapshot;
}> {
  await ensureDuaDeckSchemaReady({ requireTables: true });
  const profile = await requireProfile(clerkUserId);
  const moduleId = normalizeModuleId(input.moduleId);
  const title = sanitizeRequiredText(input.title, TITLE_MAX_LENGTH, "Title");
  const translation = sanitizeRequiredText(input.translation, BODY_MAX_LENGTH, "Dua text");
  const arabic = sanitizeOptionalText(input.arabic, BODY_MAX_LENGTH);
  const transliteration = sanitizeOptionalText(input.transliteration, BODY_MAX_LENGTH);
  const note = sanitizeOptionalText(input.note, NOTE_MAX_LENGTH);
  const sortOrder = clampSortOrder(input.sortOrder, await nextDeckSortOrder(profile.id, moduleId));

  const [customDua, deckOrder] = await db().$transaction(async (tx) => {
    const created = await tx.customDua.create({
      data: {
        userId: profile.id,
        moduleId,
        title,
        arabic,
        transliteration,
        translation,
        note,
      },
    });

    const order = await tx.duaDeckOrder.upsert({
      where: {
        userId_moduleId_itemKey: {
          userId: profile.id,
          moduleId,
          itemKey: `custom:${created.id}`,
        },
      },
      create: {
        userId: profile.id,
        moduleId,
        itemKey: `custom:${created.id}`,
        sortOrder,
      },
      update: {
        sortOrder,
      },
      select: {
        moduleId: true,
        itemKey: true,
        sortOrder: true,
      },
    });

    return [created, order] as const;
  });

  return {
    customDua: toCustomDuaSnapshot(customDua),
    deckOrder: toDeckOrderSnapshot(deckOrder),
  };
}

export async function updateCustomDua(clerkUserId: string, customDuaId: string, input: MutableCustomDuaInput): Promise<{
  customDua: CustomDuaSnapshot;
  deckOrder: DuaDeckOrderSnapshot;
}> {
  await ensureDuaDeckSchemaReady({ requireTables: true });
  const profile = await requireProfile(clerkUserId);
  const existing = await db().customDua.findFirst({
    where: {
      id: customDuaId,
      userId: profile.id,
    },
  });

  if (!existing) {
    throw new DuaDeckError("Custom dua not found.", 404, "CUSTOM_DUA_NOT_FOUND");
  }

  const moduleId = input.moduleId === undefined
    ? normalizeModuleId(existing.moduleId)
    : normalizeModuleId(input.moduleId);
  const title = input.title === undefined ? existing.title : sanitizeRequiredText(input.title, TITLE_MAX_LENGTH, "Title");
  const translation = input.translation === undefined
    ? existing.translation
    : sanitizeRequiredText(input.translation, BODY_MAX_LENGTH, "Dua text");
  const arabic = input.arabic === undefined ? existing.arabic : sanitizeOptionalText(input.arabic, BODY_MAX_LENGTH);
  const transliteration = input.transliteration === undefined
    ? existing.transliteration
    : sanitizeOptionalText(input.transliteration, BODY_MAX_LENGTH);
  const note = input.note === undefined ? existing.note : sanitizeOptionalText(input.note, NOTE_MAX_LENGTH);

  const oldModuleId = normalizeModuleId(existing.moduleId);
  const deckItemKey = `custom:${existing.id}`;
  const existingOrder = await db().duaDeckOrder.findUnique({
    where: {
      userId_moduleId_itemKey: {
        userId: profile.id,
        moduleId: oldModuleId,
        itemKey: deckItemKey,
      },
    },
    select: {
      sortOrder: true,
    },
  });
  const fallbackOrder = existingOrder?.sortOrder ?? await nextDeckSortOrder(profile.id, moduleId);
  const sortOrder = input.sortOrder === undefined
    ? fallbackOrder
    : clampSortOrder(input.sortOrder, fallbackOrder);

  const [customDua, deckOrder] = await db().$transaction(async (tx) => {
    const updated = await tx.customDua.update({
      where: { id: existing.id },
      data: {
        moduleId,
        title,
        arabic,
        transliteration,
        translation,
        note,
      },
    });

    if (oldModuleId !== moduleId) {
      await tx.duaDeckOrder.deleteMany({
        where: {
          userId: profile.id,
          moduleId: oldModuleId,
          itemKey: deckItemKey,
        },
      });
    }

    const order = await tx.duaDeckOrder.upsert({
      where: {
        userId_moduleId_itemKey: {
          userId: profile.id,
          moduleId,
          itemKey: deckItemKey,
        },
      },
      create: {
        userId: profile.id,
        moduleId,
        itemKey: deckItemKey,
        sortOrder,
      },
      update: {
        sortOrder,
      },
      select: {
        moduleId: true,
        itemKey: true,
        sortOrder: true,
      },
    });

    return [updated, order] as const;
  });

  return {
    customDua: toCustomDuaSnapshot(customDua),
    deckOrder: toDeckOrderSnapshot(deckOrder),
  };
}

export async function deleteCustomDua(clerkUserId: string, customDuaId: string): Promise<void> {
  await ensureDuaDeckSchemaReady({ requireTables: true });
  const profile = await requireProfile(clerkUserId);
  const customDua = await db().customDua.findFirst({
    where: {
      id: customDuaId,
      userId: profile.id,
    },
    select: { id: true, moduleId: true },
  });

  if (!customDua) {
    throw new DuaDeckError("Custom dua not found.", 404, "CUSTOM_DUA_NOT_FOUND");
  }

  await db().$transaction([
    db().duaDeckOrder.deleteMany({
      where: {
        userId: profile.id,
        moduleId: normalizeModuleId(customDua.moduleId),
        itemKey: `custom:${customDua.id}`,
      },
    }),
    db().customDua.delete({
      where: { id: customDua.id },
    }),
  ]);
}

export async function saveDeckOrder(clerkUserId: string, input: {
  moduleId: DuaModuleId | string;
  itemKey: string;
  sortOrder: number | null | undefined;
}): Promise<DuaDeckOrderSnapshot> {
  await ensureDuaDeckSchemaReady({ requireTables: true });
  const profile = await requireProfile(clerkUserId);
  const moduleId = normalizeModuleId(input.moduleId);
  await validateDeckItemOwnership(profile.id, moduleId, input.itemKey);

  const builtInMap = builtInDeckOrderMap(moduleId);
  const fallback = builtInMap.get(input.itemKey) ?? await nextDeckSortOrder(profile.id, moduleId);
  const sortOrder = clampSortOrder(input.sortOrder, fallback);

  const row = await db().duaDeckOrder.upsert({
    where: {
      userId_moduleId_itemKey: {
        userId: profile.id,
        moduleId,
        itemKey: input.itemKey,
      },
    },
    create: {
      userId: profile.id,
      moduleId,
      itemKey: input.itemKey,
      sortOrder,
    },
    update: {
      sortOrder,
    },
    select: {
      moduleId: true,
      itemKey: true,
      sortOrder: true,
    },
  });

  return toDeckOrderSnapshot(row);
}

export async function resetBuiltInDeckOrder(
  clerkUserId: string,
  moduleIdInput: DuaModuleId | string,
  itemKey: string,
): Promise<DuaDeckOrderSnapshot> {
  await ensureDuaDeckSchemaReady({ requireTables: true });
  const profile = await requireProfile(clerkUserId);
  const moduleId = normalizeModuleId(moduleIdInput);
  const builtInMap = builtInDeckOrderMap(moduleId);
  const fallback = builtInMap.get(itemKey);

  if (!fallback) {
    throw new DuaDeckError("Unknown built-in dua deck item.", 404, "ITEM_NOT_FOUND");
  }

  const row = await db().duaDeckOrder.upsert({
    where: {
      userId_moduleId_itemKey: {
        userId: profile.id,
        moduleId,
        itemKey,
      },
    },
    create: {
      userId: profile.id,
      moduleId,
      itemKey,
      sortOrder: fallback,
    },
    update: {
      sortOrder: fallback,
    },
    select: {
      moduleId: true,
      itemKey: true,
      sortOrder: true,
    },
  });

  return toDeckOrderSnapshot(row);
}
