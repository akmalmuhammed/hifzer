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

export type JournalLinkedDua = {
  moduleId: string;
  moduleLabel: string;
  stepId: string;
  title: string;
  label: string;
  arabic?: string | null;
  transliteration?: string | null;
  translation: string;
  sourceLabel?: string | null;
  sourceHref?: string | null;
};

export type JournalAyahSnapshot = JournalLinkedAyah & {
  textUthmani?: string | null;
  translation?: string | null;
};

export type JournalTextBlock = {
  id: string;
  kind: "text";
  content: string;
};

export type JournalAyahBlock = {
  id: string;
  kind: "ayah";
  title: string;
  ayah: JournalAyahSnapshot | null;
};

export type JournalDuaBlock = {
  id: string;
  kind: "dua";
  title: string;
  dua: JournalLinkedDua | null;
};

export type JournalBlock = JournalTextBlock | JournalAyahBlock | JournalDuaBlock;

export type JournalEntry = {
  id: string;
  type: JournalEntryType;
  title?: string;
  content: string;
  blocks?: JournalBlock[];
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  linkedAyah?: JournalLinkedAyah | null;
  linkedDua?: JournalLinkedDua | null;
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

function normalizeLinkedAyah(entry: unknown): JournalLinkedAyah | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const linkedAyah = entry as JournalLinkedAyah;
  const ayahId = Number(linkedAyah.ayahId);
  const surahNumber = Number(linkedAyah.surahNumber);
  const ayahNumber = Number(linkedAyah.ayahNumber);
  if (!Number.isFinite(ayahId) || !Number.isFinite(surahNumber) || !Number.isFinite(ayahNumber)) {
    return null;
  }

  return {
    ayahId,
    surahNumber,
    ayahNumber,
    surahNameArabic: linkedAyah.surahNameArabic ?? "",
    surahNameTransliteration: linkedAyah.surahNameTransliteration ?? "",
  };
}

function normalizeLinkedDua(entry: unknown): JournalLinkedDua | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const linkedDua = entry as JournalLinkedDua;
  if (!linkedDua.moduleId || !linkedDua.stepId || !linkedDua.title || !linkedDua.translation) {
    return null;
  }

  return {
    moduleId: linkedDua.moduleId ?? "",
    moduleLabel: linkedDua.moduleLabel ?? "",
    stepId: linkedDua.stepId ?? "",
    title: linkedDua.title ?? "",
    label: linkedDua.label ?? "",
    arabic: linkedDua.arabic ?? null,
    transliteration: linkedDua.transliteration ?? null,
    translation: linkedDua.translation ?? "",
    sourceLabel: linkedDua.sourceLabel ?? null,
    sourceHref: linkedDua.sourceHref ?? null,
  };
}

function normalizeAyahSnapshot(entry: unknown): JournalAyahSnapshot | null {
  const linkedAyah = normalizeLinkedAyah(entry);
  if (!linkedAyah) {
    return null;
  }

  const raw = entry as JournalAyahSnapshot;
  return {
    ...linkedAyah,
    textUthmani: typeof raw.textUthmani === "string" ? raw.textUthmani : null,
    translation: typeof raw.translation === "string" ? raw.translation : null,
  };
}

