"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  HandHeart,
  LockKeyhole,
  Pin,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import clsx from "clsx";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import {
  JOURNAL_ENTRY_TYPES,
  type JournalDuaStatus,
  type JournalEntry,
  type JournalEntryType,
  type JournalLinkedAyah,
  buildLinkedAyahHref,
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
  duaStatus: JournalDuaStatus;
  autoDeletePreset: "" | "1" | "3" | "7" | "30";
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
    duaStatus: entry.duaStatus ?? "ongoing",
    autoDeletePreset: inferAutoDeletePreset(entry),
  };
}

function buildPreview(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) {
    return "Nothing written yet.";
  }
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
}

function hasMeaningfulDraftContent(draft: JournalDraft): boolean {
  return Boolean(
    draft.content.trim().length > 0 ||
      draft.tags.length > 0 ||
      draft.linkedAyah,
  );
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

export function JournalClient(props: { surahs: SurahOption[] }) {
  const { pushToast } = useToast();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [draft, setDraft] = useState<JournalDraft>(() => createEmptyDraft());
  const [isDirty, setIsDirty] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | JournalEntryType>("all");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [ayahForm, setAyahForm] = useState(() => ({
    surahNumber: props.surahs[0]?.surahNumber ?? 1,
    ayahNumber: 1,
  }));
  const isSanctuaryMode = false;
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const activeTypeMeta = TYPE_META[draft.type];
  const selectedSurah = props.surahs.find((surah) => surah.surahNumber === ayahForm.surahNumber) ?? props.surahs[0];
  const hasDraftContent = hasMeaningfulDraftContent(draft);
  const canSave = hasDraftContent && (!draft.id || isDirty);
  const pinnedCount = entries.filter((entry) => entry.pinned).length;
  const activeDuaCount = entries.filter(
    (entry) => entry.type === "dua" && (entry.duaStatus ?? "ongoing") === "ongoing",
  ).length;
  const scheduledReleaseCount = entries.filter((entry) => Boolean(entry.autoDeleteAt)).length;

  const filteredEntries = entries.filter((entry) => {
    if (showPinnedOnly && !entry.pinned) {
      return false;
    }
    if (typeFilter !== "all" && entry.type !== typeFilter) {
      return false;
    }
    if (!deferredSearch) {
      return true;
    }
    const haystack = [
      entry.content,
      entry.tags.join(" "),
      entry.linkedAyah?.surahNameTransliteration ?? "",
      entry.linkedAyah ? `${entry.linkedAyah.surahNumber}:${entry.linkedAyah.ayahNumber}` : "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(deferredSearch);
  });

  const scheduleSanctuaryMode = () => {};
  const resetSanctuaryMode = () => {};

  const persistDraft = (quiet = false): JournalEntry | null => {
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

    const nextEntry: JournalEntry = {
      id: draft.id ?? createJournalEntryId(now),
      type: draft.type,
      content: draft.content,
      tags: draft.tags,
      pinned: draft.pinned,
      createdAt: draft.createdAt ?? now.toISOString(),
      updatedAt: now.toISOString(),
      linkedAyah: draft.linkedAyah,
      duaStatus: draft.type === "dua" ? draft.duaStatus : null,
      autoDeleteAt,
    };

    const nextEntries = upsertJournalEntry(nextEntry, now);
    setEntries(nextEntries);
    setDraft(draftFromEntry(nextEntry));
    setAyahForm({
      surahNumber: nextEntry.linkedAyah?.surahNumber ?? (props.surahs[0]?.surahNumber ?? 1),
      ayahNumber: nextEntry.linkedAyah?.ayahNumber ?? 1,
    });
    setIsDirty(false);
    if (!quiet) {
      pushToast({
        tone: "success",
        title: draft.id ? "Entry updated" : "Entry saved",
        message: "Your writing stays in this browser unless you remove it.",
      });
    }
    return nextEntry;
  };

  const maybePersistBeforeSwitch = () => {
    if (!isDirty) {
      return;
    }
    persistDraft(true);
  };

  useEffect(() => {
    const loadedEntries = listJournalEntries();
    setEntries(loadedEntries);
    if (loadedEntries[0]) {
      const first = loadedEntries[0];
      setDraft(draftFromEntry(first));
      setAyahForm({
        surahNumber: first.linkedAyah?.surahNumber ?? (props.surahs[0]?.surahNumber ?? 1),
        ayahNumber: first.linkedAyah?.ayahNumber ?? 1,
      });
    }
    setIsLoaded(true);
  }, [props.surahs]);

  const updateDraft = (updater: (current: JournalDraft) => JournalDraft) => {
    startTransition(() => {
      setDraft((current) => updater(current));
      setIsDirty(true);
    });
  };

  const handleCreateNew = (type: JournalEntryType = draft.type) => {
    maybePersistBeforeSwitch();
    resetSanctuaryMode();
    startTransition(() => {
      setDraft(createEmptyDraft(type));
      setAyahForm({
        surahNumber: props.surahs[0]?.surahNumber ?? 1,
        ayahNumber: 1,
      });
      setTagInput("");
      setIsDirty(false);
    });
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    maybePersistBeforeSwitch();
    resetSanctuaryMode();
    startTransition(() => {
      setDraft(draftFromEntry(entry));
      setAyahForm({
        surahNumber: entry.linkedAyah?.surahNumber ?? (props.surahs[0]?.surahNumber ?? 1),
        ayahNumber: entry.linkedAyah?.ayahNumber ?? 1,
      });
      setTagInput("");
      setIsDirty(false);
    });
  };

  const handleDeleteCurrent = () => {
    if (!draft.id) {
      handleCreateNew(draft.type);
      return;
    }
    const nextEntries = deleteJournalEntry(draft.id);
    setEntries(nextEntries);
    const next = nextEntries[0];
    if (next) {
      setDraft(draftFromEntry(next));
      setAyahForm({
        surahNumber: next.linkedAyah?.surahNumber ?? (props.surahs[0]?.surahNumber ?? 1),
        ayahNumber: next.linkedAyah?.ayahNumber ?? 1,
      });
    } else {
      setDraft(createEmptyDraft(draft.type));
      setAyahForm({
        surahNumber: props.surahs[0]?.surahNumber ?? 1,
        ayahNumber: 1,
      });
    }
    setIsDirty(false);
    resetSanctuaryMode();
    pushToast({
      tone: "warning",
      title: "Entry removed",
      message: "That journal entry was removed from this browser.",
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
    scheduleSanctuaryMode();
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

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Tool"
        title="Private journal"
        subtitle="Write private notes and duas. Everything here stays on this device for now."
        right={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => handleCreateNew(draft.type)}>
              <Plus size={16} />
              New note
            </Button>
            <Button onClick={() => persistDraft(false)} disabled={!canSave}>
              <Save size={16} />
              Save
            </Button>
          </div>
        )}
      />

      <Card className={`kw-fade-in ${styles.hero}`}>
        <div className={styles.orbA} />
        <div className={styles.orbB} />
        <div className={styles.heroGrid}>
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">Saved on this device</Pill>
              <Pill tone="neutral">Simple flow</Pill>
            </div>
            <h2 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-3xl tracking-tight text-[color:var(--kw-ink)] sm:text-4xl">
              A simpler way to use your journal.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
              Start with the note type, write what you need to write, then save it. If ayah links,
              tags, or delete-later settings help, use them. If not, ignore them.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Pill tone="accent">1. Pick a type</Pill>
              <Pill tone="success">2. Write</Pill>
              <Pill tone="warn">3. Save</Pill>
            </div>
          </div>

          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                Saved notes
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {entries.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
                Write on the left, then save the notes you want to keep.
              </p>
            </div>
            <div className={styles.statCard}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                Ongoing duas
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {activeDuaCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
                Dua notes can stay marked as ongoing until you want to update them.
              </p>
            </div>
            <div className={styles.statCard}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                Delete-later notes
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
                {scheduledReleaseCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
                Repentance notes can be set to disappear later if that helps.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className={styles.layout}>
        <Card
          className={clsx("kw-fade-in", styles.editorShell)}
          data-distraction={isSanctuaryMode ? "1" : "0"}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={activeTypeMeta.tone}>{activeTypeMeta.label}</Pill>
                <Pill tone="neutral">{draft.id ? "Saved note" : "New note"}</Pill>
                {draft.pinned ? <Pill tone="accent">Pinned</Pill> : null}
              </div>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                {draft.id
                  ? isDirty
                    ? "You have changes that are not saved yet."
                    : "This note is already saved."
                  : hasDraftContent
                    ? "This is a new note. Save it when you are ready."
                    : "Pick a note type, write what you need to write, and save it if you want to keep it."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isSanctuaryMode ? (
                <Button variant="secondary" onClick={resetSanctuaryMode}>
                  Restore controls
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => updateDraft((current) => ({ ...current, pinned: !current.pinned }))}
                  >
                    <Pin size={16} />
                    {draft.pinned ? "Unpin" : "Pin note"}
                  </Button>
                  <Button variant="danger" onClick={handleDeleteCurrent}>
                    <Trash2 size={16} />
                    {draft.id ? "Delete" : "Clear"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {!isSanctuaryMode ? (
            <>
              <div className={`${styles.typeGrid} mt-6`}>
                {JOURNAL_ENTRY_TYPES.map((type) => {
                  const meta = TYPE_META[type];
                  const active = draft.type === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      data-active={active ? "1" : "0"}
                      data-tone={type}
                      className={styles.typeButton}
                      onClick={() => {
                        updateDraft((current) => ({
                          ...current,
                          type,
                          duaStatus: type === "dua" ? current.duaStatus : "ongoing",
                          autoDeletePreset: type === "repentance" ? current.autoDeletePreset : "",
                        }));
                      }}
                    >
                      <span className={styles.typeAccent} />
                      <span className="text-sm font-semibold text-[color:var(--kw-ink)]">{meta.label}</span>
                      <span className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">{meta.detail}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                  Start with one of these if it helps
                </p>
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
              </div>
            </>
          ) : null}

          <div className={clsx("mt-6", isSanctuaryMode && "mt-10")}>
            <Textarea
              value={draft.content}
              onChange={handleContentChange}
              onFocus={scheduleSanctuaryMode}
              placeholder={activeTypeMeta.prompts[0]}
              className={clsx(
                "min-h-[280px] text-[15px] leading-8 sm:min-h-[340px]",
                isSanctuaryMode &&
                  "min-h-[440px] border-transparent bg-transparent px-0 py-0 text-base text-white placeholder:text-slate-400 shadow-none focus:border-transparent focus:bg-transparent",
              )}
            />
            <p
              className={clsx(
                "mt-3 text-xs font-semibold uppercase tracking-[0.14em]",
                isSanctuaryMode ? "text-slate-400" : "text-[color:var(--kw-faint)]",
              )}
            >
              {isSanctuaryMode
                ? "Sanctuary mode active. Tap restore when you want the tools back."
                : "You can ignore every extra control below and simply write."}
            </p>
          </div>

          {!isSanctuaryMode ? (
            <>
              <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-4">
                  <div className={styles.quietCard}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Link this note to an ayah</p>
                      <Pill tone="accent">Optional</Pill>
                    </div>
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
                      <div className={`${styles.linkedCard} mt-4`}>
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                            {draft.linkedAyah.surahNameTransliteration} {draft.linkedAyah.surahNumber}:
                            {draft.linkedAyah.ayahNumber}
                          </p>
                          <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
                            {draft.linkedAyah.surahNameArabic}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={buildLinkedAyahHref(draft.linkedAyah)}
                            className="inline-flex items-center gap-2 rounded-[14px] border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.1)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
                          >
                            Open ayah <ArrowRight size={14} />
                          </Link>
                          <Button variant="ghost" onClick={removeLinkedAyah}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.quietCard}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Tags</p>
                      <Pill tone="neutral">Optional</Pill>
                    </div>
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Input
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="Add tags like patience, family, tawakkul"
                        className="min-w-[220px] flex-1"
                      />
                      <Button variant="secondary" onClick={handleTagAdd}>
                        Add tag
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
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
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-[16px] border border-[rgba(225,29,72,0.18)] bg-[rgba(225,29,72,0.1)] text-rose-600">
                          <LockKeyhole size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Delete this later</p>
                          <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                            Repentance notes can be written, kept for a while, then removed from this browser later.
                          </p>
                        </div>
                      </div>
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

                  <div className={styles.quietCard}>
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-[16px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
                        <ShieldCheck size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Privacy note</p>
                        <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                          Everything here stays in this browser for now. It does not sync across devices yet.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                    {draft.id ? "Editing a saved note" : "This new note is not saved yet"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">
                    {draft.id
                      ? "Save again when you want to keep your latest changes."
                      : "Tap Save when you want to keep this note."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => handleCreateNew(draft.type)}>
                    <Plus size={16} />
                    New note
                  </Button>
                  <Button onClick={() => persistDraft(false)} disabled={!canSave}>
                    <Save size={16} />
                    Save
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </Card>

        <Card className={clsx("kw-fade-in", styles.listShell)}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Saved notes</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Search your notes, open one to keep writing, or start a new one.
              </p>
            </div>
            <Button variant="secondary" onClick={() => handleCreateNew(draft.type)}>
              <Plus size={16} />
              New note
            </Button>
          </div>

          <div className="mt-5">
            <label className="sr-only" htmlFor="journal-search">
              Search your notes
            </label>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--kw-faint)]"
              />
              <Input
                id="journal-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your notes"
                className="pl-9"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              data-active={typeFilter === "all" ? "1" : "0"}
              className={styles.filterChip}
              onClick={() => startTransition(() => setTypeFilter("all"))}
            >
              All entries
            </button>
            {JOURNAL_ENTRY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                data-active={typeFilter === type ? "1" : "0"}
                className={styles.filterChip}
                onClick={() => startTransition(() => setTypeFilter(type))}
              >
                {TYPE_META[type].label}
              </button>
            ))}
            <button
              type="button"
              data-active={showPinnedOnly ? "1" : "0"}
              className={styles.filterChip}
              onClick={() => startTransition(() => setShowPinnedOnly((current) => !current))}
            >
              Pinned only
            </button>
          </div>

          <div className={`${styles.entryList} mt-6`}>
            {!isLoaded ? (
              <div className={styles.emptyCard}>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Loading your journal...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className={styles.emptyCard}>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">No saved note matches this search or filter.</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                  Clear the search, change the filter, or start a new note.
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const meta = TYPE_META[entry.type];
                const active = draft.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    data-active={active ? "1" : "0"}
                    data-tone={entry.type}
                    className={styles.entryButton}
                    onClick={() => handleSelectEntry(entry)}
                  >
                    <span className={styles.entryAccent} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill tone={meta.tone}>{meta.label}</Pill>
                          {entry.pinned ? <Pill tone="accent">Pinned</Pill> : null}
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--kw-faint)]">
                          Local only
                        </p>
                      </div>

                      {entry.linkedAyah ? (
                        <p className="mt-3 text-sm font-semibold text-[color:var(--kw-ink)]">
                          {entry.linkedAyah.surahNameTransliteration} {entry.linkedAyah.surahNumber}:
                          {entry.linkedAyah.ayahNumber}
                        </p>
                      ) : null}

                      <p className="mt-3 text-sm leading-7 text-[color:var(--kw-ink)]">
                        {buildPreview(entry.content)}
                      </p>

                      {entry.tags.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {entry.tags.map((tag) => (
                            <span key={tag} className={styles.tagPill}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className={`${styles.metaStrip} mt-4`}>
                        <p>{formatJournalTimestamp(entry.updatedAt)}</p>
                        {entry.autoDeleteAt ? <p>Deletes in {formatAutoDeleteCountdown(entry)}</p> : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-6 rounded-[20px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[16px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.1)] text-[rgba(var(--kw-accent-rgb),1)]">
                <HandHeart size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Quick note</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                  If this page ever feels busy, ignore the extras and use it like a plain private notebook:
                  pick a type, write, and save.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
