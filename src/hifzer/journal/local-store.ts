export const JOURNAL_ENTRY_TYPES = [
  "reflection",
  "dua",
  "repentance",
  "gratitude",
  "free",
] as const;

export type JournalEntryType = (typeof JOURNAL_ENTRY_TYPES)[number];
export type JournalDuaStatus = "ongoing" | "answered" | "accepted_differently";

export type JournalLinkedAyah = {
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  surahNameArabic: string;
  surahNameTransliteration: string;
};

export type JournalEntry = {
  id: string;
  type: JournalEntryType;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  linkedAyah?: JournalLinkedAyah | null;
  duaStatus?: JournalDuaStatus | null;
  autoDeleteAt?: string | null;
};

const JOURNAL_STORAGE_KEY = "hifzer_private_journal_entries_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function compareEntries(a: JournalEntry, b: JournalEntry): number {
  if (a.pinned !== b.pinned) {
    return a.pinned ? -1 : 1;
  }
  return b.updatedAt.localeCompare(a.updatedAt);
}

function normalizeEntry(entry: JournalEntry): JournalEntry {
  return {
    id: entry.id,
    type: JOURNAL_ENTRY_TYPES.includes(entry.type) ? entry.type : "free",
    content: typeof entry.content === "string" ? entry.content : "",
    tags: normalizeJournalTags(Array.isArray(entry.tags) ? entry.tags : []),
    pinned: entry.pinned === true,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    linkedAyah: entry.linkedAyah
      ? {
          ayahId: Number(entry.linkedAyah.ayahId),
          surahNumber: Number(entry.linkedAyah.surahNumber),
          ayahNumber: Number(entry.linkedAyah.ayahNumber),
          surahNameArabic: entry.linkedAyah.surahNameArabic ?? "",
          surahNameTransliteration: entry.linkedAyah.surahNameTransliteration ?? "",
        }
      : null,
    duaStatus:
      entry.duaStatus === "ongoing" ||
      entry.duaStatus === "answered" ||
      entry.duaStatus === "accepted_differently"
        ? entry.duaStatus
        : null,
    autoDeleteAt: entry.autoDeleteAt ?? null,
  };
}

function writeEntries(entries: JournalEntry[]) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries.sort(compareEntries)));
}

export function clearJournalEntries() {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(JOURNAL_STORAGE_KEY);
}

function pruneExpired(entries: JournalEntry[], now: Date): JournalEntry[] {
  return entries.filter((entry) => {
    if (!entry.autoDeleteAt) {
      return true;
    }
    const expiresAt = new Date(entry.autoDeleteAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return true;
    }
    return expiresAt.getTime() > now.getTime();
  });
}

export function listJournalEntries(now: Date = new Date()): JournalEntry[] {
  if (!isBrowser()) {
    return [];
  }
  const raw = safeJsonParse<JournalEntry[]>(window.localStorage.getItem(JOURNAL_STORAGE_KEY)) ?? [];
  const normalized = raw
    .map(normalizeEntry)
    .filter((entry) => typeof entry.id === "string" && entry.id.length > 0);
  const pruned = pruneExpired(normalized, now).sort(compareEntries);
  if (pruned.length !== normalized.length) {
    writeEntries(pruned);
  }
  return pruned;
}

export function upsertJournalEntry(entry: JournalEntry, now: Date = new Date()): JournalEntry[] {
  if (!isBrowser()) {
    return [];
  }
  const current = listJournalEntries(now).filter((item) => item.id !== entry.id);
  const normalized = normalizeEntry({
    ...entry,
    content: entry.content.trim(),
    createdAt: entry.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  });
  current.push(normalized);
  writeEntries(current);
  return current.sort(compareEntries);
}

export function deleteJournalEntry(entryId: string, now: Date = new Date()): JournalEntry[] {
  if (!isBrowser()) {
    return [];
  }
  const next = listJournalEntries(now).filter((entry) => entry.id !== entryId);
  writeEntries(next);
  return next;
}

export function createJournalEntryId(now: Date = new Date()): string {
  return `journal_${now.getTime()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function normalizeJournalTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const cleaned = tag
      .trim()
      .replace(/^#+/, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    if (!cleaned || cleaned.length > 32 || seen.has(cleaned)) {
      continue;
    }
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= 5) {
      break;
    }
  }
  return out;
}

export function formatJournalTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatJournalHijri(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Hijri date unavailable";
  }
  try {
    return new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "Hijri date unavailable";
  }
}

export function describeJournalMoment(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Quiet moment";
  }
  const hour = date.getHours();
  const part =
    hour < 5 ? "Late night"
    : hour < 12 ? "Morning"
    : hour < 17 ? "Afternoon"
    : hour < 20 ? "Evening"
    : "Night";
  return date.getDay() === 5 ? `Jumu'ah ${part.toLowerCase()}` : part;
}

export function formatAutoDeleteCountdown(entry: JournalEntry, now: Date = new Date()): string | null {
  if (!entry.autoDeleteAt) {
    return null;
  }
  const expiresAt = new Date(entry.autoDeleteAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return null;
  }
  const remainingMs = expiresAt.getTime() - now.getTime();
  if (remainingMs <= 0) {
    return "Releasing now";
  }
  const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h left` : `${days}d left`;
  }
  if (hours > 0) {
    return `${hours}h left`;
  }
  const minutes = Math.max(1, Math.floor(remainingMs / (1000 * 60)));
  return `${minutes}m left`;
}

export function buildLinkedAyahHref(linkedAyah: JournalLinkedAyah): string {
  return `/quran/read?view=compact&surah=${linkedAyah.surahNumber}&cursor=${linkedAyah.ayahId}`;
}

export function privacyStatusLabel(entry: JournalEntry): string {
  if (entry.autoDeleteAt) {
    return "Local only - auto-delete scheduled";
  }
  if (entry.type === "repentance") {
    return "Local only - repentance";
  }
  return "Local only";
}
