"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Heart,
  Pin,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import clsx from "clsx";
import { AyahAudioPlayer } from "@/components/audio/ayah-audio-player";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Input, Textarea } from "@/components/ui/input";
import { SupportTextPanel } from "@/components/quran/support-text-panel";
import { useToast } from "@/components/ui/toast";
import {
  JOURNAL_ENTRY_TYPES,
  type JournalDuaStatus,
  type JournalEntry,
  type JournalEntryType,
  type JournalLinkedAyah,
  type JournalLinkedDua,
  buildLinkedAyahHref,
  buildLinkedDuaHref,
  clearJournalEntries,
  createJournalEntryId,
  deleteJournalEntry,
  formatAutoDeleteCountdown,
  formatJournalTimestamp,
  listJournalEntries,
  normalizeJournalTags,
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
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string | null;
  linkedAyah: JournalLinkedAyah | null;
  linkedDua: JournalLinkedDua | null;
  duaStatus: JournalDuaStatus;
  autoDeletePreset: "" | "1" | "3" | "7" | "30";
};

type AyahCardData = {
  id: number;
  surahNumber: number;
  ayahNumber: number;
  textUthmani: string;
  translation: string | null;
  surahNameArabic: string;
  surahNameTransliteration: string;
};

const TYPE_META: Record<
  JournalEntryType,
  {
    label: string;
    tone: "accent" | "warn" | "danger" | "success" | "neutral";
    promptLabel: string;
    prompts: readonly string[];
    detail: string;
  }
