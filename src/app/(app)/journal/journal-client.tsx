"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  ChevronDown,
  Heart,
  Pin,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Type,
  X,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import clsx from "clsx";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { SupportTextPanel } from "@/components/quran/support-text-panel";
import { useToast } from "@/components/ui/toast";
import {
  JOURNAL_ENTRY_TYPES,
  buildLinkedDuaHref,
  clearJournalEntries,
  createAyahBlock,
  createDuaBlock,
  createJournalEntryId,
  createTextBlock,
  deleteJournalEntry,
  deriveJournalContent,
  findPrimaryLinkedAyah,
  findPrimaryLinkedDua,
  formatAutoDeleteCountdown,
  formatJournalTimestamp,
  hasMeaningfulJournalBlocks,
  listJournalEntries,
  normalizeJournalTags,
  type JournalAyahBlock,
  type JournalAyahSnapshot,
  type JournalBlock,
  type JournalDuaStatus,
  type JournalEntry,
  type JournalEntryType,
  type JournalLinkedDua,
  upsertJournalEntry,
} from "@/hifzer/journal/local-store";
import styles from "./journal.module.css";

type SurahOption = {
  surahNumber: number;
  startAyahId: number;
  ayahCount: number;
  nameArabic: string;
  nameTransliteration: string;
  nameEnglish: string;
};

type JournalDraft = {
  id: string | null;
  type: JournalEntryType;
  title: string;
  blocks: JournalBlock[];
  tags: string[];
  pinned: boolean;
  createdAt: string | null;
  duaStatus: JournalDuaStatus;
  autoDeletePreset: "" | "1" | "3" | "7" | "30";
};

type InsertDraft = {
  afterBlockId: string | null;
  kind: "ayah" | "dua";
  title: string;
  surahNumber: number;
  ayahNumber: number;
  duaValue: string;
  loading: boolean;
};

type AyahCardResponse = {
  id: number;
  surahNumber: number;
  ayahNumber: number;
  textUthmani: string;
  translation: string | null;
  surahNameArabic: string;
  surahNameTransliteration: string;
};

const AUTO_DELETE_PRESETS: Array<{ value: JournalDraft["autoDeletePreset"]; label: string }> = [
  { value: "", label: "Keep it" },
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
];

const DUA_STATUS_OPTIONS: Array<{ value: JournalDuaStatus; label: string }> = [
  { value: "ongoing", label: "Still making this dua" },
  { value: "answered", label: "Answered" },
  { value: "accepted_differently", label: "Answered differently" },
];

function buildDuaOptionValue(linkedDua: Pick<JournalLinkedDua, "moduleId" | "stepId">): string {
  return `${linkedDua.moduleId}::${linkedDua.stepId}`;
}

