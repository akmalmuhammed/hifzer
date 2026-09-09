export type JournalAutoDeletePreset = "" | "1" | "3" | "7" | "30";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function resolveJournalAutoDeleteAt(input: {
  createdAt?: string | null;
  preset: JournalAutoDeletePreset;
  now?: Date;
}): string | null {
  if (!input.preset) {
    return null;
  }

  const now = input.now ?? new Date();
  const parsedCreatedAt = input.createdAt ? Date.parse(input.createdAt) : Number.NaN;
  const baseTime = Number.isFinite(parsedCreatedAt) ? parsedCreatedAt : now.getTime();
  return new Date(baseTime + Number(input.preset) * DAY_IN_MS).toISOString();
}
