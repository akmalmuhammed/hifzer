import "server-only";

import { cache } from "react";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { ensureCoreSchemaCompatibility, getCoreSchemaCapabilities } from "@/lib/db-compat";
import { db, dbConfigured } from "@/lib/db";

export type QuranReaderView = "list" | "compact";

export type QuranReaderFilterPrefsSnapshot = {
  view: QuranReaderView;
  surahNumber: number | null;
  ayahId: number | null;
  showPhonetic: boolean;
  showTranslation: boolean;
  showTafsir: boolean;
  tafsirId: number | null;
};

type SaveQuranReaderFilterPrefsInput = {
  clerkUserId: string;
  view: QuranReaderView;
  surahNumber: number | null;
  ayahId: number | null;
  showPhonetic: boolean;
  showTranslation: boolean;
  showTafsir: boolean;
  tafsirId: number | null;
};

function looksLikeMissingReaderFilterSchema(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("QuranReaderFilterPreference") ||
    message.includes("P2021") ||
    message.includes("P2022") ||
    /column .* does not exist/i.test(message) ||
    /relation .* does not exist/i.test(message)
  );
}

function normalizeView(value: string | null | undefined): QuranReaderView {
  return value === "compact" ? "compact" : "list";
}

async function quranReaderFilterPrefsAvailable(): Promise<boolean> {
  if (!dbConfigured()) {
    return false;
  }

  const capabilities = await getCoreSchemaCapabilities();
  if (capabilities.hasQuranReaderFilterTable) {
    return true;
  }

  try {
    await ensureCoreSchemaCompatibility();
  } catch {
    // Ignore patch failures and re-probe capabilities below.
  }

  const refreshed = await getCoreSchemaCapabilities({ refresh: true });
  return refreshed.hasQuranReaderFilterTable;
}

function toSnapshot(row: {
  view: string;
  surahNumber: number | null;
  ayahId: number | null;
  showPhonetic: boolean;
  showTranslation: boolean;
  showTafsir: boolean;
  tafsirId: number | null;
}): QuranReaderFilterPrefsSnapshot {
  return {
    view: normalizeView(row.view),
    surahNumber: row.surahNumber,
    ayahId: row.ayahId,
    showPhonetic: row.showPhonetic,
    showTranslation: row.showTranslation,
    showTafsir: row.showTafsir,
    tafsirId: row.tafsirId,
  };
}

const getQuranReaderFilterPrefsCached = cache(async (clerkUserId: string): Promise<QuranReaderFilterPrefsSnapshot | null> => {
  if (!(await quranReaderFilterPrefsAvailable())) {
    return null;
  }

  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return null;
  }

  try {
    const row = await db().quranReaderFilterPreference.findUnique({
      where: { userId: profile.id },
      select: {
        view: true,
        surahNumber: true,
        ayahId: true,
        showPhonetic: true,
        showTranslation: true,
        showTafsir: true,
        tafsirId: true,
      },
    });

    return row ? toSnapshot(row) : null;
  } catch (error) {
    if (looksLikeMissingReaderFilterSchema(error)) {
      return null;
    }
    throw error;
  }
});

export async function getQuranReaderFilterPrefs(clerkUserId: string): Promise<QuranReaderFilterPrefsSnapshot | null> {
  return getQuranReaderFilterPrefsCached(clerkUserId);
}

export async function saveQuranReaderFilterPrefs(
  input: SaveQuranReaderFilterPrefsInput,
): Promise<QuranReaderFilterPrefsSnapshot | null> {
  if (!(await quranReaderFilterPrefsAvailable())) {
    return null;
  }

  const profile = await getOrCreateUserProfile(input.clerkUserId);
  if (!profile) {
    return null;
  }

  try {
    const row = await db().quranReaderFilterPreference.upsert({
      where: { userId: profile.id },
      create: {
        userId: profile.id,
        view: input.view,
        surahNumber: input.surahNumber,
        ayahId: input.ayahId,
        showPhonetic: input.showPhonetic,
        showTranslation: input.showTranslation,
        showTafsir: input.showTafsir,
        tafsirId: input.tafsirId,
      },
      update: {
        view: input.view,
        surahNumber: input.surahNumber,
        ayahId: input.ayahId,
        showPhonetic: input.showPhonetic,
        showTranslation: input.showTranslation,
        showTafsir: input.showTafsir,
        tafsirId: input.tafsirId,
      },
      select: {
        view: true,
        surahNumber: true,
        ayahId: true,
        showPhonetic: true,
        showTranslation: true,
        showTafsir: true,
        tafsirId: true,
      },
    });

    return toSnapshot(row);
  } catch (error) {
    if (looksLikeMissingReaderFilterSchema(error)) {
      return null;
    }
    throw error;
  }
}