function inferAutoDeletePreset(entry: JournalEntry): JournalDraft["autoDeletePreset"] {
  if (!entry.autoDeleteAt) {
    return "";
  }
  const createdAt = new Date(entry.createdAt);
  const autoDeleteAt = new Date(entry.autoDeleteAt);
  if (Number.isNaN(createdAt.getTime()) || Number.isNaN(autoDeleteAt.getTime())) {
    return "";
  }
  const diffDays = Math.round((autoDeleteAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1 || diffDays === 3 || diffDays === 7 || diffDays === 30) {
    return String(diffDays) as JournalDraft["autoDeletePreset"];
  }
  return "";
}

function createEmptyDraft(type: JournalEntryType = "reflection"): JournalDraft {
  return {
    id: null,
    type,
    title: "",
    blocks: [createTextBlock("")],
    tags: [],
    pinned: false,
    createdAt: null,
    duaStatus: "ongoing",
    autoDeletePreset: "",
  };
}

function draftFromEntry(entry: JournalEntry): JournalDraft {
  return {
    id: entry.id,
    type: entry.type,
    title: entry.title ?? "",
    blocks: entry.blocks && entry.blocks.length > 0 ? entry.blocks : [createTextBlock(entry.content)],
    tags: entry.tags,
    pinned: entry.pinned,
    createdAt: entry.createdAt,
    duaStatus: entry.duaStatus ?? "ongoing",
    autoDeletePreset: inferAutoDeletePreset(entry),
  };
}

function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function buildSearchText(entry: JournalEntry): string {
  return [
    entry.title ?? "",
    entry.content,
    entry.tags.join(" "),
    ...(entry.blocks ?? []).flatMap((block) => {
      if (block.kind === "text") {
        return [block.content];
      }
      if (block.kind === "ayah") {
        return [
          block.title,
          block.ayah?.translation ?? "",
          block.ayah?.textUthmani ?? "",
          block.ayah ? `${block.ayah.surahNameTransliteration} ${block.ayah.surahNumber}:${block.ayah.ayahNumber}` : "",
        ];
      }
      return [block.title, block.dua?.title ?? "", block.dua?.translation ?? ""];
    }),
  ]
    .join(" ")
    .toLowerCase();
}

function buildEntryPreview(entry: JournalEntry): string {
  const firstText = (entry.blocks ?? []).find(
    (block): block is Extract<JournalBlock, { kind: "text" }> => block.kind === "text" && block.content.trim().length > 0,
  );
  if (firstText) {
    const preview = firstText.content.trim();
    return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview;
  }

  const firstAyah = (entry.blocks ?? []).find(
    (block): block is Extract<JournalBlock, { kind: "ayah" }> => block.kind === "ayah" && Boolean(block.ayah),
  );
  if (firstAyah?.ayah) {
    return `${firstAyah.title || "Ayah card"} - ${firstAyah.ayah.surahNameTransliteration} ${firstAyah.ayah.surahNumber}:${firstAyah.ayah.ayahNumber}`;
  }

  const firstDua = (entry.blocks ?? []).find(
    (block): block is Extract<JournalBlock, { kind: "dua" }> => block.kind === "dua" && Boolean(block.dua),
  );
  if (firstDua?.dua) {
    return `${firstDua.title || "Dua card"} - ${firstDua.dua.translation}`;
  }

  return "Untitled note";
}

function hasMeaningfulDraftContent(draft: JournalDraft): boolean {
  return Boolean(draft.title.trim().length > 0 || draft.tags.length > 0 || hasMeaningfulJournalBlocks(draft.blocks));
}

function insertBlockAfter(blocks: JournalBlock[], afterBlockId: string | null, block: JournalBlock): JournalBlock[] {
  if (afterBlockId === null) {
    return [block, ...blocks];
  }
  const index = blocks.findIndex((item) => item.id === afterBlockId);
  if (index < 0) {
    return [...blocks, block];
  }
  return [...blocks.slice(0, index + 1), block, ...blocks.slice(index + 1)];
}

function ensureTextBlock(blocks: JournalBlock[]): JournalBlock[] {
  return blocks.length > 0 ? blocks : [createTextBlock("")];
}

async function readApiJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Something went wrong.");
  }
  return payload as T;
}

