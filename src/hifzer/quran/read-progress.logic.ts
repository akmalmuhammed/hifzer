import type { QuranBrowseSource } from "@prisma/client";

export type QuranBrowseEventSnapshot = {
  ayahId: number;
  surahNumber: number;
  localDate: string;
  source: QuranBrowseSource;
};

export function distinctQuranAyahs(rows: QuranBrowseEventSnapshot[]) {
  const byAyahId = new Map<number, number>();
  for (const row of rows) {
    if (!byAyahId.has(row.ayahId)) {
      byAyahId.set(row.ayahId, row.surahNumber);
    }
  }
  return Array.from(byAyahId.entries()).map(([ayahId, surahNumber]) => ({
    ayahId,
    surahNumber,
  }));
}

export function ayahIdsByDate(
  rows: QuranBrowseEventSnapshot[],
  input?: { sources?: QuranBrowseSource[] },
): Map<string, Set<number>> {
  const allowedSources = input?.sources?.length ? new Set(input.sources) : null;
  const byDate = new Map<string, Set<number>>();

  for (const row of rows) {
    if (allowedSources && !allowedSources.has(row.source)) {
      continue;
    }
    const set = byDate.get(row.localDate) ?? new Set<number>();
    set.add(row.ayahId);
    byDate.set(row.localDate, set);
  }

  return byDate;
}