> = {
  reflection: {
    label: "Reflection",
    tone: "accent",
    promptLabel: "Reflective",
    prompts: [
      "This ayah reminded me that...",
      "Today I realized...",
      "A question I still carry is...",
    ],
    detail: "Thoughts, lessons, and what you are noticing.",
  },
  dua: {
    label: "Dua",
    tone: "warn",
    promptLabel: "Prayerful",
    prompts: [
      "Ya Allah, I ask You for...",
      "Please guide me in...",
      "Make a way for me through...",
    ],
    detail: "Private requests, hopes, and answered duas.",
  },
  repentance: {
    label: "Repentance",
    tone: "danger",
    promptLabel: "Private",
    prompts: [
      "Ya Allah, I seek Your forgiveness for...",
      "I am struggling with...",
      "Help me leave behind...",
    ],
    detail: "For tawbah, struggle, and what you want to leave behind.",
  },
  gratitude: {
    label: "Gratitude",
    tone: "success",
    promptLabel: "Thankful",
    prompts: [
      "Alhamdulillah for...",
      "Today I am grateful that...",
      "Allah opened a door for me through...",
    ],
    detail: "Blessings, mercies, and answered duas you do not want to miss.",
  },
  free: {
    label: "Free note",
    tone: "neutral",
    promptLabel: "Open",
    prompts: [
      "What is sitting on my heart tonight?",
      "What do I need to say honestly?",
      "What should I not leave unspoken today?",
    ],
    detail: "A blank note for anything that does not need a category first.",
  },
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

function createEmptyDraft(type: JournalEntryType = "reflection"): JournalDraft {
  return {
    id: null,
    type,
    content: "",
    tags: [],
    pinned: false,
    createdAt: null,
    linkedAyah: null,
    linkedDua: null,
    duaStatus: "ongoing",
    autoDeletePreset: "",
  };
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

function draftFromEntry(entry: JournalEntry): JournalDraft {
  return {
    id: entry.id,
    type: entry.type,
    content: entry.content,
    tags: entry.tags,
    pinned: entry.pinned,
    createdAt: entry.createdAt,
    linkedAyah: entry.linkedAyah ?? null,
    linkedDua: entry.linkedDua ?? null,
    duaStatus: entry.duaStatus ?? "ongoing",
    autoDeletePreset: inferAutoDeletePreset(entry),
  };
}

function buildPreview(entry: Pick<JournalEntry, "content" | "linkedAyah" | "linkedDua">): string {
  const trimmed = entry.content.trim();
  if (!trimmed) {
    if (entry.linkedDua?.translation) {
      return entry.linkedDua.translation.length > 180
        ? `${entry.linkedDua.translation.slice(0, 177)}...`
        : entry.linkedDua.translation;
    }
    if (entry.linkedAyah) {
      return `Attached ayah from ${entry.linkedAyah.surahNameTransliteration} ${entry.linkedAyah.surahNumber}:${entry.linkedAyah.ayahNumber}.`;
    }
    return "Nothing written yet.";
  }
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
}

function hasMeaningfulDraftContent(draft: JournalDraft): boolean {
  return Boolean(draft.content.trim().length > 0 || draft.tags.length > 0 || draft.linkedAyah || draft.linkedDua);
}

function shouldShowAdvancedOptions(draft: JournalDraft): boolean {
  return Boolean(
    draft.linkedAyah ||
      draft.linkedDua ||
      draft.tags.length > 0 ||
      draft.type === "dua" ||
      draft.type === "repentance",
  );
}

function buildEntrySections(entries: JournalEntry[]): Array<{ label: string; entries: JournalEntry[] }> {
  const sections = new Map<string, JournalEntry[]>();
  const now = Date.now();

  for (const entry of entries) {
    const updatedAt = new Date(entry.updatedAt).getTime();
    const isRecent = !Number.isNaN(updatedAt) && now - updatedAt <= 7 * 24 * 60 * 60 * 1000;
    const label = isRecent ? "This week" : "Earlier";
    const bucket = sections.get(label);
    if (bucket) {
      bucket.push(entry);
    } else {
      sections.set(label, [entry]);
    }
  }

  return Array.from(sections, ([label, sectionEntries]) => ({
    label,
    entries: sectionEntries,
  }));
}

function buildLinkedAyah(surahs: SurahOption[], surahNumber: number, ayahNumber: number): JournalLinkedAyah | null {
  const surah = surahs.find((item) => item.surahNumber === surahNumber);
  if (!surah) {
    return null;
  }
  const boundedAyah = Math.min(Math.max(ayahNumber, 1), surah.ayahCount);
  return {
    ayahId: surah.startAyahId + boundedAyah - 1,
    surahNumber: surah.surahNumber,
    ayahNumber: boundedAyah,
    surahNameArabic: surah.nameArabic,
    surahNameTransliteration: surah.nameTransliteration,
  };
}

function buildDuaOptionValue(linkedDua: Pick<JournalLinkedDua, "moduleId" | "stepId">): string {
  return `${linkedDua.moduleId}::${linkedDua.stepId}`;
}

function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
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
  const [draft, setDraft] = useState<JournalDraft>(() => createEmptyDraft());
  const [isDirty, setIsDirty] = useState(false);
  const [isLoaded, setIsLoaded] = useState(() => props.syncEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [ayahForm, setAyahForm] = useState(() => ({
    surahNumber: props.surahs[0]?.surahNumber ?? 1,
    ayahNumber: 1,
  }));
  const [duaFormValue, setDuaFormValue] = useState(() =>
    props.duaOptions[0] ? buildDuaOptionValue(props.duaOptions[0]) : "",
  );
  const [ayahCardById, setAyahCardById] = useState<Record<number, AyahCardData>>({});
  const [ayahCardErrorById, setAyahCardErrorById] = useState<Record<number, string>>({});
  const [ayahCardLoadingId, setAyahCardLoadingId] = useState<number | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const activeTypeMeta = TYPE_META[draft.type];
  const selectedSurah = props.surahs.find((surah) => surah.surahNumber === ayahForm.surahNumber) ?? props.surahs[0];
  const selectedDuaOption =
    props.duaOptions.find((option) => buildDuaOptionValue(option) === duaFormValue) ?? props.duaOptions[0] ?? null;
  const hasDraftContent = hasMeaningfulDraftContent(draft);
  const canSave = hasDraftContent && (!draft.id || isDirty);
  const isBusy = isSaving || isDeleting;
  const pinnedCount = entries.filter((entry) => entry.pinned).length;
  const currentAyahCard = draft.linkedAyah ? ayahCardById[draft.linkedAyah.ayahId] ?? null : null;
  const currentAyahCardError = draft.linkedAyah ? ayahCardErrorById[draft.linkedAyah.ayahId] ?? null : null;
  const isCurrentAyahCardLoading = draft.linkedAyah ? ayahCardLoadingId === draft.linkedAyah.ayahId : false;

  const filteredEntries = entries.filter((entry) => {
    if (!deferredSearch) {
      return true;
    }
    const haystack = [
      entry.content,
      entry.tags.join(" "),
      entry.linkedAyah?.surahNameTransliteration ?? "",
      entry.linkedAyah ? `${entry.linkedAyah.surahNumber}:${entry.linkedAyah.ayahNumber}` : "",
      entry.linkedDua?.title ?? "",
      entry.linkedDua?.label ?? "",
      entry.linkedDua?.translation ?? "",
      entry.linkedDua?.moduleLabel ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(deferredSearch);
  });
  const entrySections = buildEntrySections(filteredEntries);

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

  const persistDraft = async (quiet = false): Promise<JournalEntry | null> => {
    if (!hasMeaningfulDraftContent(draft)) {
      setIsDirty(false);
      return null;
    }
    const now = new Date();
    if (draft.pinned && pinnedCount >= 10 && !entries.find((entry) => entry.id === draft.id)?.pinned) {
      pushToast({
        tone: "warning",
        title: "Pin limit reached",
        message: "Keep at most 10 pinned entries so the top of the journal stays useful.",
      });
      return null;
    }

    const autoDeleteAt =
      draft.type === "repentance" && draft.autoDeletePreset
        ? new Date(now.getTime() + Number(draft.autoDeletePreset) * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const nextEntry = {
      id: draft.id,
      type: draft.type,
      content: draft.content,
      tags: draft.tags,
      pinned: draft.pinned,
      createdAt: draft.createdAt ?? now.toISOString(),
      updatedAt: now.toISOString(),
      linkedAyah: draft.linkedAyah,
      linkedDua: draft.linkedDua,
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

    setDraft(draftFromEntry(savedEntry));
    setAyahForm({
      surahNumber: savedEntry.linkedAyah?.surahNumber ?? (props.surahs[0]?.surahNumber ?? 1),
      ayahNumber: savedEntry.linkedAyah?.ayahNumber ?? 1,
    });
    setDuaFormValue(
      savedEntry.linkedDua
        ? buildDuaOptionValue(savedEntry.linkedDua)
        : props.duaOptions[0]
          ? buildDuaOptionValue(props.duaOptions[0])
          : "",
    );
    setIsDirty(false);
    if (!quiet) {
      pushToast({
        tone: "success",
        title: draft.id ? "Entry updated" : "Entry saved",
        message: props.syncEnabled
          ? "This note is now saved to your account."
          : "Your writing stays in this browser unless you remove it.",
      });
    }
    return savedEntry;
  };

  const maybePersistBeforeSwitch = async () => {
    if (!isDirty) {
      return true;
    }
    if (!hasMeaningfulDraftContent(draft)) {
      setIsDirty(false);
      return true;
    }
    const savedEntry = await persistDraft(true);
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
    const ayahId = draft.linkedAyah?.ayahId;
    if (!ayahId || ayahCardById[ayahId] || ayahCardLoadingId === ayahId) {
      return;
    }

    let cancelled = false;
    setAyahCardLoadingId(ayahId);

    void (async () => {
      try {
        const response = await fetch(`/api/quran/ayah-card?ayahId=${encodeURIComponent(String(ayahId))}`);
        const payload = await readApiJson<{ ok: true; ayah: AyahCardData }>(response);
        if (cancelled) {
          return;
        }
        setAyahCardById((current) => ({
          ...current,
          [ayahId]: payload.ayah,
        }));
        setAyahCardErrorById((current) => {
          if (!(ayahId in current)) {
            return current;
          }
          const next = { ...current };
          delete next[ayahId];
          return next;
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setAyahCardErrorById((current) => ({
          ...current,
          [ayahId]: error instanceof Error ? error.message : "Could not load this ayah right now.",
        }));
      } finally {
        if (!cancelled) {
          setAyahCardLoadingId((current) => (current === ayahId ? null : current));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ayahCardById, ayahCardLoadingId, draft.linkedAyah?.ayahId]);

  const updateDraft = (updater: (current: JournalDraft) => JournalDraft) => {
    startTransition(() => {
      setDraft((current) => updater(current));
      setIsDirty(true);
    });
  };

  const handleCreateNew = async (type: JournalEntryType = draft.type) => {
    const shouldContinue = await maybePersistBeforeSwitch();
    if (!shouldContinue) {
      return;
    }
    startTransition(() => {
      setDraft(createEmptyDraft(type));
      setAyahForm({
        surahNumber: props.surahs[0]?.surahNumber ?? 1,
        ayahNumber: 1,
      });
      setDuaFormValue(props.duaOptions[0] ? buildDuaOptionValue(props.duaOptions[0]) : "");
      setTagInput("");
      setShowAdvanced(false);
      setIsDirty(false);
    });
  };

  const handleSelectEntry = async (entry: JournalEntry) => {
    const shouldContinue = await maybePersistBeforeSwitch();
    if (!shouldContinue) {
      return;
    }
    const nextDraft = draftFromEntry(entry);
    startTransition(() => {
      setDraft(nextDraft);
      setAyahForm({
        surahNumber: entry.linkedAyah?.surahNumber ?? (props.surahs[0]?.surahNumber ?? 1),
        ayahNumber: entry.linkedAyah?.ayahNumber ?? 1,
      });
      setDuaFormValue(
        entry.linkedDua
          ? buildDuaOptionValue(entry.linkedDua)
          : props.duaOptions[0]
            ? buildDuaOptionValue(props.duaOptions[0])
            : "",
      );
      setTagInput("");
      setShowAdvanced(shouldShowAdvancedOptions(nextDraft));
      setIsDirty(false);
    });
  };

  const handleDeleteCurrent = async () => {
    if (!draft.id) {
      await handleCreateNew(draft.type);
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

    setDraft(createEmptyDraft(draft.type));
    setAyahForm({
      surahNumber: props.surahs[0]?.surahNumber ?? 1,
      ayahNumber: 1,
    });
    setDuaFormValue(props.duaOptions[0] ? buildDuaOptionValue(props.duaOptions[0]) : "");
    setTagInput("");
    setShowAdvanced(false);
    setIsDirty(false);
    pushToast({
      tone: "warning",
      title: "Entry removed",
      message: props.syncEnabled
        ? "That journal entry was removed from your account."
        : "That journal entry was removed from this browser.",
    });
  };

  const handleTagAdd = () => {
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

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    updateDraft((current) => ({ ...current, content: value }));
  };

  const applyPrompt = (prompt: string) => {
    updateDraft((current) => {
      const nextContent = current.content.trim().length
        ? `${current.content.trim()}\n\n${prompt}`
        : prompt;
      return { ...current, content: nextContent };
    });
  };

  const attachAyah = () => {
    const linkedAyah = buildLinkedAyah(props.surahs, ayahForm.surahNumber, ayahForm.ayahNumber);
    if (!linkedAyah) {
      return;
    }
    updateDraft((current) => ({ ...current, linkedAyah }));
    pushToast({
      tone: "success",
      title: "Ayah linked",
      message: `${linkedAyah.surahNameTransliteration} ${linkedAyah.surahNumber}:${linkedAyah.ayahNumber} is now attached to this entry.`,
    });
  };

  const removeLinkedAyah = () => {
    updateDraft((current) => ({ ...current, linkedAyah: null }));
  };

  const attachDua = () => {
    if (!selectedDuaOption) {
      pushToast({
        tone: "warning",
        title: "No dua available",
        message: "There is no attachable dua card in your library yet.",
      });
      return;
    }
    updateDraft((current) => ({ ...current, linkedDua: selectedDuaOption }));
    pushToast({
      tone: "success",
      title: "Dua attached",
      message: `${selectedDuaOption.title} is now attached to this entry.`,
    });
  };

  const removeLinkedDua = () => {
    updateDraft((current) => ({ ...current, linkedDua: null }));
  };

  const scrollToComposer = () => {
    window.setTimeout(() => {
      document.getElementById("journal-composer")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const handleStartWriting = async (type: JournalEntryType = "reflection") => {
    await handleCreateNew(type);
    scrollToComposer();
  };

  const handleOpenEntry = async (entry: JournalEntry) => {
    await handleSelectEntry(entry);
    scrollToComposer();
  };

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Private"
        title="Journal"
        subtitle={
          props.syncEnabled
            ? "Search your notes or write a new one. Saved to your account and available on your devices."
            : "Search your notes or write a new one. Everything stays on this device for now."
        }
      />

      <div className={styles.searchBar}>
        <label className="sr-only" htmlFor="journal-search">
          Search entries
        </label>
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--kw-faint)]"
        />
        <Input
          id="journal-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search entries..."
          className="pl-12"
        />
      </div>

      <div className={styles.layout}>
        <Card id="journal-composer" className={clsx("kw-fade-in", styles.editorShell)}>
          <div className={styles.editorHeader}>
            <div>
              <p className={styles.editorEyebrow}>{draft.id ? "Open note" : "New note"}</p>
              <h2 className={styles.editorTitle}>{draft.id ? "Keep writing" : "Write something quietly"}</h2>
              <p className={styles.editorText}>
                {draft.id
                  ? isDirty
                    ? "You have changes that are not saved yet."
                    : props.syncEnabled
                      ? "This note is already saved to your account."
                      : "This note is already saved on this device."
                  : hasDraftContent
                    ? "This is a new note. Save it when you are ready."
                    : props.syncEnabled
                      ? "Pick a type, write what you need to write, then save it to your account."
                      : "Pick a type, write what you need to write, then save it."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={isBusy}
                onClick={() => updateDraft((current) => ({ ...current, pinned: !current.pinned }))}
              >
                <Pin size={16} />
                {draft.pinned ? "Unpin" : "Pin"}
              </Button>
              <Button variant="danger" disabled={isBusy} onClick={() => void handleDeleteCurrent()}>
                <Trash2 size={16} />
                {draft.id ? "Delete" : "Clear"}
              </Button>
            </div>
          </div>

          <div className={styles.typeRow}>
            {JOURNAL_ENTRY_TYPES.map((type) => {
              const meta = TYPE_META[type];
              const active = draft.type === type;

              return (
                <button
                  key={type}
                  type="button"
                  data-active={active ? "1" : "0"}
                  disabled={isBusy}
                  className={styles.typeButton}
                  onClick={() => {
                    setShowAdvanced((current) =>
                      current || type === "dua" || type === "repentance" || shouldShowAdvancedOptions(draft),
                    );
                    updateDraft((current) => ({
                      ...current,
                      type,
                      duaStatus: type === "dua" ? current.duaStatus : "ongoing",
                      autoDeletePreset: type === "repentance" ? current.autoDeletePreset : "",
                    }));
                  }}
                >
                  <span className={styles.entryDot} data-tone={type} />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {draft.content.trim().length === 0 ? (
            <div className={styles.promptRail}>
              {activeTypeMeta.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className={styles.promptButton}
                  onClick={() => applyPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <Textarea
            value={draft.content}
            onChange={handleContentChange}
            placeholder={activeTypeMeta.prompts[0]}
            className="min-h-[280px] text-[15px] leading-8 sm:min-h-[340px]"
          />

          <div className={styles.editorActions}>
            <p className={styles.privacyNote}>
              {props.syncEnabled
                ? "Private. Saved to your account so it is there on your other devices."
                : "Private. Saved only in this browser for now."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={isBusy} onClick={() => void handleStartWriting("reflection")}>
                <Plus size={16} />
                Start fresh
              </Button>
              <Button onClick={() => void persistDraft(false)} disabled={!canSave || isBusy}>
                <Save size={16} />
                {isSaving ? "Saving..." : "Save note"}
              </Button>
            </div>
          </div>

          <div className={styles.advancedShell}>
            <button
              type="button"
              className={styles.advancedToggle}
              onClick={() => setShowAdvanced((current) => !current)}
            >
              {showAdvanced ? "Hide extra options" : "More options"}
            </button>

            {showAdvanced ? (
              <div className={styles.advancedBody}>
                <p className={styles.advancedHint}>Use these only if they help. You can ignore them.</p>

                <div className={styles.quietCard}>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Attach an ayah</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]">
                    <select
                      value={ayahForm.surahNumber}
                      onChange={(event) =>
                        setAyahForm({
                          surahNumber: Number(event.target.value),
                          ayahNumber: 1,
                        })
                      }
                      className="h-11 w-full rounded-2xl border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 text-sm text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] transition focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus:bg-[color:var(--kw-surface-strong)] focus:outline-none"
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
                      max={selectedSurah?.ayahCount ?? 286}
                      value={String(ayahForm.ayahNumber)}
                      onChange={(event) =>
                        setAyahForm((current) => ({
                          ...current,
                          ayahNumber: Number(event.target.value || 1),
                        }))
                      }
                    />
                    <Button variant="secondary" onClick={attachAyah}>
                      <BookOpenText size={16} />
                      Add ayah
                    </Button>
                  </div>

                  {draft.linkedAyah ? (
                    <div className={styles.richAttachmentCard}>
                      <div className={styles.attachmentHeader}>
                        <div className={styles.attachmentPills}>
                          <Pill tone="accent">Ayah card</Pill>
                          <Pill tone="neutral">
                            {draft.linkedAyah.surahNameTransliteration} {draft.linkedAyah.surahNumber}:
                            {draft.linkedAyah.ayahNumber}
                          </Pill>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={buildLinkedAyahHref(draft.linkedAyah)}
                            className="inline-flex items-center gap-2 rounded-[14px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
                          >
                            Open in reader <ArrowRight size={14} />
                          </Link>
                          <Button variant="ghost" onClick={removeLinkedAyah}>
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className={styles.attachmentBody}>
                        <div>
                          <p className={styles.attachmentTitle}>
                            {draft.linkedAyah.surahNameTransliteration} {draft.linkedAyah.surahNumber}:
                            {draft.linkedAyah.ayahNumber}
                          </p>
                          <p className={styles.attachmentSubtle}>{draft.linkedAyah.surahNameArabic}</p>
                        </div>

                        <div dir="rtl" className={styles.ayahArabic}>
                          {currentAyahCard?.textUthmani ??
                            (isCurrentAyahCardLoading ? "Loading ayah..." : "Ayah text unavailable right now.")}
                        </div>

                        <AyahAudioPlayer
                          ayahId={draft.linkedAyah.ayahId}
                          reciterId={props.reciterId}
                          speedPrefKey="hifzer_journal_ayah_audio_speed_v1"
                          className={styles.ayahAudio}
                        />

                        <SupportTextPanel
                          kind="translation"
                          dir={props.translationDir}
                          alignClassName={props.translationAlignClass}
                        >
                          {currentAyahCard?.translation ??
                            currentAyahCardError ??
                            (isCurrentAyahCardLoading
                              ? "Loading translation..."
                              : "Translation unavailable right now.")}
                        </SupportTextPanel>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className={styles.quietCard}>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Attach a dua card</p>
                  {props.duaOptions.length > 0 ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <select
                        value={duaFormValue}
                        onChange={(event) => setDuaFormValue(event.target.value)}
                        className="h-11 w-full rounded-2xl border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-3 text-sm text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] transition focus:border-[rgba(var(--kw-accent-rgb),0.55)] focus:bg-[color:var(--kw-surface-strong)] focus:outline-none"
                      >
                        {props.duaOptions.map((option) => (
                          <option key={buildDuaOptionValue(option)} value={buildDuaOptionValue(option)}>
                            {option.moduleLabel}: {option.title}
                          </option>
                        ))}
                      </select>
                      <Button variant="secondary" onClick={attachDua}>
                        <Heart size={16} />
                        Add dua
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                      Open the Dua section first if you want more attachable cards here.
                    </p>
                  )}

                  {draft.linkedDua ? (
                    <div className={styles.richAttachmentCard}>
                      <div className={styles.attachmentHeader}>
                        <div className={styles.attachmentPills}>
                          <Pill tone="warn">Dua card</Pill>
                          <Pill tone="neutral">{draft.linkedDua.moduleLabel}</Pill>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={buildLinkedDuaHref(draft.linkedDua)}
                            className="inline-flex items-center gap-2 rounded-[14px] border border-[rgba(245,158,11,0.24)] bg-[rgba(245,158,11,0.12)] px-3 py-2 text-sm font-semibold text-[rgba(180,83,9,1)]"
                          >
                            Open module <ArrowRight size={14} />
                          </Link>
                          <Button variant="ghost" onClick={removeLinkedDua}>
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className={styles.attachmentBody}>
                        <div>
                          <p className={styles.attachmentTitle}>{draft.linkedDua.title}</p>
                          <p className={styles.attachmentSubtle}>{draft.linkedDua.label}</p>
                        </div>

                        {draft.linkedDua.arabic ? (
                          <div dir="rtl" className={styles.duaArabic}>
                            {draft.linkedDua.arabic}
                          </div>
                        ) : null}

                        {draft.linkedDua.transliteration ? (
                          <SupportTextPanel kind="transliteration">
                            {draft.linkedDua.transliteration}
                          </SupportTextPanel>
                        ) : null}

                        <SupportTextPanel kind="translation">
                          {draft.linkedDua.translation}
                        </SupportTextPanel>

                        {draft.linkedDua.sourceLabel && draft.linkedDua.sourceHref ? (
                          <p className={styles.attachmentSource}>
                            Source:{" "}
                            <Link href={draft.linkedDua.sourceHref} className={styles.inlineLink}>
                              {draft.linkedDua.sourceLabel}
                            </Link>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className={styles.quietCard}>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Tags</p>
                  {draft.tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {draft.tags.map((tag) => (
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Input
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Add a tag like family or sabr"
                      className="min-w-[220px] flex-1"
                    />
                    <Button variant="secondary" onClick={handleTagAdd}>
                      Add tag
                    </Button>
                  </div>
                </div>

                {draft.type === "dua" ? (
                  <div className={styles.quietCard}>
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Dua status</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {DUA_STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          data-active={draft.duaStatus === option.value ? "1" : "0"}
                          className={styles.filterChip}
                          onClick={() => updateDraft((current) => ({ ...current, duaStatus: option.value }))}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {draft.type === "repentance" ? (
                  <div className={styles.quietCard}>
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Delete this later</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {AUTO_DELETE_PRESETS.map((preset) => (
                        <button
                          key={preset.value || "keep"}
                          type="button"
                          data-active={draft.autoDeletePreset === preset.value ? "1" : "0"}
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
            ) : null}
          </div>
        </Card>

        <Card className={clsx("kw-fade-in", styles.listShell)}>
          {!isLoaded ? (
            <div className={styles.emptyCard}>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Loading your journal...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className={styles.emptyCard}>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                {search.trim().length > 0 ? "Nothing matches that search yet." : "No notes yet."}
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                {search.trim().length > 0
                  ? "Try a different word or start a new note."
                  : "Tap the add button and write your first note."}
              </p>
            </div>
          ) : (
            entrySections.map((section) => (
              <section key={section.label} className={styles.section}>
                <p className={styles.sectionLabel}>{section.label}</p>
                <div className={styles.entryList}>
                  {section.entries.map((entry) => {
                    const meta = TYPE_META[entry.type];
                    const active = draft.id === entry.id;

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        data-active={active ? "1" : "0"}
                        disabled={isBusy}
                        className={styles.entryButton}
                        onClick={() => void handleOpenEntry(entry)}
                      >
                        <div className={styles.entryHeader}>
                          <div className={styles.entryType}>
                            <span className={styles.entryDot} data-tone={entry.type} />
                            <span>{meta.label}</span>
                          </div>
                          {entry.pinned ? <Pin size={14} className={styles.entryPin} /> : null}
                        </div>

                        <p className={styles.entryPreview}>{buildPreview(entry)}</p>

                        {entry.linkedAyah || entry.linkedDua ? (
                          <div className={styles.entryAttachmentRow}>
                            {entry.linkedAyah ? (
                              <span className={styles.entryAttachmentPill}>
                                Ayah: {entry.linkedAyah.surahNameTransliteration} {entry.linkedAyah.surahNumber}:
                                {entry.linkedAyah.ayahNumber}
                              </span>
                            ) : null}
                            {entry.linkedDua ? (
                              <span className={styles.entryAttachmentPill}>Dua: {entry.linkedDua.title}</span>
                            ) : null}
                          </div>
                        ) : null}

                        <div className={styles.entryMeta}>
                          <span>{formatJournalTimestamp(entry.updatedAt)}</span>
                          {entry.autoDeleteAt ? (
                            <span>Auto-deletes in {formatAutoDeleteCountdown(entry)}</span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </Card>
      </div>

      <button type="button" className={styles.fab} onClick={() => void handleStartWriting("reflection")}>
        <Plus size={24} />
        <span className="sr-only">New note</span>
      </button>
    </div>
  );
}