export function JournalClient(props: {
  surahs: SurahOption[];
  duaOptions: JournalLinkedDua[];
  initialEntries: JournalEntry[];
  syncEnabled: boolean;
  reciterId: string;
  translationDir: "ltr" | "rtl";
  translationAlignClass: string;
}) {
  const { pushToast } = useToast();
  const didAttemptLegacyImportRef = useRef(false);

  const [entries, setEntries] = useState<JournalEntry[]>(() => sortEntries(props.initialEntries));
  const [draft, setDraft] = useState<JournalDraft | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | "new" | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => props.syncEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [insertDraft, setInsertDraft] = useState<InsertDraft | null>(null);
  const [ayahCardById, setAyahCardById] = useState<Record<number, AyahCardResponse>>({});
  const [ayahCardErrorById, setAyahCardErrorById] = useState<Record<number, string>>({});
  const [hydratingAyahIds, setHydratingAyahIds] = useState<number[]>([]);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const defaultDuaValue = props.duaOptions[0] ? buildDuaOptionValue(props.duaOptions[0]) : "";
  const currentEntry = draft?.id ? entries.find((entry) => entry.id === draft.id) ?? null : null;
  const canSave = Boolean(draft && hasMeaningfulDraftContent(draft) && (!draft.id || isDirty));
  const isBusy = isSaving || isDeleting;
  const pinnedCount = entries.filter((entry) => entry.pinned).length;

  const filteredEntries = entries.filter((entry) => {
    if (!deferredSearch) {
      return true;
    }
    if (draft?.id === entry.id) {
      return true;
    }
    return buildSearchText(entry).includes(deferredSearch);
  });

  const saveSyncedEntry = async (entry: Omit<JournalEntry, "id"> & { id: string | null }) => {
    const response = await fetch("/api/journal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    });
    const payload = await readApiJson<{ ok: true; entry: JournalEntry }>(response);
    return payload.entry;
  };

  const importLegacyEntries = async (legacyEntries: JournalEntry[]) => {
    const response = await fetch("/api/journal/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entries: legacyEntries }),
    });
    const payload = await readApiJson<{ ok: true; entries: JournalEntry[] }>(response);
    return payload.entries;
  };

  const removeSyncedEntry = async (entryId: string) => {
    const response = await fetch(`/api/journal/${encodeURIComponent(entryId)}`, {
      method: "DELETE",
    });
    await readApiJson<{ ok: true }>(response);
  };

  const fetchAyahCard = async (ayahId: number) => {
    const response = await fetch(`/api/quran/ayah-card?ayahId=${encodeURIComponent(String(ayahId))}`);
    const payload = await readApiJson<{ ok: true; ayah: AyahCardResponse }>(response);
    return payload.ayah;
  };

  const updateDraft = (
    updater: (current: JournalDraft) => JournalDraft,
    options?: {
      markDirty?: boolean;
    },
  ) => {
    setDraft((current) => (current ? updater(current) : current));
    if (options?.markDirty ?? true) {
      setIsDirty(true);
    }
  };

  const updateBlock = (blockId: string, updater: (block: JournalBlock) => JournalBlock) => {
    updateDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) => (block.id === blockId ? updater(block) : block)),
    }));
  };

  const removeBlock = (blockId: string) => {
    updateDraft((current) => ({
      ...current,
      blocks: ensureTextBlock(current.blocks.filter((block) => block.id !== blockId)),
    }));
  };

  const persistDraft = async (options?: {
    quiet?: boolean;
    collapseAfterSave?: boolean;
  }): Promise<JournalEntry | null> => {
    if (!draft) {
      return null;
    }
    const quiet = options?.quiet ?? false;
    const collapseAfterSave = options?.collapseAfterSave ?? false;

    if (!hasMeaningfulDraftContent(draft)) {
      setIsDirty(false);
      return null;
    }

    const now = new Date();
    if (draft.pinned && pinnedCount >= 10 && !currentEntry?.pinned) {
      pushToast({
        tone: "warning",
        title: "Pin limit reached",
        message: "Keep at most 10 pinned notes so the journal stays calm.",
      });
      return null;
    }

    const autoDeleteAt =
      draft.type === "repentance" && draft.autoDeletePreset
        ? new Date(now.getTime() + Number(draft.autoDeletePreset) * 24 * 60 * 60 * 1000).toISOString()
        : null;
    const content = deriveJournalContent(draft.title, draft.blocks);
    const nextEntry = {
      id: draft.id,
      type: draft.type,
      title: draft.title,
      content,
      blocks: draft.blocks,
      tags: draft.tags,
      pinned: draft.pinned,
      createdAt: draft.createdAt ?? now.toISOString(),
      updatedAt: now.toISOString(),
      linkedAyah: findPrimaryLinkedAyah(draft.blocks),
      linkedDua: findPrimaryLinkedDua(draft.blocks),
      duaStatus: draft.type === "dua" ? draft.duaStatus : null,
      autoDeleteAt,
    };

    let savedEntry: JournalEntry;
    if (props.syncEnabled) {
      setIsSaving(true);
      try {
        savedEntry = await saveSyncedEntry(nextEntry);
      } catch (error) {
        pushToast({
          tone: "warning",
          title: "Could not save note",
          message: error instanceof Error ? error.message : "Please try again.",
        });
        return null;
      } finally {
        setIsSaving(false);
      }
      setEntries((current) => sortEntries([...current.filter((entry) => entry.id !== savedEntry.id), savedEntry]));
    } else {
      const localEntry: JournalEntry = {
        ...nextEntry,
        id: nextEntry.id ?? createJournalEntryId(now),
      };
      const nextEntries = upsertJournalEntry(localEntry, now);
      setEntries(nextEntries);
      savedEntry = localEntry;
    }

    if (collapseAfterSave) {
      setDraft(null);
      setExpandedEntryId(null);
      setInsertDraft(null);
      setTagInput("");
    } else {
      setDraft(draftFromEntry(savedEntry));
      setExpandedEntryId(savedEntry.id);
    }
    setIsDirty(false);
    if (!quiet) {
      pushToast({
        tone: "success",
        title: draft.id ? "Note updated" : "Note saved",
        message: props.syncEnabled
          ? "This note is saved to your account."
          : "This note is saved in this browser.",
      });
    }
    return savedEntry;
  };

  const maybePersistBeforeSwitch = async () => {
    if (!draft || !isDirty) {
      return true;
    }
    if (!hasMeaningfulDraftContent(draft)) {
      setIsDirty(false);
      return true;
    }
    const savedEntry = await persistDraft({ quiet: true });
    return savedEntry !== null;
  };

  useEffect(() => {
    if (props.syncEnabled) {
      setEntries(sortEntries(props.initialEntries));
      setIsLoaded(true);
      return;
    }
    const loadedEntries = listJournalEntries();
    setEntries(loadedEntries);
    setIsLoaded(true);
  }, [props.initialEntries, props.syncEnabled]);

  useEffect(() => {
    if (!props.syncEnabled || didAttemptLegacyImportRef.current) {
      return;
    }

    const legacyEntries = listJournalEntries();
    didAttemptLegacyImportRef.current = true;
    if (legacyEntries.length === 0) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const importedEntries = await importLegacyEntries(legacyEntries);
        if (cancelled) {
          return;
        }
        clearJournalEntries();
        setEntries(sortEntries(importedEntries));
        pushToast({
          tone: "success",
          title: "Notes moved to your account",
          message: "Your older browser-only notes are now saved to your account.",
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        pushToast({
          tone: "warning",
          title: "Could not import old local notes",
          message: error instanceof Error ? error.message : "Those older notes are still in this browser for now.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.syncEnabled, pushToast]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    const missingAyahs = draft.blocks
      .filter((block): block is JournalAyahBlock => block.kind === "ayah" && Boolean(block.ayah))
      .map((block) => block.ayah as JournalAyahSnapshot)
      .filter((ayah) => !ayah.textUthmani || !ayah.translation)
      .filter((ayah) => !ayahCardById[ayah.ayahId] && !hydratingAyahIds.includes(ayah.ayahId));

    if (missingAyahs.length === 0) {
      return;
    }

    const nextAyahId = missingAyahs[0]?.ayahId;
    if (!nextAyahId) {
      return;
    }

    let cancelled = false;
    setHydratingAyahIds((current) => [...current, nextAyahId]);

    void (async () => {
      try {
        const ayah = await fetchAyahCard(nextAyahId);
        if (cancelled) {
          return;
        }
        setAyahCardById((current) => ({ ...current, [nextAyahId]: ayah }));
        setAyahCardErrorById((current) => {
          if (!(nextAyahId in current)) {
            return current;
          }
          const next = { ...current };
          delete next[nextAyahId];
          return next;
        });
        updateDraft(
          (current) => ({
            ...current,
            blocks: current.blocks.map((block) => {
              if (block.kind !== "ayah" || !block.ayah || block.ayah.ayahId !== nextAyahId) {
                return block;
              }
              return {
                ...block,
                ayah: {
                  ayahId: ayah.id,
                  surahNumber: ayah.surahNumber,
                  ayahNumber: ayah.ayahNumber,
                  surahNameArabic: ayah.surahNameArabic,
                  surahNameTransliteration: ayah.surahNameTransliteration,
                  textUthmani: ayah.textUthmani,
                  translation: ayah.translation,
                },
              };
            }),
          }),
          { markDirty: false },
        );
      } catch (error) {
        if (cancelled) {
          return;
        }
        setAyahCardErrorById((current) => ({
          ...current,
          [nextAyahId]: error instanceof Error ? error.message : "Could not load this ayah right now.",
        }));
      } finally {
        if (!cancelled) {
          setHydratingAyahIds((current) => current.filter((id) => id !== nextAyahId));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ayahCardById, draft, hydratingAyahIds]);

  const handleCreateNew = async (type: JournalEntryType = "reflection") => {
    const shouldContinue = await maybePersistBeforeSwitch();
    if (!shouldContinue) {
      return;
    }
    setDraft(createEmptyDraft(type));
    setExpandedEntryId("new");
    setTagInput("");
    setInsertDraft(null);
    setIsDirty(false);
  };

  const handleOpenEntry = async (entry: JournalEntry) => {
    const shouldContinue = await maybePersistBeforeSwitch();
    if (!shouldContinue) {
      return;
    }
    setDraft(draftFromEntry(entry));
    setExpandedEntryId(entry.id);
    setTagInput("");
    setInsertDraft(null);
    setIsDirty(false);
  };

  const handleDeleteCurrent = async () => {
    if (!draft) {
      return;
    }

    if (!draft.id) {
      setDraft(null);
      setExpandedEntryId(null);
      setInsertDraft(null);
      setIsDirty(false);
      return;
    }

    if (props.syncEnabled) {
      setIsDeleting(true);
      try {
        await removeSyncedEntry(draft.id);
        setEntries((current) => current.filter((entry) => entry.id !== draft.id));
      } catch (error) {
        pushToast({
          tone: "warning",
          title: "Could not delete note",
          message: error instanceof Error ? error.message : "Please try again.",
        });
        return;
      } finally {
        setIsDeleting(false);
      }
    } else {
      const nextEntries = deleteJournalEntry(draft.id);
      setEntries(nextEntries);
    }

    setDraft(null);
    setExpandedEntryId(null);
    setInsertDraft(null);
    setIsDirty(false);
    pushToast({
      tone: "warning",
      title: "Note removed",
      message: props.syncEnabled
        ? "That note was removed from your account."
        : "That note was removed from this browser.",
    });
  };

  const handleTagAdd = () => {
    if (!draft) {
      return;
    }
    const normalized = normalizeJournalTags([...draft.tags, ...tagInput.split(",")]);
    updateDraft((current) => ({ ...current, tags: normalized }));
    setTagInput("");
  };

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleTagAdd();
    }
  };

  const openInsertComposer = (afterBlockId: string | null, kind: InsertDraft["kind"]) => {
    setInsertDraft({
      afterBlockId,
      kind,
      title: "",
      surahNumber: props.surahs[0]?.surahNumber ?? 1,
      ayahNumber: 1,
      duaValue: defaultDuaValue,
      loading: false,
    });
  };

  const handleInsertTextBlock = (afterBlockId: string | null) => {
    updateDraft((current) => ({
      ...current,
      blocks: insertBlockAfter(current.blocks, afterBlockId, createTextBlock("")),
    }));
    setInsertDraft(null);
  };

  const handleInsertAyahBlock = async () => {
    if (!draft || !insertDraft || insertDraft.kind !== "ayah") {
      return;
    }

    const selectedSurah = props.surahs.find((surah) => surah.surahNumber === insertDraft.surahNumber);
    const boundedAyahNumber = Math.min(Math.max(insertDraft.ayahNumber, 1), selectedSurah?.ayahCount ?? 286);
    const ayahId = (selectedSurah?.startAyahId ?? 1) + boundedAyahNumber - 1;

    setInsertDraft((current) => (current ? { ...current, loading: true } : current));
    try {
      const ayah = await fetchAyahCard(ayahId);
      const block = createAyahBlock({
        title: insertDraft.title.trim() || `${ayah.surahNameTransliteration} ${ayah.surahNumber}:${ayah.ayahNumber}`,
        ayah: {
          ayahId: ayah.id,
          surahNumber: ayah.surahNumber,
          ayahNumber: ayah.ayahNumber,
          surahNameArabic: ayah.surahNameArabic,
          surahNameTransliteration: ayah.surahNameTransliteration,
          textUthmani: ayah.textUthmani,
          translation: ayah.translation,
        },
      });
      updateDraft((current) => ({
        ...current,
        blocks: insertBlockAfter(current.blocks, insertDraft.afterBlockId, block),
      }));
      setAyahCardById((current) => ({ ...current, [ayah.id]: ayah }));
      setInsertDraft(null);
    } catch (error) {
      pushToast({
        tone: "warning",
        title: "Could not load ayah",
        message: error instanceof Error ? error.message : "Please try again.",
      });
      setInsertDraft((current) => (current ? { ...current, loading: false } : current));
    }
  };

  const handleInsertDuaBlock = () => {
    if (!draft || !insertDraft || insertDraft.kind !== "dua") {
      return;
    }

    const selectedDua =
      props.duaOptions.find((option) => buildDuaOptionValue(option) === insertDraft.duaValue) ?? null;
    if (!selectedDua) {
      pushToast({
        tone: "warning",
        title: "Choose a dua first",
        message: "Pick a dua card before inserting it into the note.",
      });
      return;
    }

    const block = createDuaBlock({
      title: insertDraft.title.trim() || selectedDua.title,
      dua: selectedDua,
    });
    updateDraft((current) => ({
      ...current,
      blocks: insertBlockAfter(current.blocks, insertDraft.afterBlockId, block),
    }));
    setInsertDraft(null);
  };

  const renderInsertRow = (afterBlockId: string | null) => {
    const isOpen = insertDraft?.afterBlockId === afterBlockId;

    return (
      <div className={styles.insertZone}>
        <div className={styles.insertActions}>
          <button type="button" className={styles.insertChip} onClick={() => handleInsertTextBlock(afterBlockId)}>
            <Type size={14} />
            Text
          </button>
          <button type="button" className={styles.insertChip} onClick={() => openInsertComposer(afterBlockId, "ayah")}>
            <BookOpenText size={14} />
            Ayah card
          </button>
          <button type="button" className={styles.insertChip} onClick={() => openInsertComposer(afterBlockId, "dua")}>
            <Heart size={14} />
            Dua card
          </button>
        </div>

        {isOpen && insertDraft ? (
          <div className={styles.insertPanel}>
            <div className={styles.insertPanelHeader}>
              <p className={styles.insertPanelTitle}>
                {insertDraft.kind === "ayah" ? "Insert an ayah card" : "Insert a dua card"}
              </p>
              <button type="button" className={styles.closeInlineButton} onClick={() => setInsertDraft(null)}>
                <X size={14} />
              </button>
            </div>

            <Input
              value={insertDraft.title}
              onChange={(event) =>
                setInsertDraft((current) => (current ? { ...current, title: event.target.value } : current))
              }
              placeholder={insertDraft.kind === "ayah" ? "Card title" : "Card title"}
            />

            {insertDraft.kind === "ayah" ? (
              <div className={styles.insertGrid}>
                <select
                  value={insertDraft.surahNumber}
                  onChange={(event) =>
                    setInsertDraft((current) =>
                      current
                        ? {
                            ...current,
                            surahNumber: Number(event.target.value),
                            ayahNumber: 1,
                          }
                        : current,
                    )
                  }
                  className={styles.inlineSelect}
                >
                  {props.surahs.map((surah) => (
                    <option key={surah.surahNumber} value={surah.surahNumber}>
                      {surah.surahNumber}. {surah.nameTransliteration}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  max={props.surahs.find((surah) => surah.surahNumber === insertDraft.surahNumber)?.ayahCount ?? 286}
                  value={String(insertDraft.ayahNumber)}
                  onChange={(event) =>
                    setInsertDraft((current) =>
                      current
                        ? {
                            ...current,
                            ayahNumber: Number(event.target.value || 1),
                          }
                        : current,
                    )
                  }
                />
                <Button onClick={() => void handleInsertAyahBlock()} disabled={insertDraft.loading}>
                  <Sparkles size={16} />
                  {insertDraft.loading ? "Loading..." : "Insert ayah"}
                </Button>
              </div>
            ) : (
              <div className={styles.insertGrid}>
                <select
                  value={insertDraft.duaValue}
                  onChange={(event) =>
                    setInsertDraft((current) => (current ? { ...current, duaValue: event.target.value } : current))
                  }
                  className={styles.inlineSelect}
                >
                  {props.duaOptions.map((option) => (
                    <option key={buildDuaOptionValue(option)} value={buildDuaOptionValue(option)}>
                      {option.moduleLabel}: {option.title}
                    </option>
                  ))}
                </select>
                <Button onClick={handleInsertDuaBlock} disabled={!props.duaOptions.length}>
                  <Sparkles size={16} />
                  Insert dua
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  };

  const renderExpandedCard = (noteDraft: JournalDraft, isNew: boolean) => {
    return (
      <Card className={clsx("kw-fade-in", styles.noteCard, styles.noteCardExpanded)}>
        <div className={styles.noteHeader}>
          <div className={styles.noteTopRow}>
            <div className={styles.typeRow}>
              {JOURNAL_ENTRY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  data-active={noteDraft.type === type ? "1" : "0"}
                  className={styles.typeButton}
                  onClick={() =>
                    updateDraft((current) => ({
                      ...current,
                      type,
                      duaStatus: type === "dua" ? current.duaStatus : "ongoing",
                      autoDeletePreset: type === "repentance" ? current.autoDeletePreset : "",
                    }))
                  }
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={isBusy}
                onClick={() => updateDraft((current) => ({ ...current, pinned: !current.pinned }))}
              >
                <Pin size={16} />
                {noteDraft.pinned ? "Unpin" : "Pin"}
              </Button>
              <Button variant="danger" disabled={isBusy} onClick={() => void handleDeleteCurrent()}>
                <Trash2 size={16} />
                {isNew ? "Discard" : "Delete"}
              </Button>
            </div>
          </div>

          <Input
            value={noteDraft.title}
            onChange={(event) => updateDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Name this note"
            className={styles.noteTitleInput}
          />
        </div>

        <div className={styles.blockList}>
          {renderInsertRow(null)}
          {noteDraft.blocks.map((block) => {
            if (block.kind === "text") {
              return (
                <div key={block.id} className={styles.blockShell}>
                  <Textarea
                    value={block.content}
                    onChange={(event) =>
                      updateBlock(block.id, () => ({
                        ...block,
                        content: event.target.value,
                      }))
                    }
                    placeholder="Write quietly..."
                    className={styles.textBlock}
                  />
                  <div className={styles.blockActions}>
                    {noteDraft.blocks.length > 1 ? (
                      <button type="button" className={styles.blockActionButton} onClick={() => removeBlock(block.id)}>
                        Remove block
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }

            if (block.kind === "ayah") {
              const ayah = block.ayah
                ? ayahCardById[block.ayah.ayahId]
                  ? {
                      ...block.ayah,
                      textUthmani: ayahCardById[block.ayah.ayahId].textUthmani,
                      translation: ayahCardById[block.ayah.ayahId].translation,
                    }
                  : block.ayah
                : null;
              const ayahError = block.ayah ? ayahCardErrorById[block.ayah.ayahId] : null;

              return (
                <div key={block.id} className={styles.blockShell}>
                  <div className={styles.richCardBlock}>
                    <div className={styles.blockTopActions}>
                      <button
                        type="button"
                        className={styles.iconActionButton}
                        onClick={() => removeBlock(block.id)}
                        aria-label="Remove inserted ayah"
                        title="Remove ayah"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {ayah ? (
                      <>
                        <div dir="rtl" className={styles.arabicCard}>
                          {ayah.textUthmani ?? "Loading ayah..."}
                        </div>
                        <SupportTextPanel
                          kind="translation"
                          dir={props.translationDir}
                          alignClassName={props.translationAlignClass}
                        >
                          {ayah.translation ?? ayahError ?? "Translation unavailable right now."}
                        </SupportTextPanel>
                      </>
                    ) : (
                      <p className={styles.inlineHint}>This ayah card needs to be reinserted.</p>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={block.id} className={styles.blockShell}>
                <div className={styles.richCardBlock}>
                  <div className={styles.richCardHeader}>
                    <div className={styles.richCardPills}>
                      <Pill tone="warn">Dua card</Pill>
                      {block.dua ? <Pill tone="neutral">{block.dua.moduleLabel}</Pill> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {block.dua ? (
                        <Link href={buildLinkedDuaHref(block.dua)} className={styles.inlineWarnButton}>
                          Open dua <ArrowRight size={14} />
                        </Link>
                      ) : null}
                      <button type="button" className={styles.blockActionButton} onClick={() => removeBlock(block.id)}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <Input
                    value={block.title}
                    onChange={(event) =>
                      updateBlock(block.id, () => ({
                        ...block,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Card title"
                  />

                  {block.dua ? (
                    <>
                      {block.dua.arabic ? (
                        <div dir="rtl" className={styles.arabicCard}>
                          {block.dua.arabic}
                        </div>
                      ) : null}
                      {block.dua.transliteration ? (
                        <SupportTextPanel kind="transliteration">
                          {block.dua.transliteration}
                        </SupportTextPanel>
                      ) : null}
                      <SupportTextPanel kind="translation">
                        {block.dua.translation}
                      </SupportTextPanel>
                    </>
                  ) : (
                    <p className={styles.inlineHint}>This dua card needs to be reinserted.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.noteFooter}>
          <div className={styles.noteFooterSection}>
            <p className={styles.toolsLabel}>Tags</p>
            {noteDraft.tags.length > 0 ? (
              <div className={styles.tagRow}>
                {noteDraft.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.tagPill}
                    onClick={() =>
                      updateDraft((current) => ({
                        ...current,
                        tags: current.tags.filter((item) => item !== tag),
                      }))
                    }
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            ) : null}
            <div className={styles.tagComposer}>
              <Input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add a tag like family or sabr"
              />
              <Button variant="secondary" onClick={handleTagAdd}>
                Add tag
              </Button>
            </div>
          </div>

          {noteDraft.type === "dua" ? (
            <div className={styles.noteFooterSection}>
              <p className={styles.toolsLabel}>Dua status</p>
              <div className={styles.toolChipRow}>
                {DUA_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    data-active={noteDraft.duaStatus === option.value ? "1" : "0"}
                    className={styles.filterChip}
                    onClick={() => updateDraft((current) => ({ ...current, duaStatus: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {noteDraft.type === "repentance" ? (
            <div className={styles.noteFooterSection}>
              <p className={styles.toolsLabel}>Delete later</p>
              <div className={styles.toolChipRow}>
                {AUTO_DELETE_PRESETS.map((preset) => (
                  <button
                    key={preset.value || "keep"}
                    type="button"
                    data-active={noteDraft.autoDeletePreset === preset.value ? "1" : "0"}
                    className={styles.filterChip}
                    onClick={() => updateDraft((current) => ({ ...current, autoDeletePreset: preset.value }))}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.noteSaveRow}>
          <p className={styles.privacyNote}>
            {props.syncEnabled
              ? "Private. Saved to your account so it follows you across devices."
              : "Private. Saved only in this browser for now."}
          </p>
          <Button onClick={() => void persistDraft({ collapseAfterSave: true })} disabled={!canSave || isBusy}>
            <Save size={16} />
            {isSaving ? "Saving..." : "Save note"}
          </Button>
        </div>
      </Card>
    );
  };

  const renderCollapsedCard = (entry: JournalEntry) => {
    const pillTone =
      entry.type === "dua"
        ? "warn"
        : entry.type === "repentance"
          ? "danger"
          : entry.type === "gratitude"
            ? "success"
            : "accent";

    return (
      <button
        key={entry.id}
        type="button"
        disabled={isBusy}
        className={styles.noteCardButton}
        onClick={() => void handleOpenEntry(entry)}
      >
        <Card className={styles.noteCard}>
          <div className={styles.noteHeader}>
            <div className={styles.noteTopRow}>
              <div className={styles.richCardPills}>
                <Pill tone={pillTone}>{entry.type}</Pill>
                {entry.pinned ? <Pill tone="neutral">Pinned</Pill> : null}
              </div>
              <span className={styles.expandHint}>
                Open <ChevronDown size={14} />
              </span>
            </div>

            <div>
              <h2 className={styles.noteTitle}>{entry.title?.trim() || "Untitled note"}</h2>
              <p className={styles.notePreview}>{buildEntryPreview(entry)}</p>
            </div>
          </div>

          <div className={styles.noteMetaRow}>
            <span>{formatJournalTimestamp(entry.updatedAt)}</span>
            {entry.autoDeleteAt ? <span>Auto-deletes in {formatAutoDeleteCountdown(entry)}</span> : null}
          </div>
        </Card>
      </button>
    );
  };

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Private"
        title="Journal"
        subtitle={
          props.syncEnabled
            ? "A private place for reflections, linked ayahs, and personal duas that stay with your account."
            : "A private place for reflections, linked ayahs, and personal duas that stay on this device for now."
        }
      />

      {expandedEntryId === null ? (
        <div className={styles.searchBar}>
          <label className="sr-only" htmlFor="journal-search">
            Search notes
          </label>
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--kw-faint)]"
          />
          <Input
            id="journal-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search titles, tags, or note text"
            className="pl-12"
          />
        </div>
      ) : null}

      <div className={styles.noteList}>
        {!isLoaded ? (
          <Card className={styles.emptyCard}>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Loading your journal...</p>
          </Card>
        ) : null}

        {isLoaded && expandedEntryId === "new" && draft ? renderExpandedCard(draft, true) : null}

        {isLoaded && filteredEntries.length === 0 && expandedEntryId !== "new" ? (
          <Card className={styles.emptyCard}>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
              {search.trim().length > 0 ? "Nothing matches that search yet." : "No notes yet."}
            </p>
            <p className={styles.emptyText}>
              {search.trim().length > 0
                ? "Try a different word or start a new note."
                : "Start a note, then add text, ayah cards, or dua cards where they belong."}
            </p>
          </Card>
        ) : null}

        {filteredEntries.map((entry) =>
          draft && expandedEntryId === entry.id && draft.id === entry.id
            ? renderExpandedCard(draft, false)
            : renderCollapsedCard(entry),
        )}
      </div>

      <button type="button" className={styles.fab} onClick={() => void handleCreateNew("reflection")}>
        <Plus size={24} />
        <span className="sr-only">New note</span>
      </button>
    </div>
  );
}