export function createJournalBlockId(now: Date = new Date()): string {
  return `block_${now.getTime()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function createJournalEntryId(now: Date = new Date()): string {
  return `journal_${now.getTime()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function createTextBlock(content = "", now: Date = new Date()): JournalTextBlock {
  return {
    id: createJournalBlockId(now),
    kind: "text",
    content,
  };
}

export function createAyahBlock(input?: {
  title?: string;
  ayah?: JournalAyahSnapshot | null;
  now?: Date;
}): JournalAyahBlock {
  return {
    id: createJournalBlockId(input?.now),
    kind: "ayah",
    title: input?.title ?? "",
    ayah: input?.ayah ?? null,
  };
}

export function createDuaBlock(input?: {
  title?: string;
  dua?: JournalLinkedDua | null;
  now?: Date;
}): JournalDuaBlock {
  return {
    id: createJournalBlockId(input?.now),
    kind: "dua",
    title: input?.title ?? "",
    dua: input?.dua ?? null,
  };
}

function normalizeBlock(entry: unknown, fallbackIndex = 0): JournalBlock | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const block = entry as JournalBlock;
  const id = typeof block.id === "string" && block.id.trim().length > 0
    ? block.id
    : `legacy_block_${fallbackIndex}`;

  if (block.kind === "text") {
    return {
      id,
      kind: "text",
      content: typeof block.content === "string" ? block.content : "",
    };
  }

  if (block.kind === "ayah") {
    return {
      id,
      kind: "ayah",
      title: typeof block.title === "string" ? block.title : "",
      ayah: normalizeAyahSnapshot(block.ayah),
    };
  }

  if (block.kind === "dua") {
    return {
      id,
      kind: "dua",
      title: typeof block.title === "string" ? block.title : "",
      dua: normalizeLinkedDua(block.dua),
    };
  }

  return null;
}

export function buildLegacyJournalBlocks(input: {
  content?: string | null;
  linkedAyah?: JournalLinkedAyah | null;
  linkedDua?: JournalLinkedDua | null;
}): JournalBlock[] {
  const blocks: JournalBlock[] = [];
  const textContent = typeof input.content === "string" ? input.content : "";
  const linkedAyah = normalizeLinkedAyah(input.linkedAyah ?? null);
  const linkedDua = normalizeLinkedDua(input.linkedDua ?? null);

  if (textContent.trim().length > 0) {
    blocks.push(createTextBlock(textContent));
  }

  if (linkedAyah) {
    blocks.push(
      createAyahBlock({
        title: `${linkedAyah.surahNameTransliteration} ${linkedAyah.surahNumber}:${linkedAyah.ayahNumber}`,
        ayah: {
          ...linkedAyah,
          textUthmani: null,
          translation: null,
        },
      }),
    );
  }

  if (linkedDua) {
    blocks.push(
      createDuaBlock({
        title: linkedDua.title,
        dua: linkedDua,
      }),
    );
  }

  return blocks;
}

export function normalizeJournalBlocks(
  blocks: unknown,
  fallback?: {
    content?: string | null;
    linkedAyah?: JournalLinkedAyah | null;
    linkedDua?: JournalLinkedDua | null;
  },
): JournalBlock[] {
  if (!Array.isArray(blocks)) {
    return buildLegacyJournalBlocks({
      content: fallback?.content ?? "",
      linkedAyah: fallback?.linkedAyah ?? null,
      linkedDua: fallback?.linkedDua ?? null,
    });
  }

  const normalized = blocks
    .map((block, index) => normalizeBlock(block, index))
    .filter((block): block is JournalBlock => block !== null);

  if (normalized.length === 0) {
    return buildLegacyJournalBlocks({
      content: fallback?.content ?? "",
      linkedAyah: fallback?.linkedAyah ?? null,
      linkedDua: fallback?.linkedDua ?? null,
    });
  }

  return normalized;
}

export function deriveJournalContent(title: string, blocks: JournalBlock[]): string {
  const parts: string[] = [];
  const trimmedTitle = title.trim();
  if (trimmedTitle) {
    parts.push(trimmedTitle);
  }

  for (const block of blocks) {
    if (block.kind === "text") {
      if (block.content.trim()) {
        parts.push(block.content.trim());
      }
      continue;
    }

    if (block.kind === "ayah" && block.ayah) {
      if (block.title.trim()) {
        parts.push(block.title.trim());
      }
      if (block.ayah.translation?.trim()) {
        parts.push(block.ayah.translation.trim());
      }
      parts.push(`${block.ayah.surahNameTransliteration} ${block.ayah.surahNumber}:${block.ayah.ayahNumber}`);
      continue;
    }

    if (block.kind === "dua" && block.dua) {
      if (block.title.trim()) {
        parts.push(block.title.trim());
      }
      if (block.dua.translation.trim()) {
        parts.push(block.dua.translation.trim());
      }
      parts.push(block.dua.title);
    }
  }

  return parts.join("\n\n").trim();
}

export function hasMeaningfulJournalBlocks(blocks: JournalBlock[]): boolean {
  return blocks.some((block) => {
    if (block.kind === "text") {
      return block.content.trim().length > 0;
    }
    if (block.kind === "ayah") {
      return Boolean(block.ayah);
    }
    return Boolean(block.dua);
  });
}

export function findPrimaryLinkedAyah(blocks: JournalBlock[]): JournalLinkedAyah | null {
  for (const block of blocks) {
    if (block.kind === "ayah" && block.ayah) {
      return {
        ayahId: block.ayah.ayahId,
        surahNumber: block.ayah.surahNumber,
        ayahNumber: block.ayah.ayahNumber,
        surahNameArabic: block.ayah.surahNameArabic,
        surahNameTransliteration: block.ayah.surahNameTransliteration,
      };
    }
  }
  return null;
}

export function findPrimaryLinkedDua(blocks: JournalBlock[]): JournalLinkedDua | null {
  for (const block of blocks) {
    if (block.kind === "dua" && block.dua) {
      return block.dua;
    }
  }
  return null;
}

function normalizeEntry(entry: JournalEntry): JournalEntry {
  const linkedAyah = normalizeLinkedAyah(entry.linkedAyah ?? null);
  const linkedDua = normalizeLinkedDua(entry.linkedDua ?? null);
  const blocks = normalizeJournalBlocks(entry.blocks ?? null, {
    content: entry.content,
    linkedAyah,
    linkedDua,
  });
  const primaryLinkedAyah = linkedAyah ?? findPrimaryLinkedAyah(blocks);
  const primaryLinkedDua = linkedDua ?? findPrimaryLinkedDua(blocks);

  return {
    id: entry.id,
    type: JOURNAL_ENTRY_TYPES.includes(entry.type) ? entry.type : "free",
    title: typeof entry.title === "string" ? entry.title.trim() : "",
    content:
      typeof entry.content === "string" && entry.content.trim().length > 0
        ? entry.content.trim()
        : deriveJournalContent(typeof entry.title === "string" ? entry.title : "", blocks),
    blocks,
    tags: normalizeJournalTags(Array.isArray(entry.tags) ? entry.tags : []),
    pinned: entry.pinned === true,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    linkedAyah: primaryLinkedAyah,
    linkedDua: primaryLinkedDua,
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
    title: entry.title?.trim() ?? "",
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

export function buildLinkedDuaHref(linkedDua: JournalLinkedDua): string {
  return `/dua/${linkedDua.moduleId}`;
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
