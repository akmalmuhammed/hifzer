"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronDown,
  Cloud,
  CloudOff,
  Heart,
  LockKeyhole,
  MoreHorizontal,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Smartphone,
  Sparkles,
  Trash2,
  Type,
  X,
} from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import clsx from "clsx";
import { trackProductEvent } from "@/lib/telemetry/client";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { SaveStatus, resolveSaveStatusState, type SaveDestination } from "@/components/ui/save-status";
import { useToast } from "@/components/ui/toast";
import {
  JOURNAL_ENTRY_TYPES,
  buildLinkedDuaHref,
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
  removeAcknowledgedJournalImportSources,
  type JournalAyahBlock,
  type JournalAyahSnapshot,
  type JournalBlock,
  type JournalDuaStatus,
  type JournalEntry,
  type JournalEntryType,
  type JournalLocalStorageScope,
  type JournalLocalStorageTarget,
  type JournalLocalWriteFailureReason,
  type JournalLinkedDua,
  upsertJournalEntry,
} from "@/hifzer/journal/local-store";
import {
  clearJournalNavigationRecovery,
  readJournalNavigationRecovery,
  writeJournalNavigationRecovery,
  type JournalNavigationRecoveryDraft,
} from "@/hifzer/journal/navigation-recovery";
import { resolveJournalAutoDeleteAt } from "@/hifzer/journal/draft-policy";
import {
  createJournalClientMutationId,
  enqueuePendingJournalMutation,
  listPendingJournalMutations,
  markPendingJournalMutationAttempt,
  markPendingJournalMutationFailure,
  purgeExpiredPendingJournalCreates,
  replacePendingJournalEntryMutationsAtomically,
  removePendingJournalMutation,
  shouldAutomaticallyRetryJournalMutation,
  type JournalAccountStorageTarget,
  type JournalPendingMutation,
  type JournalPendingMutationInput,
  type JournalQueueSnapshot,
} from "@/hifzer/journal/sync-queue";
import {
  findJournalEntryByIdOrOrigin,
  isHydratedJournalEntry,
  journalEntryMatchesId,
  journalPendingMutationEntryId,
  journalPendingMutationMatchesEntry,
  pendingJournalStateForEntry,
  projectPendingJournalMutations,
  resolveJournalConflictAuthority,
} from "@/hifzer/journal/sync-state";
import {
  importLegacyJournalEntries,
  sendPendingJournalMutation,
} from "@/hifzer/journal/sync-transport";
import { syncLocalStateOwner } from "@/hifzer/local/store";
import styles from "./journal.module.css";

const SupportTextPanel = dynamic(
  () => import("@/components/quran/support-text-panel").then((mod) => mod.SupportTextPanel),
  { ssr: false },
);

type SurahOption = {
  surahNumber: number;
  startAyahId: number;
  ayahCount: number;
  nameArabic: string;
  nameTransliteration: string;
  nameEnglish: string;
};

type JournalDraft = JournalNavigationRecoveryDraft;

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

type JournalComposerPayload = {
  ok: true;
  duaOptions: JournalLinkedDua[];
};

type LocalSaveIssue = {
  destination: "account" | "device";
  reason?: JournalLocalWriteFailureReason;
};

type JournalConflict = {
  entryId: string;
  clientMutationId: string;
  mutationType: JournalPendingMutation["type"];
  authoritativeEntry: JournalEntry | null;
  authoritativeEntryKnown: boolean;
};

type JournalQueueFlushResult = {
  syncedEntriesByLocalId: Map<string, JournalEntry>;
  syncedResultsByMutationId: Map<string, JournalEntry | null>;
  conflictedEntryIds: Set<string>;
  remainingMutations: JournalPendingMutation[];
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

const JOURNAL_AUTOSAVE_DELAY_MS = 1100;

const JOURNAL_ENTRY_TYPE_LABELS: Record<JournalEntryType, string> = {
  reflection: "Reflection",
  gratitude: "Gratitude",
  repentance: "Repentance",
  dua: "Dua",
  free: "Free writing",
};

function formatJournalEntryType(type: JournalEntryType): string {
  return JOURNAL_ENTRY_TYPE_LABELS[type];
}

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
    baseVersion: null,
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
    baseVersion: entry.version ?? 1,
    type: entry.type,
    title: entry.title ?? "",
    blocks: Array.isArray(entry.blocks)
      ? entry.blocks.length > 0
        ? ensureTextBlock(entry.blocks)
        : [{ id: "block_text_1", kind: "text", content: "" }]
      : [createTextBlock(entry.content)],
    tags: entry.tags,
    pinned: entry.pinned,
    createdAt: entry.createdAt,
    duaStatus: entry.duaStatus ?? "ongoing",
    autoDeletePreset: inferAutoDeletePreset(entry),
  };
}

function journalDraftPayloadMatchesEntry(draft: JournalDraft, entry: JournalEntry): boolean {
  const durableDraft = draftFromEntry(entry);
  return JSON.stringify({
    type: draft.type,
    title: draft.title,
    blocks: draft.blocks,
    tags: draft.tags,
    pinned: draft.pinned,
    duaStatus: draft.duaStatus,
    autoDeletePreset: draft.autoDeletePreset,
  }) === JSON.stringify({
    type: durableDraft.type,
    title: durableDraft.title,
    blocks: durableDraft.blocks,
    tags: durableDraft.tags,
    pinned: durableDraft.pinned,
    duaStatus: durableDraft.duaStatus,
    autoDeletePreset: durableDraft.autoDeletePreset,
  });
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

function normalizePrefillType(value: string | null): JournalEntryType {
  return JOURNAL_ENTRY_TYPES.includes(value as JournalEntryType) ? (value as JournalEntryType) : "reflection";
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
  initialSyncError: boolean;
  storageOwnerId: string | null;
  translationDir: "ltr" | "rtl";
  translationAlignClass: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const didAttemptLegacyImportRef = useRef(false);
  const didAnnounceSyncRecoveryRef = useRef(!props.initialSyncError);
  const didAnnounceSyncIssueRef = useRef(false);
  const consumedPrefillRef = useRef<string | null>(null);
  const didCheckNavigationRecoveryRef = useRef(false);
  const navigationRecoveryWasRestoredRef = useRef(false);
  const pendingPrefillRetryRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const queueFlushInFlightRef = useRef<Promise<JournalQueueFlushResult> | null>(null);
  const refreshRequestIdRef = useRef(0);
  const journalStateGenerationRef = useRef(0);
  const activeStorageOwnerIdRef = useRef(props.storageOwnerId);
  const pendingMutationsRef = useRef<JournalPendingMutation[]>([]);
  const draftRevisionRef = useRef(0);
  const lastPersistedRevisionRef = useRef(-1);
  const autosaveInFlightRef = useRef(false);
  const persistDraftInFlightRef = useRef<Promise<JournalEntry | null> | null>(null);
  const persistDraftRef = useRef<(
    options?: { quiet?: boolean; collapseAfterSave?: boolean },
  ) => Promise<JournalEntry | null>>(async () => null);
  const navigationSaveInFlightRef = useRef(false);
  const draftSessionIdRef = useRef(0);
  const conflictResolutionInFlightRef = useRef(false);
  const deletionInFlightRef = useRef(false);
  const activeDraftIdRef = useRef<string | null>(null);
  const latestDraftRef = useRef<JournalDraft | null>(null);
  const isDirtyRef = useRef(false);
  const openRequestIdRef = useRef(0);
  const noteMenuRef = useRef<HTMLDivElement>(null);
  const noteMenuButtonRef = useRef<HTMLButtonElement>(null);
  const insertPanelRef = useRef<HTMLDivElement>(null);
  const insertTriggerRef = useRef<HTMLButtonElement>(null);
  const insertComposerRequestIdRef = useRef(0);
  const hydratingAyahIdsRef = useRef(new Set<number>());
  const knownAccountEntryIdsRef = useRef(new Set(props.initialEntries.map((entry) => entry.id)));
  const entriesRef = useRef<JournalEntry[]>(props.initialEntries);
  const legacyImportRecoveryByDisplayIdRef = useRef(new Map<string, JournalEntry>());

  const [accountSyncEnabled, setAccountSyncEnabled] = useState(
    () => props.syncEnabled && !props.initialSyncError,
  );
  const [duaOptions, setDuaOptions] = useState<JournalLinkedDua[]>(() => props.duaOptions);
  const [entries, setEntries] = useState<JournalEntry[]>(() => sortEntries(props.initialEntries));
  activeStorageOwnerIdRef.current = props.storageOwnerId;
  entriesRef.current = entries;
  const [draft, setDraft] = useState<JournalDraft | null>(null);
  latestDraftRef.current = draft;
  const [expandedEntryId, setExpandedEntryId] = useState<string | "new" | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  isDirtyRef.current = isDirty;
  const [isLoaded, setIsLoaded] = useState(
    () => (props.syncEnabled ? props.initialEntries.length > 0 || !props.initialSyncError : false),
  );
  const [navigationRecoveryCheckComplete, setNavigationRecoveryCheckComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localSaveIssue, setLocalSaveIssue] = useState<LocalSaveIssue | null>(null);
  const [savedDestination, setSavedDestination] = useState<SaveDestination | null>(null);
  const [pendingMutations, setPendingMutations] = useState<JournalPendingMutation[]>([]);
  const [reconciledOwnerId, setReconciledOwnerId] = useState<string | null>(null);
  const [conflictsByEntryId, setConflictsByEntryId] = useState<Record<string, JournalConflict>>({});
  const [search, setSearch] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [insertDraft, setInsertDraft] = useState<InsertDraft | null>(null);
  const [ayahCardById, setAyahCardById] = useState<Record<number, AyahCardResponse>>({});
  const [ayahCardErrorById, setAyahCardErrorById] = useState<Record<number, string>>({});
  const [prefillRetryNonce, setPrefillRetryNonce] = useState(0);
  const [openingEntryId, setOpeningEntryId] = useState<string | null>(null);
  const [noteDetailsOpen, setNoteDetailsOpen] = useState(true);
  const [noteMenuOpen, setNoteMenuOpen] = useState(false);
  const [syncIssue, setSyncIssue] = useState<string | null>(() =>
    props.initialSyncError
      ? "We could not reach your account journal yet. Account changes will be kept on this device while we reconnect."
      : null,
  );
  const triggerPendingPrefillRetry = () => {
    if (!pendingPrefillRetryRef.current || !isMountedRef.current) {
      return;
    }
    pendingPrefillRetryRef.current = null;
    setPrefillRetryNonce((current) => current + 1);
  };
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const journalOwnerReady = !props.syncEnabled || Boolean(
    props.storageOwnerId && reconciledOwnerId === props.storageOwnerId,
  );
  const journalInteractionReady = isLoaded && navigationRecoveryCheckComplete && journalOwnerReady;
  const effectiveSyncEnabled = props.syncEnabled && journalOwnerReady && accountSyncEnabled;
  // The server-resolved owner is authoritative for this render. Never infer a
  // journal scope from the global browser marker, which may still belong to a
  // previous account while the app-shell snapshot is resolving.
  const localStorageTarget = useMemo<JournalLocalStorageTarget>(
    () => props.storageOwnerId
      ? { scope: "account", ownerId: props.storageOwnerId }
      : { scope: "device" },
    [props.storageOwnerId],
  );
  activeDraftIdRef.current = draft?.id ?? null;
  const accountQueueTarget = useMemo<JournalAccountStorageTarget | null>(
    () => props.storageOwnerId
      ? { scope: "account", ownerId: props.storageOwnerId }
      : null,
    [props.storageOwnerId],
  );

  const defaultDuaValue = duaOptions[0] ? buildDuaOptionValue(duaOptions[0]) : "";
  const currentEntry = draft?.id ? findJournalEntryByIdOrOrigin(entries, draft.id) ?? null : null;
  const currentPendingState = draft?.id
    ? pendingJournalStateForEntry(currentEntry ?? draft.id, pendingMutations)
    : null;
  const currentConflict = draft?.id
    ? conflictsByEntryId[currentEntry?.id ?? draft.id] ?? conflictsByEntryId[draft.id] ?? null
    : null;
  const conflictCount = pendingMutations.filter(
    (mutation) => mutation.lastFailure?.disposition === "conflict",
  ).length;
  const pendingSyncCount = pendingMutations.filter(
    (mutation) => mutation.lastFailure?.disposition !== "conflict",
  ).length;
  const retryableSyncCount = pendingMutations.filter((mutation) =>
    shouldAutomaticallyRetryJournalMutation(mutation)
  ).length;
  const reviewSyncCount = pendingMutations.length - conflictCount - retryableSyncCount;
  const saveInProgress = isSaving || isAutosaving;
  const isBusy = saveInProgress || isDeleting || Boolean(openingEntryId);
  const pinnedCount = entries.filter((entry) => entry.pinned).length;
  const pinLimitBlocksSave = Boolean(
    draft?.pinned && pinnedCount >= 10 && !currentEntry?.pinned,
  );

  const filteredEntries = entries.filter((entry) => {
    if (!deferredSearch) {
      return true;
    }
    if (draft?.id === entry.id) {
      return true;
    }
    return buildSearchText(entry).includes(deferredSearch);
  });

  const fetchSyncedEntries = async () => {
    const response = await fetch("/api/journal?view=summary", {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
      },
    });
    const payload = await readApiJson<{ ok: true; entries: JournalEntry[] }>(response);
    return payload.entries;
  };

  const importLegacyEntries = useCallback(async (legacyEntries: JournalEntry[]) => {
    if (!props.storageOwnerId) {
      throw new Error("A signed-in account is required to import journal notes.");
    }
    return importLegacyJournalEntries(props.storageOwnerId, legacyEntries);
  }, [props.storageOwnerId]);

  const fetchJournalEntry = useCallback(async (entryId: string) => {
    const response = await fetch(`/api/journal/${encodeURIComponent(entryId)}`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await readApiJson<{ ok: true; entry: JournalEntry }>(response);
    return payload.entry;
  }, []);

  const loadComposerOptions = useCallback(async () => {
    if (duaOptions.length > 0) {
      return duaOptions;
    }
    const response = await fetch("/api/journal/composer", {
      method: "GET",
      cache: "force-cache",
    });
    const payload = await readApiJson<JournalComposerPayload>(response);
    setDuaOptions(payload.duaOptions);
    return payload.duaOptions;
  }, [duaOptions]);

  const applyQueueSnapshot = useCallback((snapshot: Pick<JournalQueueSnapshot, "mutations">) => {
    journalStateGenerationRef.current += 1;
    pendingMutationsRef.current = snapshot.mutations;
    setPendingMutations(snapshot.mutations);
  }, []);

  const reconcileConflictState = useCallback(
    (remoteEntries: JournalEntry[], mutations: JournalPendingMutation[]) => {
      setConflictsByEntryId((current) => {
        const next: Record<string, JournalConflict> = {};
        for (const mutation of mutations) {
          if (mutation.lastFailure?.disposition !== "conflict") {
            continue;
          }
          const entryId = journalPendingMutationEntryId(mutation);
          const remoteEntry = findJournalEntryByIdOrOrigin(remoteEntries, entryId);
          const authoritativeEntry = mutation.lastFailure.authoritativeEntry ?? null;
          const displayEntryId = remoteEntry?.id ?? authoritativeEntry?.id ?? entryId;
          const previous = current[displayEntryId] ?? current[entryId];
          const authority = resolveJournalConflictAuthority(
            mutation,
            remoteEntry ?? null,
            previous,
          );
          next[displayEntryId] = {
            entryId,
            clientMutationId: mutation.clientMutationId,
            mutationType: mutation.type,
            ...authority,
          };
        }
        return next;
      });
    },
    [],
  );

  const refreshSyncedEntries = useCallback(async (options?: { quiet?: boolean }) => {
    if (!props.syncEnabled || !journalOwnerReady || !accountQueueTarget) {
      return;
    }
    const requestId = ++refreshRequestIdRef.current;
    const requestOwnerId = accountQueueTarget.ownerId;
    const requestStateGeneration = journalStateGenerationRef.current;
    const requestIsCurrent = () =>
      isMountedRef.current &&
      refreshRequestIdRef.current === requestId &&
      activeStorageOwnerIdRef.current === requestOwnerId &&
      journalStateGenerationRef.current === requestStateGeneration;

    try {
      const remoteEntries = sortEntries(await fetchSyncedEntries());
      if (!requestIsCurrent()) {
        return;
      }
      knownAccountEntryIdsRef.current = new Set(remoteEntries.map((entry) => entry.id));
      const queue = listPendingJournalMutations(accountQueueTarget);
      if (!queue.ok) {
        throw new Error("Your saved-on-device journal changes could not be read safely.");
      }
      applyQueueSnapshot(queue);
      reconcileConflictState(remoteEntries, queue.mutations);
      setAccountSyncEnabled(true);
      setEntries(projectPendingJournalMutations(remoteEntries, queue.mutations));
      setIsLoaded(true);
      setSyncIssue(null);
      didAnnounceSyncIssueRef.current = false;
      if (!didAnnounceSyncRecoveryRef.current) {
        didAnnounceSyncRecoveryRef.current = true;
        pushToast({
          tone: "success",
          title: "Journal sync restored",
          message: "Your notes are loading from your account again.",
        });
      }
    } catch (error) {
      if (!requestIsCurrent()) {
        return;
      }
      setIsLoaded(true);
      const message = error instanceof Error ? error.message : "Could not refresh your account journal right now.";
      setSyncIssue(message);
      if (options?.quiet || didAnnounceSyncIssueRef.current) {
        return;
      }
      didAnnounceSyncIssueRef.current = true;
      pushToast({
        tone: "warning",
        title: "Journal sync is reconnecting",
        message,
      });
    }
  }, [accountQueueTarget, applyQueueSnapshot, journalOwnerReady, props.syncEnabled, pushToast, reconcileConflictState]);

  const flushPendingJournalMutations = useCallback((
    options?: { quiet?: boolean },
  ): Promise<JournalQueueFlushResult> => {
    const emptyResult = (): JournalQueueFlushResult => ({
      syncedEntriesByLocalId: new Map(),
      syncedResultsByMutationId: new Map(),
      conflictedEntryIds: new Set(),
      remainingMutations: pendingMutationsRef.current,
    });
    if (
      !props.syncEnabled ||
      !journalOwnerReady ||
      !accountQueueTarget
    ) {
      return Promise.resolve(emptyResult());
    }
    const inFlight = queueFlushInFlightRef.current;
    if (inFlight) {
      return inFlight;
    }

    const operation = (async () => {
    const beforePurge = listPendingJournalMutations(accountQueueTarget);
    if (!beforePurge.ok) {
      if (isMountedRef.current) {
        setSyncIssue("Your saved-on-device journal changes could not be read safely.");
      }
      return emptyResult();
    }
    const expiredEntryIds = new Set(
      beforePurge.mutations
        .filter((mutation) => beforePurge.expiredCreateClientMutationIds.includes(mutation.clientMutationId))
        .map(journalPendingMutationEntryId),
    );
    const queue = await purgeExpiredPendingJournalCreates(accountQueueTarget);
    if (!queue.ok) {
      if (isMountedRef.current) {
        setSyncIssue("An expired private note could not be removed from the local sync queue safely.");
      }
      return emptyResult();
    }
    applyQueueSnapshot(queue);
    if (expiredEntryIds.size > 0 && isMountedRef.current) {
      setEntries((current) => current.filter((entry) =>
        ![...expiredEntryIds].some((entryId) => journalEntryMatchesId(entry, entryId))));
    }

    if (
      queue.automaticRetryMutations.length === 0 ||
      (typeof navigator !== "undefined" && navigator.onLine === false)
    ) {
      return {
        ...emptyResult(),
        remainingMutations: queue.mutations,
      };
    }

    const syncedEntriesByLocalId = new Map<string, JournalEntry>();
    const syncedResultsByMutationId = new Map<string, JournalEntry | null>();
    const syncedDeleteEntryIds = new Set<string>();
    const conflictedEntryIds = new Set<string>();
    const blockedEntryIds = new Set<string>();
    let stoppedForConnectivity = false;
    let retainedConfirmedCreateRecovery = false;

    for (const queuedMutation of queue.automaticRetryMutations) {
        const entryId = journalPendingMutationEntryId(queuedMutation);
        const mappedEntryId = syncedEntriesByLocalId.get(entryId)?.id ??
          findJournalEntryByIdOrOrigin(entriesRef.current, entryId)?.id ??
          entryId;
        if (blockedEntryIds.has(entryId) || blockedEntryIds.has(mappedEntryId)) {
          continue;
        }
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          stoppedForConnectivity = true;
          break;
        }

        const attempted = await markPendingJournalMutationAttempt(
          accountQueueTarget,
          queuedMutation.clientMutationId,
        );
        if (!attempted.ok || !attempted.mutation) {
          if (isMountedRef.current) {
            setSyncIssue("A saved journal change could not be prepared for safe retry.");
          }
          break;
        }
        const attemptedMutation = attempted.mutation;
        applyQueueSnapshot(attempted);

        const result = await sendPendingJournalMutation(accountQueueTarget, attemptedMutation);
        // The explicit owner still protects the request server-side. Leaving the
        // outbox item in place here lets the original owner replay it safely.
        if (!isMountedRef.current) {
          break;
        }

        if (result.ok) {
          if (attemptedMutation.type === "create") {
            const fallbackCleanup = await removeAcknowledgedJournalImportSources(
              accountQueueTarget,
              [attemptedMutation.entry],
              [entryId],
            );
            if (!fallbackCleanup.ok || fallbackCleanup.retainedEntryIds.length > 0) {
              retainedConfirmedCreateRecovery = true;
              setSyncIssue("The account save was confirmed, but its older browser recovery copy still needs cleanup.");
            }
          }
          const removed = await removePendingJournalMutation(
            accountQueueTarget,
            attemptedMutation.clientMutationId,
          );
          if (!removed.ok) {
            setSyncIssue("The account save was confirmed, but local sync cleanup still needs attention.");
            break;
          }
          applyQueueSnapshot(removed);
          syncedResultsByMutationId.set(attemptedMutation.clientMutationId, result.entry);
          if (result.entry) {
            const syncedEntry = result.entry;
            knownAccountEntryIdsRef.current.add(syncedEntry.id);
            syncedEntriesByLocalId.set(entryId, syncedEntry);
            const latestDraft = latestDraftRef.current;
            if (latestDraft && (
              latestDraft.id === entryId ||
              latestDraft.id === syncedEntry.id ||
              latestDraft.id === syncedEntry.originEntryId
            )) {
              const rebasedDraft = {
                ...latestDraft,
                id: syncedEntry.id,
                baseVersion: syncedEntry.version ?? latestDraft.baseVersion,
                createdAt: syncedEntry.createdAt,
              };
              latestDraftRef.current = rebasedDraft;
              activeDraftIdRef.current = syncedEntry.id;
            }
            setDraft((current) => current && (
              current.id === entryId ||
              current.id === syncedEntry.id ||
              current.id === syncedEntry.originEntryId
            )
              ? {
                  ...current,
                  id: syncedEntry.id,
                  baseVersion: syncedEntry.version ?? current.baseVersion,
                  createdAt: syncedEntry.createdAt,
                }
              : current);
            if (
              activeDraftIdRef.current === entryId ||
              activeDraftIdRef.current === syncedEntry.id
            ) {
              setExpandedEntryId(syncedEntry.id);
              setSavedDestination("account");
            }
          } else {
            const canonicalDeleteEntryId = syncedEntriesByLocalId.get(entryId)?.id ?? entryId;
            knownAccountEntryIdsRef.current.delete(entryId);
            knownAccountEntryIdsRef.current.delete(canonicalDeleteEntryId);
            for (const [localId, syncedEntry] of syncedEntriesByLocalId) {
              if (
                localId === entryId ||
                journalEntryMatchesId(syncedEntry, entryId) ||
                syncedEntry.id === canonicalDeleteEntryId
              ) {
                syncedEntriesByLocalId.delete(localId);
              }
            }
            syncedDeleteEntryIds.add(entryId);
            syncedDeleteEntryIds.add(canonicalDeleteEntryId);
          }
          setConflictsByEntryId((current) => {
            const next = { ...current };
            for (const [key, conflict] of Object.entries(current)) {
              if (
                key === entryId ||
                key === result.entry?.id ||
                key === result.entry?.originEntryId ||
                conflict.entryId === entryId
              ) {
                delete next[key];
              }
            }
            return next;
          });
          continue;
        }

        const disposition = result.conflict
          ? "conflict"
          : result.retryable
            ? "retryable"
            : "terminal";
        const failed = await markPendingJournalMutationFailure(
          accountQueueTarget,
          attemptedMutation.clientMutationId,
          {
            disposition,
            code: result.code,
            authoritativeEntryKnown: result.authoritativeEntryKnown,
            authoritativeEntry: result.authoritativeEntry,
          },
        );
        if (failed.ok) {
          applyQueueSnapshot(failed);
        }

        if (result.conflict) {
          conflictedEntryIds.add(entryId);
          blockedEntryIds.add(entryId);
          const conflictDisplayEntryId = result.authoritativeEntry?.id ?? mappedEntryId;
          conflictedEntryIds.add(conflictDisplayEntryId);
          blockedEntryIds.add(conflictDisplayEntryId);
          if (result.authoritativeEntry?.originEntryId) {
            conflictedEntryIds.add(result.authoritativeEntry.originEntryId);
            blockedEntryIds.add(result.authoritativeEntry.originEntryId);
          }
          setConflictsByEntryId((current) => ({
            ...current,
            [conflictDisplayEntryId]: {
              entryId,
              clientMutationId: attemptedMutation.clientMutationId,
              mutationType: attemptedMutation.type,
              authoritativeEntry: result.authoritativeEntry,
              authoritativeEntryKnown: result.authoritativeEntryKnown,
            },
          }));
          continue;
        }

        if (result.retryable) {
          stoppedForConnectivity = true;
          break;
        }
        blockedEntryIds.add(entryId);
        blockedEntryIds.add(mappedEntryId);
      }

    if (syncedEntriesByLocalId.size > 0 || syncedDeleteEntryIds.size > 0) {
        setAccountSyncEnabled(true);
        setEntries((current) => {
          const next = new Map(current.map((entry) => [entry.id, entry]));
          for (const entryId of syncedDeleteEntryIds) {
            for (const entry of next.values()) {
              if (journalEntryMatchesId(entry, entryId)) {
                next.delete(entry.id);
              }
            }
          }
          for (const [localId, entry] of syncedEntriesByLocalId) {
            next.delete(localId);
            next.set(entry.id, entry);
          }
          return projectPendingJournalMutations([...next.values()], pendingMutationsRef.current);
        });
      }

    if (stoppedForConnectivity) {
        setAccountSyncEnabled(false);
        setSyncIssue("Your journal changes are saved on this device and will sync when the account service returns.");
      } else if (conflictedEntryIds.size > 0) {
        setSyncIssue("One or more notes changed elsewhere and need your choice before syncing.");
      }

    if (!stoppedForConnectivity) {
        await refreshSyncedEntries({ quiet: true });
      }
    if (retainedConfirmedCreateRecovery) {
        // The server confirmation is final, so never leave its create in the
        // retry queue solely because a newer/different local recovery copy was
        // retained. That copy will be re-imported for explicit review.
        setSyncIssue("The account save was confirmed, but its newer browser recovery copy was kept for review.");
    }

    const remaining = listPendingJournalMutations(accountQueueTarget);
    if (remaining.ok) {
      applyQueueSnapshot(remaining);
    }
    if (!options?.quiet && conflictedEntryIds.size > 0) {
      pushToast({
        tone: "warning",
        title: "Review two versions",
        message: "Your draft is safe on this device. Choose which account version to keep in the note editor.",
      });
    }
    return {
      syncedEntriesByLocalId,
      syncedResultsByMutationId,
      conflictedEntryIds,
      remainingMutations: remaining.ok ? remaining.mutations : pendingMutationsRef.current,
    };
    })();
    queueFlushInFlightRef.current = operation;
    const release = () => {
      if (queueFlushInFlightRef.current === operation) {
        queueFlushInFlightRef.current = null;
      }
    };
    void operation.then(release, release);
    return operation;
  }, [
    accountQueueTarget,
    applyQueueSnapshot,
    journalOwnerReady,
    props.syncEnabled,
    pushToast,
    refreshSyncedEntries,
  ]);

  const fetchAyahCard = useCallback(async (ayahId: number) => {
    const response = await fetch(`/api/quran/ayah-card?ayahId=${encodeURIComponent(String(ayahId))}`);
    const payload = await readApiJson<{ ok: true; ayah: AyahCardResponse }>(response);
    return payload.ayah;
  }, []);

  const updateDraft = (
    updater: (current: JournalDraft) => JournalDraft,
    options?: {
      markDirty?: boolean;
    },
  ) => {
    if (conflictResolutionInFlightRef.current || deletionInFlightRef.current) {
      return;
    }
    const current = latestDraftRef.current;
    if (!current) {
      return;
    }
    const next = updater(current);
    latestDraftRef.current = next;
    activeDraftIdRef.current = next.id;
    setDraft(next);
    if (options?.markDirty ?? true) {
      draftRevisionRef.current += 1;
      isDirtyRef.current = true;
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

  const persistDraftOnce = async (options?: {
    quiet?: boolean;
    collapseAfterSave?: boolean;
  }): Promise<JournalEntry | null> => {
    const draftSnapshot = latestDraftRef.current;
    if (!draftSnapshot) {
      return null;
    }
    const quiet = options?.quiet ?? false;
    const collapseAfterSave = options?.collapseAfterSave ?? false;
    const saveDraftRevision = draftRevisionRef.current;
    const saveDraftSessionId = draftSessionIdRef.current;
    const recoveryDisplayEntryId =
      typeof expandedEntryId === "string" && expandedEntryId !== "new" &&
      legacyImportRecoveryByDisplayIdRef.current.has(expandedEntryId)
        ? expandedEntryId
        : null;
    const recoverySource = recoveryDisplayEntryId
      ? legacyImportRecoveryByDisplayIdRef.current.get(recoveryDisplayEntryId) ?? null
      : null;

    if (props.syncEnabled && !journalOwnerReady) {
      setLocalSaveIssue({ destination: "device", reason: "owner-mismatch" });
      if (!quiet) {
        pushToast({
          tone: "warning",
          title: "Account storage is still preparing",
          message: "Your draft is still open. Try saving again in a moment.",
        });
      }
      return null;
    }

    if (!draftSnapshot.id && !hasMeaningfulDraftContent(draftSnapshot)) {
      clearJournalNavigationRecovery(localStorageTarget);
      isDirtyRef.current = false;
      setIsDirty(false);
      return null;
    }

    const now = new Date();
    const snapshotCurrentEntry = draftSnapshot.id
      ? findJournalEntryByIdOrOrigin(entriesRef.current, draftSnapshot.id) ?? null
      : null;
    const snapshotPendingState = draftSnapshot.id
      ? pendingJournalStateForEntry(snapshotCurrentEntry ?? draftSnapshot.id, pendingMutationsRef.current)
      : null;
    const snapshotPinnedCount = entriesRef.current.filter((entry) => entry.pinned).length;
    if (draftSnapshot.pinned && snapshotPinnedCount >= 10 && !snapshotCurrentEntry?.pinned) {
      if (!quiet) {
        pushToast({
          tone: "warning",
          title: "Pin limit reached",
          message: "Keep at most 10 pinned notes so the journal stays calm.",
        });
      }
      return null;
    }

    const autoDeleteAt = draftSnapshot.type === "repentance"
      ? resolveJournalAutoDeleteAt({
          createdAt: draftSnapshot.createdAt,
          preset: draftSnapshot.autoDeletePreset,
          now,
        })
      : null;
    const content = deriveJournalContent(draftSnapshot.title, draftSnapshot.blocks);
    let retryAsAccountCreate = false;
    let retryBaseVersion: number | null = null;
    let retryQueueEntryId = draftSnapshot.id;
    const draftEntryIdentity = snapshotCurrentEntry ?? draftSnapshot.id ?? "";
    if (draftSnapshot.id && snapshotPendingState === "review" && accountQueueTarget) {
      const blockedForEntry = pendingMutationsRef.current.filter(
        (mutation) => journalPendingMutationMatchesEntry(mutation, draftEntryIdentity),
      );
      const firstBlocked = blockedForEntry[0];
      retryQueueEntryId = firstBlocked
        ? journalPendingMutationEntryId(firstBlocked)
        : draftSnapshot.id;
      retryAsAccountCreate = firstBlocked?.type === "create";
      retryBaseVersion = firstBlocked?.type === "update"
        ? firstBlocked.expectedVersion
        : firstBlocked?.type === "delete"
          ? firstBlocked.expectedVersion
          : null;
    }

    const hasPendingAccountMutation = Boolean(
      draftSnapshot.id && pendingMutationsRef.current.some(
        (mutation) => journalPendingMutationMatchesEntry(mutation, draftEntryIdentity),
      ),
    );
    const accountEntryId = snapshotCurrentEntry?.id ?? draftSnapshot.id;
    const isAccountCreate = Boolean(
      props.syncEnabled &&
      accountQueueTarget &&
      (retryAsAccountCreate ||
        !draftSnapshot.id ||
        (!accountEntryId ||
          (!knownAccountEntryIdsRef.current.has(accountEntryId) && !hasPendingAccountMutation))),
    );
    const baseVersion = draftSnapshot.id && !isAccountCreate
      ? (retryBaseVersion ?? draftSnapshot.baseVersion ?? snapshotCurrentEntry?.version ?? 1)
      : 0;
    const localEntry: JournalEntry = {
      id: accountEntryId ?? createJournalEntryId(now),
      version: draftSnapshot.id && !isAccountCreate ? baseVersion + 1 : 1,
      type: draftSnapshot.type,
      title: draftSnapshot.title,
      content,
      blocks: draftSnapshot.blocks,
      tags: draftSnapshot.tags,
      pinned: draftSnapshot.pinned,
      createdAt: draftSnapshot.createdAt ?? now.toISOString(),
      updatedAt: now.toISOString(),
      linkedAyah: findPrimaryLinkedAyah(draftSnapshot.blocks),
      linkedDua: findPrimaryLinkedDua(draftSnapshot.blocks),
      duaStatus: draftSnapshot.type === "dua" ? draftSnapshot.duaStatus : null,
      autoDeleteAt,
    };

    let savedEntry: JournalEntry = localEntry;
    let savedLocalScope: JournalLocalStorageScope | null = null;
    let savedToAccount = false;
    let queuedForAccount = false;
    let saveNeedsReview = false;
    let saveHasConflict = false;
    let recoveryCleanupNeedsAttention = false;
    if (props.syncEnabled && accountQueueTarget) {
      if (snapshotPendingState === "conflict") {
        pushToast({
          tone: "warning",
          title: "Review two versions first",
          message: "Choose the account copy or keep your draft as a new note before saving again.",
        });
        return null;
      }

      const mutationInput: JournalPendingMutationInput = isAccountCreate
          ? {
              type: "create",
              entry: localEntry,
              clientMutationId: createJournalClientMutationId(now),
            }
          : {
              type: "update",
              entry: localEntry,
              expectedVersion: baseVersion,
              clientMutationId: createJournalClientMutationId(now),
            };
      const queued = draftSnapshot.id && snapshotPendingState === "review"
        ? await replacePendingJournalEntryMutationsAtomically(
            accountQueueTarget,
            retryQueueEntryId ?? draftSnapshot.id,
            mutationInput,
            now,
          )
        : await enqueuePendingJournalMutation(accountQueueTarget, mutationInput, now);
      const queuedMutation = queued.ok
        ? ("replacement" in queued ? queued.replacement : queued.mutation)
        : null;
      if (!queued.ok || !queuedMutation) {
        setLocalSaveIssue({ destination: "device" });
        if (!quiet) {
          pushToast({
            tone: "warning",
            title: "Note not saved",
            message: "This browser could not verify a recovery copy. Your draft is still open—try again.",
          });
        }
        return null;
      }

      const optimisticEntry = queuedMutation.type === "delete" ? localEntry : queuedMutation.entry;
      applyQueueSnapshot(queued);
      clearJournalNavigationRecovery(localStorageTarget, draftSnapshot);
      queuedForAccount = true;
      savedEntry = optimisticEntry;
      setEntries((current) => projectPendingJournalMutations(
        current,
        queued.mutations,
        now,
      ));
      if (draftSessionIdRef.current === saveDraftSessionId) {
        const latestDraft = latestDraftRef.current;
        if (latestDraft && isAccountCreate && latestDraft.id === draftSnapshot.id) {
          const rebasedDraft: JournalDraft = {
            ...latestDraft,
            id: optimisticEntry.id,
            baseVersion: optimisticEntry.version ?? 1,
            createdAt: optimisticEntry.createdAt,
          };
          latestDraftRef.current = rebasedDraft;
          activeDraftIdRef.current = optimisticEntry.id;
          setDraft((current) => current && current.id === draftSnapshot.id ? {
            ...current,
            id: optimisticEntry.id,
            baseVersion: optimisticEntry.version ?? 1,
            createdAt: optimisticEntry.createdAt,
          } : current);
          if (draftRevisionRef.current !== saveDraftRevision && isDirtyRef.current) {
            writeJournalNavigationRecovery(rebasedDraft, localStorageTarget, {
              pathname: "/journal",
              draftRevision: draftRevisionRef.current,
              lastPersistedRevision: lastPersistedRevisionRef.current,
            });
          }
        }
        setExpandedEntryId(optimisticEntry.id);
        setLocalSaveIssue(null);
        setSavedDestination("device");
      }

      // The create mutation is now durably present in the owner-scoped queue,
      // so it is safe to retire the older recovery source if (and only if) it
      // is still byte-for-byte equivalent to the snapshot the user opened.
      if (recoveryDisplayEntryId && recoverySource) {
        const cleanup = await removeAcknowledgedJournalImportSources(
          accountQueueTarget,
          [recoverySource],
          [recoverySource.id],
        );
        if (cleanup.ok && !cleanup.retainedEntryIds.includes(recoverySource.id)) {
          legacyImportRecoveryByDisplayIdRef.current.delete(recoveryDisplayEntryId);
          setEntries((current) => current.filter((entry) => entry.id !== recoveryDisplayEntryId));
        } else {
          recoveryCleanupNeedsAttention = true;
          const cleanupWarning =
            "The new note is saved, but its older browser recovery copy changed or could not be removed safely.";
          setSyncIssue(cleanupWarning);
          if (quiet) {
            pushToast({
              tone: "warning",
              title: "Recovery copy retained",
              message: cleanupWarning,
            });
          }
        }
      }

      setIsSaving(true);
      try {
        const flush = await flushPendingJournalMutations({ quiet: true });
        const queuedMutationId = queuedMutation.clientMutationId;
        const didSyncQueuedMutation = flush.syncedResultsByMutationId.has(queuedMutationId);
        const syncedEntry = flush.syncedResultsByMutationId.get(queuedMutationId) ?? null;
        const pendingState = pendingJournalStateForEntry(
          syncedEntry ?? snapshotCurrentEntry ?? optimisticEntry,
          flush.remainingMutations,
        );
        if (didSyncQueuedMutation && syncedEntry && !pendingState) {
          knownAccountEntryIdsRef.current.add(syncedEntry.id);
          savedEntry = syncedEntry;
          savedToAccount = true;
          queuedForAccount = false;
          if (draftSessionIdRef.current === saveDraftSessionId) {
            setExpandedEntryId(syncedEntry.id);
            setLocalSaveIssue(null);
            setSavedDestination("account");
            setSyncIssue(null);
          }
        } else if (flush.conflictedEntryIds.has(optimisticEntry.id) || pendingState === "conflict") {
          saveNeedsReview = true;
          saveHasConflict = true;
          queuedForAccount = false;
          if (draftSessionIdRef.current === saveDraftSessionId) {
            setLocalSaveIssue(null);
            setSavedDestination("device");
          }
        } else if (pendingState === "review") {
          saveNeedsReview = true;
          if (draftSessionIdRef.current === saveDraftSessionId) {
            setLocalSaveIssue({ destination: "account" });
          }
        }
      } finally {
        setIsSaving(false);
      }
    } else {
      const localResult = await upsertJournalEntry(
        localEntry,
        now,
        localStorageTarget,
        draftSnapshot.id ? baseVersion : null,
      );
      if (!localResult.ok) {
        trackProductEvent("journal.save_outcome", {
          outcome: localResult.reason === "version-conflict" ? "conflict" : "failed",
        });
        if (localResult.reason === "version-conflict") {
          setEntries(localResult.entries);
        }
        if (draftSessionIdRef.current === saveDraftSessionId) {
          setLocalSaveIssue({ destination: "device", reason: localResult.reason });
        }
        if (!quiet) {
          pushToast({
            tone: "warning",
            title: "Note not saved",
            message: localResult.reason === "version-conflict"
              ? "This note changed in another tab. Its newer copy is preserved, and your draft is still open for review."
              : "This browser could not verify a local copy. Your draft is still open—try again.",
          });
        }
        return null;
      }
      savedEntry = localResult.entry;
      savedLocalScope = localResult.scope;
      setEntries(localResult.entries);
      if (draftSessionIdRef.current === saveDraftSessionId) {
        setLocalSaveIssue(null);
        setSavedDestination("device");
      }
    }

    const draftChangedDuringSave = draftRevisionRef.current !== saveDraftRevision;
    const draftSessionChanged = draftSessionIdRef.current !== saveDraftSessionId;
    if (!draftSessionChanged && collapseAfterSave && !saveNeedsReview && !draftChangedDuringSave) {
      draftSessionIdRef.current += 1;
      latestDraftRef.current = null;
      activeDraftIdRef.current = null;
      isDirtyRef.current = false;
      setDraft(null);
      setExpandedEntryId(null);
      setInsertDraft(null);
      setTagInput("");
    } else if (!draftSessionChanged && !draftChangedDuringSave) {
      const savedDraft = draftFromEntry(savedEntry);
      latestDraftRef.current = savedDraft;
      activeDraftIdRef.current = savedDraft.id;
      isDirtyRef.current = false;
      setDraft(savedDraft);
      setExpandedEntryId(savedEntry.id);
    } else if (!draftSessionChanged) {
      const latestDraft = latestDraftRef.current;
      const rebasedDraft = latestDraft
        ? {
            ...latestDraft,
            id: savedEntry.id,
            baseVersion: savedEntry.version ?? latestDraft.baseVersion,
            createdAt: savedEntry.createdAt,
          }
        : null;
      latestDraftRef.current = rebasedDraft;
      activeDraftIdRef.current = rebasedDraft?.id ?? null;
      setDraft(rebasedDraft);
      setExpandedEntryId(savedEntry.id);
    }
    if (!draftSessionChanged && !draftChangedDuringSave) {
      setIsDirty(false);
    }
    if (!draftSessionChanged) {
      lastPersistedRevisionRef.current = Math.max(
        lastPersistedRevisionRef.current,
        saveDraftRevision,
      );
    }
    triggerPendingPrefillRetry();
    clearJournalNavigationRecovery(localStorageTarget, draftSnapshot);
    trackProductEvent("journal.save_outcome", {
      outcome: saveNeedsReview
        ? "review"
        : savedToAccount
          ? "account"
          : queuedForAccount
            ? "queued"
            : "device",
    });
    if (!quiet) {
      if (saveNeedsReview) {
        pushToast({
          tone: "warning",
          title: saveHasConflict ? "Review two versions" : "Sync needs review",
          message: saveHasConflict
            ? "Your draft is safe on this device. Choose how to resolve the account copy."
            : "Your draft is safe on this device, but the account rejected this change. Review it before retrying.",
        });
      } else if (recoveryCleanupNeedsAttention) {
        pushToast({
          tone: "warning",
          title: "Note saved; recovery copy retained",
          message:
            "Your new note is safe, but the older browser recovery copy changed or could not be removed safely.",
        });
      } else {
        pushToast({
          tone: "success",
          title: draftSnapshot.id ? "Note updated" : "Note saved",
          message: savedToAccount
            ? "This note is saved to your account."
            : queuedForAccount
              ? "Saved on this device and waiting to sync to your account."
              : savedLocalScope === "account"
                ? "Saved and verified in this browser for this account. It will not appear on another device."
                : "Saved and verified only in this browser on this device.",
        });
      }
    }
    return savedEntry;
  };

  const persistDraft = (options?: {
    quiet?: boolean;
    collapseAfterSave?: boolean;
  }): Promise<JournalEntry | null> => {
    if (deletionInFlightRef.current || conflictResolutionInFlightRef.current) {
      return Promise.resolve(null);
    }
    const inFlight = persistDraftInFlightRef.current;
    if (inFlight) {
      return inFlight;
    }

    const showManualBusyState = !(options?.quiet ?? false);
    if (showManualBusyState) {
      setIsSaving(true);
    }
    const operation = persistDraftOnce(options);
    persistDraftInFlightRef.current = operation;
    const finish = () => {
      if (persistDraftInFlightRef.current === operation) {
        persistDraftInFlightRef.current = null;
      }
      if (showManualBusyState && isMountedRef.current) {
        setIsSaving(false);
      }
    };
    void operation.then(finish, finish);
    return operation;
  };

  const persistLatestDraftRevision = async (options?: { quiet?: boolean }): Promise<boolean> => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (deletionInFlightRef.current || conflictResolutionInFlightRef.current) {
        return false;
      }
      const targetRevision = draftRevisionRef.current;
      const targetSessionId = draftSessionIdRef.current;
      const savedEntry = await persistDraftRef.current(options);
      if (!savedEntry || draftSessionIdRef.current !== targetSessionId) {
        return false;
      }
      if (
        draftRevisionRef.current === targetRevision &&
        lastPersistedRevisionRef.current >= targetRevision
      ) {
        return true;
      }
    }
    return false;
  };

  const maybePersistBeforeSwitch = async () => {
    if (!draft || !isDirty) {
      return true;
    }
    if (!draft.id && !hasMeaningfulDraftContent(draft)) {
      clearJournalNavigationRecovery(localStorageTarget);
      setIsDirty(false);
      return true;
    }
    return persistLatestDraftRevision({ quiet: true });
  };

  persistDraftRef.current = persistDraft;
  const persistLatestDraftRevisionRef = useRef(persistLatestDraftRevision);
  persistLatestDraftRevisionRef.current = persistLatestDraftRevision;

  useEffect(() => {
    if (!draft || !isDirty) {
      return;
    }
    if (!draft.id && !hasMeaningfulDraftContent(draft)) {
      clearJournalNavigationRecovery(localStorageTarget);
      return;
    }
    writeJournalNavigationRecovery(draft, localStorageTarget, {
      pathname: "/journal",
      draftRevision: draftRevisionRef.current,
      lastPersistedRevision: lastPersistedRevisionRef.current,
    });
  }, [draft, isDirty, localStorageTarget]);

  useEffect(() => {
    if (
      !draft ||
      !isDirty ||
      (!draft.id && !hasMeaningfulDraftContent(draft))
    ) {
      return;
    }

    const ensureNavigationSave = async () => {
      if (deletionInFlightRef.current || conflictResolutionInFlightRef.current) {
        return false;
      }
      const navigationRevision = draftRevisionRef.current;
      const waitStartedAt = Date.now();
      while (autosaveInFlightRef.current && Date.now() - waitStartedAt < 10_000) {
        await new Promise((resolve) => globalThis.setTimeout(resolve, 40));
      }

      let saved = lastPersistedRevisionRef.current >= navigationRevision;
      if (!saved && !autosaveInFlightRef.current) {
        saved = await persistLatestDraftRevisionRef.current({ quiet: true });
      }
      if (
        !saved ||
        draftRevisionRef.current !== navigationRevision ||
        lastPersistedRevisionRef.current < navigationRevision
      ) {
        pushToast({
          tone: "warning",
          title: "Finish saving before leaving",
          message: "Your latest words are still open here. Try again after the save completes.",
        });
        return false;
      }
      return true;
    };

    const handleInternalNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const eventTarget = event.target;
      const anchor = eventTarget instanceof Element
        ? eventTarget.closest<HTMLAnchorElement>("a[href]")
        : null;
      if (!anchor || anchor.download || (anchor.target && anchor.target !== "_self")) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      if (
        nextUrl.origin !== window.location.origin ||
        `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}` ===
          `${window.location.pathname}${window.location.search}${window.location.hash}`
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      if (navigationSaveInFlightRef.current) {
        return;
      }
      navigationSaveInFlightRef.current = true;

      void (async () => {
        if (!(await ensureNavigationSave())) {
          return;
        }

        router.push(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
      })().finally(() => {
        navigationSaveInFlightRef.current = false;
      });
    };

    type JournalNavigateEvent = Event & {
      canIntercept?: boolean;
      destination?: { url?: string };
      downloadRequest?: string | null;
      hashChange?: boolean;
      intercept?: (options: { handler: () => Promise<void> }) => void;
    };
    const navigationApi = (window as Window & { navigation?: EventTarget }).navigation;
    const handleNavigate = (event: Event) => {
      const navigationEvent = event as JournalNavigateEvent;
      if (
        !navigationEvent.canIntercept ||
        navigationEvent.downloadRequest ||
        navigationEvent.hashChange ||
        !navigationEvent.intercept
      ) {
        return;
      }
      const destinationUrl = navigationEvent.destination?.url;
      if (
        destinationUrl &&
        new URL(destinationUrl, window.location.href).origin !== window.location.origin
      ) {
        return;
      }

      navigationEvent.intercept({
        handler: async () => {
          if (await ensureNavigationSave()) {
            return;
          }
          throw new DOMException("Journal navigation canceled", "AbortError");
        },
      });
    };

    const handleHistoryNavigation = () => {
      if (navigationApi || lastPersistedRevisionRef.current >= draftRevisionRef.current) {
        return;
      }
      // `popstate` cannot be cancelled in browsers without the Navigation API.
      // Capture the exact draft synchronously before the App Router can unmount
      // this editor; a later journal mount restores it if the verified save fails.
      const recoveryDraft = latestDraftRef.current ?? draft;
      const recovery = writeJournalNavigationRecovery(recoveryDraft, localStorageTarget, {
        pathname: "/journal",
        draftRevision: draftRevisionRef.current,
        lastPersistedRevision: lastPersistedRevisionRef.current,
      });
      void ensureNavigationSave().then((saved) => {
        if (saved && recovery) {
          clearJournalNavigationRecovery(localStorageTarget, recovery.draft);
        }
      });
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (lastPersistedRevisionRef.current >= draftRevisionRef.current) {
        return;
      }
      writeJournalNavigationRecovery(latestDraftRef.current ?? draft, localStorageTarget, {
        pathname: "/journal",
        draftRevision: draftRevisionRef.current,
        lastPersistedRevision: lastPersistedRevisionRef.current,
      });
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("click", handleInternalNavigation, true);
    navigationApi?.addEventListener("navigate", handleNavigate);
    window.addEventListener("popstate", handleHistoryNavigation);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("click", handleInternalNavigation, true);
      navigationApi?.removeEventListener("navigate", handleNavigate);
      window.removeEventListener("popstate", handleHistoryNavigation);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [draft, isDirty, localStorageTarget, pushToast, router]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    if (draft) {
      document.documentElement.dataset.journalEditor = "open";
    } else {
      delete document.documentElement.dataset.journalEditor;
    }
    return () => {
      delete document.documentElement.dataset.journalEditor;
    };
  }, [draft]);

  useEffect(() => {
    if (!noteMenuOpen) {
      return;
    }

    const getMenuItems = () =>
      Array.from(
        noteMenuRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"], [role="menuitemcheckbox"]',
        ) ?? [],
      );
    const focusFrame = globalThis.requestAnimationFrame(() => {
      getMenuItems()[0]?.focus();
    });
    const handlePointerDown = (event: PointerEvent) => {
      if (!noteMenuRef.current?.contains(event.target as Node)) {
        setNoteMenuOpen(false);
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!noteMenuRef.current?.contains(event.target as Node)) {
        setNoteMenuOpen(false);
      }
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setNoteMenuOpen(false);
        noteMenuButtonRef.current?.focus();
        return;
      }

      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        return;
      }
      const menuItems = getMenuItems();
      if (menuItems.length === 0) {
        return;
      }
      event.preventDefault();
      const currentIndex = menuItems.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === "Home") {
        menuItems[0]?.focus();
        return;
      }
      if (event.key === "End") {
        menuItems.at(-1)?.focus();
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = currentIndex < 0
        ? 0
        : (currentIndex + direction + menuItems.length) % menuItems.length;
      menuItems[nextIndex]?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [noteMenuOpen]);

  const insertPanelKey = insertDraft
    ? `${insertDraft.afterBlockId ?? "end"}:${insertDraft.kind}`
    : null;

  useEffect(() => {
    if (!insertPanelKey) {
      return;
    }

    const focusFrame = globalThis.requestAnimationFrame(() => {
      insertPanelRef.current
        ?.querySelector<HTMLElement>("input, select")
        ?.focus();
    });
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      insertComposerRequestIdRef.current += 1;
      setInsertDraft(null);
      globalThis.requestAnimationFrame(() => insertTriggerRef.current?.focus());
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [insertPanelKey]);

  useEffect(() => {
    if (
      !draft ||
      !isDirty ||
      isDeleting ||
      isSaving ||
      isAutosaving ||
      localSaveIssue ||
      pinLimitBlocksSave ||
      (!draft.id && !hasMeaningfulDraftContent(draft)) ||
      (props.syncEnabled && !journalOwnerReady) ||
      currentPendingState === "conflict" ||
      currentPendingState === "review"
    ) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      if (autosaveInFlightRef.current) {
        return;
      }
      autosaveInFlightRef.current = true;
      setIsAutosaving(true);
      void persistDraftRef.current({ quiet: true }).finally(() => {
        autosaveInFlightRef.current = false;
        if (isMountedRef.current) {
          setIsAutosaving(false);
        }
      });
    }, JOURNAL_AUTOSAVE_DELAY_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [
    currentPendingState,
    draft,
    isAutosaving,
    isDeleting,
    isDirty,
    isSaving,
    journalOwnerReady,
    localSaveIssue,
    pinLimitBlocksSave,
    props.syncEnabled,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const ownerId = props.storageOwnerId?.trim() ?? "";
    if (!props.syncEnabled || !ownerId) {
      setReconciledOwnerId(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const ownerReady = await syncLocalStateOwner({
        status: "signed-in",
        clerkUserId: ownerId,
      });
      if (cancelled) {
        return;
      }
      setReconciledOwnerId(ownerReady ? ownerId : null);
      if (!ownerReady) {
        setSyncIssue(
          "Account journal storage could not be prepared safely. Your open draft is unchanged.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.storageOwnerId, props.syncEnabled]);

  useEffect(() => {
    if (!draft?.id || !currentEntry || draft.id === currentEntry.id) {
      return;
    }
    const originEntryId = draft.id;
    const canonicalEntryId = currentEntry.id;
    setDraft((current) => current?.id === originEntryId
      ? { ...current, id: canonicalEntryId }
      : current);
    setExpandedEntryId((current) => current === originEntryId ? canonicalEntryId : current);
  }, [currentEntry, draft?.id]);

  useEffect(() => {
    if (props.syncEnabled && !journalOwnerReady) {
      return;
    }
    if (props.syncEnabled) {
      for (const entry of props.initialEntries) {
        knownAccountEntryIdsRef.current.add(entry.id);
      }
      const queue = accountQueueTarget
        ? listPendingJournalMutations(accountQueueTarget)
        : null;
      if (queue?.ok) {
        applyQueueSnapshot(queue);
        reconcileConflictState(props.initialEntries, queue.mutations);
      } else if (queue && !queue.ok) {
        setSyncIssue("Your saved-on-device journal changes could not be read safely.");
      }
      const queuedMutations = queue?.ok ? queue.mutations : pendingMutationsRef.current;
      if (props.initialSyncError) {
        setAccountSyncEnabled(false);
        setEntries(projectPendingJournalMutations(
          listJournalEntries(new Date(), localStorageTarget),
          queuedMutations,
        ));
        setIsLoaded(true);
        setSyncIssue(
          "We could not reach your account journal yet. Account changes will be kept on this device while we reconnect.",
        );
        didAnnounceSyncRecoveryRef.current = false;
        void (async () => {
          await flushPendingJournalMutations({ quiet: false });
          await refreshSyncedEntries({ quiet: false });
        })();
        return;
      }

      setAccountSyncEnabled(true);
      setEntries(projectPendingJournalMutations(props.initialEntries, queuedMutations));
      setIsLoaded(true);
      setSyncIssue(null);
      didAnnounceSyncRecoveryRef.current = !props.initialSyncError;
      void (async () => {
        await flushPendingJournalMutations({ quiet: true });
        await refreshSyncedEntries({ quiet: !props.initialSyncError });
      })();
      return;
    }
    applyQueueSnapshot({ mutations: [] });
    setConflictsByEntryId({});
    setAccountSyncEnabled(false);
    const loadedEntries = listJournalEntries(new Date(), localStorageTarget);
    setEntries(loadedEntries);
    setIsLoaded(true);
    setSyncIssue(null);
  }, [
    accountQueueTarget,
    applyQueueSnapshot,
    flushPendingJournalMutations,
    journalOwnerReady,
    localStorageTarget,
    props.initialEntries,
    props.initialSyncError,
    props.syncEnabled,
    reconcileConflictState,
    refreshSyncedEntries,
  ]);

  useEffect(() => {
    if (
      didCheckNavigationRecoveryRef.current ||
      !isLoaded ||
      (props.syncEnabled && !journalOwnerReady)
    ) {
      return;
    }
    didCheckNavigationRecoveryRef.current = true;

    const recovery = readJournalNavigationRecovery(localStorageTarget);
    if (!recovery || recovery.pathname !== "/journal") {
      setNavigationRecoveryCheckComplete(true);
      return;
    }
    const recoveryRequestId = ++openRequestIdRef.current;

    void (async () => {
      let recoveredDraft = recovery.draft;
      let recoveredAsCopy = false;
      if (recoveredDraft.id) {
        let durableEntry = findJournalEntryByIdOrOrigin(
          entriesRef.current,
          recoveredDraft.id,
        );
        const durableVersion = durableEntry?.version ?? null;
        if (
          !durableEntry ||
          (durableVersion !== null &&
            durableVersion > (recoveredDraft.baseVersion ?? 0))
        ) {
          if (
            durableEntry &&
            props.syncEnabled &&
            knownAccountEntryIdsRef.current.has(durableEntry.id) &&
            !isHydratedJournalEntry(durableEntry)
          ) {
            try {
              durableEntry = await fetchJournalEntry(durableEntry.id);
              if (isMountedRef.current) {
                const hydratedEntry = durableEntry;
                setEntries((current) => sortEntries(current.map((entry) =>
                  entry.id === hydratedEntry.id ? hydratedEntry : entry)));
              }
            } catch {
              // A separate recovery copy is safer than discarding an
              // unverified draft when the durable account body is unavailable.
            }
          }
          if (
            !isMountedRef.current ||
            openRequestIdRef.current !== recoveryRequestId
          ) {
            if (isMountedRef.current) {
              setNavigationRecoveryCheckComplete(true);
            }
            return;
          }
          if (
            durableEntry &&
            isHydratedJournalEntry(durableEntry) &&
            journalDraftPayloadMatchesEntry(recoveredDraft, durableEntry)
          ) {
            clearJournalNavigationRecovery(localStorageTarget, recovery.draft);
            setNavigationRecoveryCheckComplete(true);
            return;
          }
          recoveredDraft = {
            ...recoveredDraft,
            id: null,
            baseVersion: null,
            createdAt: null,
          };
          recoveredAsCopy = true;
        }
      }

      if (
        !isMountedRef.current ||
        openRequestIdRef.current !== recoveryRequestId
      ) {
        if (isMountedRef.current) {
          setNavigationRecoveryCheckComplete(true);
        }
        return;
      }
      navigationRecoveryWasRestoredRef.current = true;
      setNavigationRecoveryCheckComplete(true);
      draftRevisionRef.current = Math.max(
        draftRevisionRef.current,
        recovery.draftRevision,
        recovery.lastPersistedRevision + 1,
      );
      lastPersistedRevisionRef.current = Math.min(
        recovery.lastPersistedRevision,
        draftRevisionRef.current - 1,
      );
      draftSessionIdRef.current += 1;
      setDraft(recoveredDraft);
      setExpandedEntryId(recoveredDraft.id ?? "new");
      setTagInput("");
      setInsertDraft(null);
      setNoteDetailsOpen(true);
      setNoteMenuOpen(false);
      setIsDirty(true);
      setLocalSaveIssue(null);
      setSavedDestination(null);
      pushToast({
        tone: "warning",
        title: recoveredAsCopy ? "Recovered as a new note" : "Recovered your unsaved words",
        message: recoveredAsCopy
          ? "The saved note changed while you were away, so this recovery copy was kept separate."
          : "Your latest words were restored after navigation interrupted saving.",
      });
    })();
  }, [
    fetchJournalEntry,
    isLoaded,
    journalOwnerReady,
    localStorageTarget,
    props.syncEnabled,
    pushToast,
  ]);

  useEffect(() => {
    if (!props.syncEnabled || !journalOwnerReady) {
      return;
    }

    const recoverAccountJournal = () => {
      void (async () => {
        await flushPendingJournalMutations({ quiet: true });
        await refreshSyncedEntries({ quiet: true });
      })();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        recoverAccountJournal();
      }
    };

    window.addEventListener("focus", recoverAccountJournal);
    window.addEventListener("online", recoverAccountJournal);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", recoverAccountJournal);
      window.removeEventListener("online", recoverAccountJournal);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [flushPendingJournalMutations, journalOwnerReady, props.syncEnabled, refreshSyncedEntries]);

  useEffect(() => {
    if (!effectiveSyncEnabled) {
      didAttemptLegacyImportRef.current = false;
    }
  }, [effectiveSyncEnabled]);

  useEffect(() => {
    if (
      !effectiveSyncEnabled ||
      !props.storageOwnerId ||
      !accountQueueTarget ||
      pendingMutations.length > 0 ||
      didAttemptLegacyImportRef.current
    ) {
      return;
    }

    const legacyEntries = listJournalEntries(new Date(), localStorageTarget);
    didAttemptLegacyImportRef.current = true;
    if (legacyEntries.length === 0) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const importResult = await importLegacyEntries(legacyEntries);
        if (cancelled) {
          return;
        }
        const confirmedSourceEntryIds = importResult.acknowledgements
          .filter((acknowledgement) => acknowledgement.status !== "conflict")
          .map((acknowledgement) => acknowledgement.sourceEntryId);
        const conflictCount = importResult.acknowledgements.length - confirmedSourceEntryIds.length;
        const cleanup = confirmedSourceEntryIds.length > 0
          ? await removeAcknowledgedJournalImportSources(
              accountQueueTarget,
              legacyEntries,
              confirmedSourceEntryIds,
            )
          : { ok: true as const, removedEntryIds: [], retainedEntryIds: [] };
        if (cancelled) {
          return;
        }
        const retainedSourceIds = new Set([
          ...importResult.acknowledgements
            .filter((acknowledgement) => acknowledgement.status === "conflict")
            .map((acknowledgement) => acknowledgement.sourceEntryId),
          ...cleanup.retainedEntryIds,
        ]);
        const recoveryPairs = legacyEntries
          .filter((entry) => retainedSourceIds.has(entry.id))
          .map((source, index) => {
            const displayEntry = {
              ...source,
              id: createJournalEntryId(new Date(Date.now() + index)),
              originEntryId: source.id,
              clientEntryId: null,
            } satisfies JournalEntry;
            return [displayEntry, source] as const;
          });
        legacyImportRecoveryByDisplayIdRef.current = new Map(
          recoveryPairs.map(([displayEntry, source]) => [displayEntry.id, source]),
        );

        // An account save may have completed while the import request was in
        // flight. Preserve any newer canonical snapshot already in memory and
        // then project the freshly re-read durable queue over the merged view.
        const previousKnownAccountIds = new Set(knownAccountEntryIdsRef.current);
        const mergedAccountEntries = new Map(
          importResult.entries.map((entry) => [entry.id, entry] as const),
        );
        for (const current of entriesRef.current) {
          if (!previousKnownAccountIds.has(current.id)) {
            continue;
          }
          const imported = mergedAccountEntries.get(current.id);
          if (
            !imported ||
            (current.version ?? 1) > (imported.version ?? 1) ||
            (
              (current.version ?? 1) === (imported.version ?? 1) &&
              (isHydratedJournalEntry(current) || current.updatedAt >= imported.updatedAt)
            )
          ) {
            mergedAccountEntries.set(current.id, current);
          }
        }
        const latestAccountEntries = [...mergedAccountEntries.values()];
        knownAccountEntryIdsRef.current = new Set(latestAccountEntries.map((entry) => entry.id));
        const latestQueue = listPendingJournalMutations(accountQueueTarget);
        if (!latestQueue.ok) {
          throw new Error("Your saved-on-device journal changes could not be read safely.");
        }
        applyQueueSnapshot(latestQueue);
        reconcileConflictState(latestAccountEntries, latestQueue.mutations);
        setEntries(sortEntries([
          ...projectPendingJournalMutations(latestAccountEntries, latestQueue.mutations),
          ...recoveryPairs.map(([displayEntry]) => displayEntry),
        ]));
        if (cleanup.ok && cleanup.retainedEntryIds.length === 0 && conflictCount === 0) {
          setSyncIssue(null);
          pushToast({
            tone: "success",
            title: "Notes moved to your account",
            message: "Your older browser-only notes are now saved to your account.",
          });
        } else {
          const cleanupWarning = conflictCount > 0
            ? "Some browser recovery notes differ from the account copy and were kept for review."
            : cleanup.retainedEntryIds.length > 0
              ? "A browser recovery note changed during import and was kept on this device."
              : "Your account save is confirmed, but this browser could not verify removal of the older recovery copy.";
          setSyncIssue(cleanupWarning);
          pushToast({
            tone: "warning",
            title: conflictCount > 0 ? "Recovery copy needs review" : "Notes saved; recovery copy retained",
            message: cleanupWarning,
          });
          // Keep this attempt marked complete for the current mount. Any
          // unconfirmed or concurrently changed source remains durable and is
          // reconsidered after a reload rather than spinning in an import loop.
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        didAttemptLegacyImportRef.current = false;
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
  }, [accountQueueTarget, applyQueueSnapshot, effectiveSyncEnabled, importLegacyEntries, localStorageTarget, pendingMutations.length, props.storageOwnerId, pushToast, reconcileConflictState]);

  useEffect(() => {
    if (
      !isLoaded ||
      !navigationRecoveryCheckComplete ||
      (props.syncEnabled && !journalOwnerReady)
    ) {
      return;
    }
    const signature = searchParams.toString();
    if (!signature) {
      pendingPrefillRetryRef.current = null;
    } else if (
      pendingPrefillRetryRef.current &&
      pendingPrefillRetryRef.current !== signature
    ) {
      pendingPrefillRetryRef.current = null;
    }
    if (navigationRecoveryWasRestoredRef.current) {
      navigationRecoveryWasRestoredRef.current = false;
      if (signature) {
        consumedPrefillRef.current = signature;
      }
      return;
    }
    if (!signature || consumedPrefillRef.current === signature) {
      return;
    }

    if (searchParams.get("newEntry") !== "1") {
      return;
    }

    const ayahId = Number(searchParams.get("ayahId"));
    if (!Number.isFinite(ayahId) || ayahId < 1) {
      return;
    }

    consumedPrefillRef.current = signature;
    const requestId = ++openRequestIdRef.current;
    const draftToPersist = latestDraftRef.current;
    const dirtyDraftToPersist = isDirtyRef.current;
    const prefillStartRevision = draftRevisionRef.current;
    const prefillStartSessionId = draftSessionIdRef.current;
    let cancelled = false;
    const prefillIsCurrent = () =>
      !cancelled &&
      openRequestIdRef.current === requestId &&
      draftSessionIdRef.current === prefillStartSessionId &&
      draftRevisionRef.current === prefillStartRevision;

    void (async () => {
      if (draftToPersist && dirtyDraftToPersist) {
        if (!draftToPersist.id && !hasMeaningfulDraftContent(draftToPersist)) {
          clearJournalNavigationRecovery(localStorageTarget);
          setIsDirty(false);
        } else {
          const saved = await persistLatestDraftRevisionRef.current({ quiet: true });
          if (!saved) {
            pendingPrefillRetryRef.current = signature;
            consumedPrefillRef.current = null;
            return;
          }
          if (!prefillIsCurrent()) {
            return;
          }
        }
      }

      const prompt = searchParams.get("prompt")?.trim() ?? "";
      const title = searchParams.get("title")?.trim() ?? "";
      const type = normalizePrefillType(searchParams.get("type"));

      let ayah: AyahCardResponse | null = null;
      try {
        ayah = await fetchAyahCard(ayahId);
        if (!prefillIsCurrent()) {
          return;
        }
        setAyahCardById((current) => ({ ...current, [ayahId]: ayah as AyahCardResponse }));
      } catch (error) {
        if (prefillIsCurrent()) {
          pushToast({
            tone: "warning",
            title: "Could not prefill linked ayah",
            message: error instanceof Error ? error.message : "You can still write the note manually.",
          });
        }
      }

      if (!prefillIsCurrent()) {
        return;
      }

      const blocks: JournalBlock[] = [];
      if (ayah) {
        blocks.push(
          createAyahBlock({
            title: `${ayah.surahNameTransliteration} ${ayah.surahNumber}:${ayah.ayahNumber}`,
            ayah: {
              ayahId: ayah.id,
              surahNumber: ayah.surahNumber,
              ayahNumber: ayah.ayahNumber,
              surahNameArabic: ayah.surahNameArabic,
              surahNameTransliteration: ayah.surahNameTransliteration,
              textUthmani: ayah.textUthmani,
              translation: ayah.translation,
            },
          }),
        );
      }
      blocks.push(createTextBlock(prompt));

      const nextDraft = createEmptyDraft(type);
      nextDraft.title = title;
      nextDraft.blocks = ensureTextBlock(blocks);

      const prefillIsDirty = hasMeaningfulDraftContent(nextDraft);
      if (prefillIsDirty) {
        draftRevisionRef.current += 1;
      }
      draftSessionIdRef.current += 1;
      setDraft(nextDraft);
      setExpandedEntryId("new");
      setTagInput("");
      setInsertDraft(null);
      setNoteDetailsOpen(true);
      setNoteMenuOpen(false);
      setIsDirty(prefillIsDirty);
      setLocalSaveIssue(null);
      setSavedDestination(null);

      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/journal");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    fetchAyahCard,
    isLoaded,
    journalOwnerReady,
    localStorageTarget,
    navigationRecoveryCheckComplete,
    prefillRetryNonce,
    props.syncEnabled,
    pushToast,
    searchParams,
  ]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    const missingAyahs = draft.blocks
      .filter((block): block is JournalAyahBlock => block.kind === "ayah" && Boolean(block.ayah))
      .map((block) => block.ayah as JournalAyahSnapshot)
      .filter((ayah) => !ayah.textUthmani || !ayah.translation)
      .filter((ayah) =>
        !ayahCardById[ayah.ayahId] &&
        !ayahCardErrorById[ayah.ayahId] &&
        !hydratingAyahIdsRef.current.has(ayah.ayahId)
      );

    if (missingAyahs.length === 0) {
      return;
    }

    const nextAyahId = missingAyahs[0]?.ayahId;
    if (!nextAyahId) {
      return;
    }

    hydratingAyahIdsRef.current.add(nextAyahId);

    void (async () => {
      try {
        const ayah = await fetchAyahCard(nextAyahId);
        if (!isMountedRef.current) {
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
        if (!isMountedRef.current) {
          return;
        }
        setAyahCardErrorById((current) => ({
          ...current,
          [nextAyahId]: error instanceof Error ? error.message : "Could not load this ayah right now.",
        }));
      } finally {
        hydratingAyahIdsRef.current.delete(nextAyahId);
      }
    })();
  }, [ayahCardById, ayahCardErrorById, draft, fetchAyahCard]);

  const handleCreateNew = async (type: JournalEntryType = "reflection") => {
    if (
      !isLoaded ||
      !navigationRecoveryCheckComplete ||
      (props.syncEnabled && !journalOwnerReady) ||
      deletionInFlightRef.current ||
      conflictResolutionInFlightRef.current
    ) {
      return;
    }
    const requestId = ++openRequestIdRef.current;
    setOpeningEntryId(null);
    const shouldContinue = await maybePersistBeforeSwitch();
    if (!shouldContinue || openRequestIdRef.current !== requestId) {
      return;
    }
    draftSessionIdRef.current += 1;
    setDraft(createEmptyDraft(type));
    setExpandedEntryId("new");
    setTagInput("");
    setInsertDraft(null);
    setNoteDetailsOpen(true);
    setNoteMenuOpen(false);
    setIsDirty(false);
    setLocalSaveIssue(null);
    setSavedDestination(null);
  };

  const handleOpenEntry = async (entry: JournalEntry) => {
    if (
      !isLoaded ||
      !navigationRecoveryCheckComplete ||
      (props.syncEnabled && !journalOwnerReady) ||
      deletionInFlightRef.current ||
      conflictResolutionInFlightRef.current
    ) {
      return;
    }
    const requestId = ++openRequestIdRef.current;
    setOpeningEntryId(null);
    const shouldContinue = await maybePersistBeforeSwitch();
    if (!shouldContinue || openRequestIdRef.current !== requestId) {
      return;
    }
    const sourceDraftSessionId = draftSessionIdRef.current;
    const sourceDraftRevision = draftRevisionRef.current;
    const canReplaceSourceDraft = () =>
      openRequestIdRef.current === requestId &&
      draftSessionIdRef.current === sourceDraftSessionId &&
      draftRevisionRef.current === sourceDraftRevision;

    const legacyRecoverySource = legacyImportRecoveryByDisplayIdRef.current.get(entry.id);
    if (legacyRecoverySource) {
      const recoveryDraft = draftFromEntry(legacyRecoverySource);
      // A divergent import recovery copy must never update the account row it
      // collided with. Open it as a new draft so saving preserves both copies.
      recoveryDraft.id = null;
      recoveryDraft.baseVersion = null;
      draftSessionIdRef.current += 1;
      setDraft(recoveryDraft);
      setExpandedEntryId(entry.id);
      setTagInput("");
      setInsertDraft(null);
      setNoteDetailsOpen(true);
      setNoteMenuOpen(false);
      setIsDirty(false);
      setLocalSaveIssue(null);
      setSavedDestination("device");
      return;
    }

    let hydratedEntry = entry;
    const isKnownAccountEntry = props.syncEnabled && knownAccountEntryIdsRef.current.has(entry.id);
    if (isKnownAccountEntry && !isHydratedJournalEntry(entry)) {
      setOpeningEntryId(entry.id);
      try {
        hydratedEntry = await fetchJournalEntry(entry.id);
        if (!canReplaceSourceDraft()) {
          if (openRequestIdRef.current === requestId) {
            pushToast({
              tone: "warning",
              title: "Note switch paused",
              message: "Your current note changed while the other note was loading. Save it, then try again.",
            });
          }
          return;
        }
        setEntries((current) =>
          sortEntries(current.map((currentEntry) => (currentEntry.id === hydratedEntry.id ? hydratedEntry : currentEntry))),
        );
      } catch (error) {
        if (!canReplaceSourceDraft()) {
          return;
        }
        pushToast({
          tone: "warning",
          title: "Could not open note",
          message: error instanceof Error ? error.message : "Please try again.",
        });
        return;
      } finally {
        if (openRequestIdRef.current === requestId) {
          setOpeningEntryId(null);
        }
      }
    }

    if (!canReplaceSourceDraft()) {
      return;
    }
    draftSessionIdRef.current += 1;
    setDraft(draftFromEntry(hydratedEntry));
    setExpandedEntryId(hydratedEntry.id);
    setTagInput("");
    setInsertDraft(null);
    setNoteDetailsOpen(true);
    setNoteMenuOpen(false);
    setIsDirty(false);
    setLocalSaveIssue(null);
    setSavedDestination(isKnownAccountEntry ? "account" : "device");
  };

  const deleteCurrentOnce = async () => {
    if (!draft) {
      return;
    }

    if (!draft.id) {
      clearJournalNavigationRecovery(localStorageTarget);
      draftSessionIdRef.current += 1;
      setDraft(null);
      setExpandedEntryId(null);
      setInsertDraft(null);
      setIsDirty(false);
      setLocalSaveIssue(null);
      setSavedDestination(null);
      return;
    }

    if (props.syncEnabled && !journalOwnerReady) {
      setLocalSaveIssue({ destination: "device", reason: "owner-mismatch" });
      pushToast({
        tone: "warning",
        title: "Account storage is still preparing",
        message: "The note is unchanged. Try again in a moment.",
      });
      return;
    }

    let removalTitle = "Note removed";
    let removalMessage = "That note was removed from this browser.";
    let editorRetired = false;
    if (props.syncEnabled && accountQueueTarget) {
      if (currentPendingState === "conflict") {
        pushToast({
          tone: "warning",
          title: "Review two versions first",
          message: "Resolve the saved account conflict before deleting this note.",
        });
        return;
      }

      const entryIdentity = currentEntry ?? draft.id;
      const entryId = currentEntry?.id ?? draft.id;
      const pendingForEntry = pendingMutationsRef.current.filter((mutation) =>
        journalPendingMutationMatchesEntry(mutation, entryIdentity));
      const replacementEntryId = pendingForEntry[0]
        ? journalPendingMutationEntryId(pendingForEntry[0])
        : entryId;
      const deleteInput: JournalPendingMutationInput = {
        type: "delete",
        entryId,
        expectedVersion: draft.baseVersion ?? currentEntry?.version ?? 1,
        clientMutationId: createJournalClientMutationId(),
      };
      const queued = currentPendingState === "review"
        ? await replacePendingJournalEntryMutationsAtomically(
            accountQueueTarget,
            replacementEntryId,
            deleteInput,
          )
        : await enqueuePendingJournalMutation(accountQueueTarget, deleteInput);
      if (!queued.ok) {
        setLocalSaveIssue({ destination: "device" });
        pushToast({
          tone: "warning",
          title: "Note not removed",
          message: "This browser could not verify the pending deletion. The note is still shown so you can try again.",
        });
        return;
      }
      applyQueueSnapshot(queued);
      clearJournalNavigationRecovery(localStorageTarget, draft);
      setEntries((current) => projectPendingJournalMutations(current, queued.mutations));
      lastPersistedRevisionRef.current = Math.max(
        lastPersistedRevisionRef.current,
        draftRevisionRef.current,
      );
      draftSessionIdRef.current += 1;
      activeDraftIdRef.current = null;
      latestDraftRef.current = null;
      isDirtyRef.current = false;
      setDraft(null);
      setExpandedEntryId(null);
      setInsertDraft(null);
      setIsDirty(false);
      setLocalSaveIssue(null);
      setSavedDestination(null);
      editorRetired = true;

      const queuedMutation = "replacement" in queued ? queued.replacement : queued.mutation;
      if (queuedMutation) {
        const flush = await flushPendingJournalMutations({ quiet: true });
        const pendingState = pendingJournalStateForEntry(entryIdentity, flush.remainingMutations);
        if (
          flush.conflictedEntryIds.has(entryId) ||
          flush.conflictedEntryIds.has(replacementEntryId) ||
          pendingState === "conflict"
        ) {
          removalTitle = "Deletion needs review";
          removalMessage = "The account copy changed, so it was restored for review before deletion.";
        } else if (pendingState) {
          removalTitle = pendingState === "review" ? "Deletion needs review" : "Deletion saved on this device";
          removalMessage = pendingState === "review"
            ? "The deletion is safe on this device but needs review before it can sync."
            : "The note is hidden on this device and its deletion is waiting to sync.";
        } else {
          removalMessage = "That note was removed from your account.";
          setSyncIssue(null);
        }
      } else {
        setEntries((current) => current.filter((entry) =>
          !journalEntryMatchesId(entry, entryId)));
        removalMessage = "The unsynced account note was removed from this device.";
      }
    } else {
      const localDeleteResult = await deleteJournalEntry(
        draft.id,
        new Date(),
        localStorageTarget,
        draft.baseVersion ?? currentEntry?.version ?? 1,
      );
      if (!localDeleteResult.ok) {
        if (localDeleteResult.reason === "version-conflict") {
          setEntries(localDeleteResult.entries);
        }
        pushToast({
          tone: "warning",
          title: "Note not removed",
          message: localDeleteResult.reason === "version-conflict"
            ? "This note changed in another tab. The newer copy was kept so you can review it before deleting."
            : "This browser could not confirm the change. The note is still shown so you can try again.",
        });
        return;
      }
      setEntries(localDeleteResult.entries);
    }

    if (!editorRetired) {
      clearJournalNavigationRecovery(localStorageTarget);
      draftSessionIdRef.current += 1;
      activeDraftIdRef.current = null;
      latestDraftRef.current = null;
      isDirtyRef.current = false;
      setDraft(null);
      setExpandedEntryId(null);
      setInsertDraft(null);
      setIsDirty(false);
      setLocalSaveIssue(null);
      setSavedDestination(null);
    }
    pushToast({
      tone: "warning",
      title: removalTitle,
      message: removalMessage,
    });
  };

  const handleDeleteCurrent = async () => {
    if (deletionInFlightRef.current || conflictResolutionInFlightRef.current) {
      return;
    }
    if (persistDraftInFlightRef.current) {
      pushToast({
        tone: "warning",
        title: "Finish saving first",
        message: "Wait for the current save to finish before deleting this note.",
      });
      return;
    }

    deletionInFlightRef.current = true;
    setIsDeleting(true);
    try {
      await deleteCurrentOnce();
    } finally {
      deletionInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsDeleting(false);
      }
      triggerPendingPrefillRetry();
    }
  };

  const removePendingEntryForResolution = async (
    entryId: string,
    identity: JournalEntry | string = entryId,
  ): Promise<{ ok: true; mutations: JournalPendingMutation[] } | { ok: false }> => {
    if (!accountQueueTarget) {
      return { ok: false };
    }
    const fresh = listPendingJournalMutations(accountQueueTarget);
    if (!fresh.ok) {
      setLocalSaveIssue({ destination: "device" });
      pushToast({
        tone: "warning",
        title: "Could not resolve safely",
        message: "The local recovery copy could not be updated. Nothing was discarded—try again.",
      });
      return { ok: false };
    }
    let snapshot: JournalQueueSnapshot = fresh;
    const mutationIds = fresh.mutations
      .filter((mutation) => journalPendingMutationMatchesEntry(mutation, identity))
      .map((mutation) => mutation.clientMutationId);
    for (const clientMutationId of mutationIds) {
      const removed = await removePendingJournalMutation(accountQueueTarget, clientMutationId);
      if (!removed.ok) {
        applyQueueSnapshot(snapshot);
        setLocalSaveIssue({ destination: "device" });
        pushToast({
          tone: "warning",
          title: "Could not resolve safely",
          message: "The local recovery copy could not be updated. Your remaining copy is still preserved.",
        });
        return { ok: false };
      }
      snapshot = removed;
    }
    if (snapshot.mutations.some((mutation) =>
      journalPendingMutationMatchesEntry(mutation, identity))) {
      applyQueueSnapshot(snapshot);
      return { ok: false };
    }
    applyQueueSnapshot(snapshot);
    setConflictsByEntryId((current) => {
      const next = { ...current };
      for (const [key, conflict] of Object.entries(current)) {
        if (key === entryId || conflict.entryId === entryId) {
          delete next[key];
        }
      }
      return next;
    });
    return { ok: true, mutations: snapshot.mutations };
  };

  const applyAccountCopyOnce = async () => {
    if (!currentConflict || !currentConflict.authoritativeEntryKnown) {
      pushToast({
        tone: "warning",
        title: "Account copy is still loading",
        message: "Reconnect and try again before choosing a version.",
      });
      return;
    }
    const recoveryDraftToRetire = draft;
    let authoritativeEntry = currentConflict.authoritativeEntry;
    if (authoritativeEntry && !isHydratedJournalEntry(authoritativeEntry)) {
      try {
        authoritativeEntry = await fetchJournalEntry(authoritativeEntry.id);
      } catch (error) {
        pushToast({
          tone: "warning",
          title: "Account copy is still loading",
          message: error instanceof Error ? error.message : "Reconnect and try again.",
        });
        return;
      }
    }
    const resolution = await removePendingEntryForResolution(
      currentConflict.entryId,
      currentEntry ?? authoritativeEntry ?? currentConflict.entryId,
    );
    if (!resolution.ok) {
      return;
    }
    if (recoveryDraftToRetire) {
      clearJournalNavigationRecovery(localStorageTarget, recoveryDraftToRetire);
    }

    if (authoritativeEntry) {
      knownAccountEntryIdsRef.current.add(authoritativeEntry.id);
      setEntries((current) => sortEntries([
        ...current.filter(
          (entry) =>
            !journalEntryMatchesId(entry, currentConflict.entryId) &&
            entry.id !== authoritativeEntry.id,
        ),
        authoritativeEntry,
      ]));
      draftSessionIdRef.current += 1;
      setDraft(draftFromEntry(authoritativeEntry));
      setExpandedEntryId(authoritativeEntry.id);
      setSavedDestination("account");
    } else {
      setEntries((current) => current.filter((entry) =>
        !journalEntryMatchesId(entry, currentConflict.entryId)));
      draftSessionIdRef.current += 1;
      setDraft(null);
      setExpandedEntryId(null);
      setSavedDestination(null);
    }
    setIsDirty(false);
    setLocalSaveIssue(null);
    setSyncIssue(null);
    pushToast({
      tone: "success",
      title: authoritativeEntry ? "Account copy kept" : "Account deletion accepted",
      message: authoritativeEntry
        ? "The local pending version was removed after the account copy was restored."
        : "The local pending version was removed; the account no longer has this note.",
    });
  };

  const handleUseAccountCopy = async () => {
    if (conflictResolutionInFlightRef.current || deletionInFlightRef.current) {
      return;
    }
    if (persistDraftInFlightRef.current) {
      pushToast({
        tone: "warning",
        title: "Finish saving first",
        message: "Wait for the current save to finish before choosing a conflict copy.",
      });
      return;
    }

    conflictResolutionInFlightRef.current = true;
    setIsSaving(true);
    try {
      await applyAccountCopyOnce();
    } finally {
      conflictResolutionInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsSaving(false);
      }
      triggerPendingPrefillRetry();
    }
  };

  const keepConflictAsNewDraftOnce = async () => {
    if (!currentConflict || !draft) {
      return;
    }
    if (!accountQueueTarget) {
      return;
    }
    if (!hasMeaningfulDraftContent(draft)) {
      pushToast({
        tone: "warning",
        title: "An empty note cannot be copied",
        message: "Add some text first, or keep the latest account copy instead.",
      });
      return;
    }
    const recoveryDraftToRetire = draft;
    const now = new Date();
    const newEntryId = createJournalEntryId(now);
    const autoDeleteAt = draft.type === "repentance"
      ? resolveJournalAutoDeleteAt({
          createdAt: now.toISOString(),
          preset: draft.autoDeletePreset,
          now,
        })
      : null;
    const newEntry: JournalEntry = {
      id: newEntryId,
      version: 1,
      type: draft.type,
      title: draft.title,
      content: deriveJournalContent(draft.title, draft.blocks),
      blocks: draft.blocks,
      tags: draft.tags,
      pinned: draft.pinned,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      linkedAyah: findPrimaryLinkedAyah(draft.blocks),
      linkedDua: findPrimaryLinkedDua(draft.blocks),
      duaStatus: draft.type === "dua" ? draft.duaStatus : null,
      autoDeleteAt,
    };
    const clientMutationId = createJournalClientMutationId(now);
    const replacement = await replacePendingJournalEntryMutationsAtomically(
      accountQueueTarget,
      currentConflict.entryId,
      {
        type: "create",
        entry: newEntry,
        clientMutationId,
      },
      now,
    );
    if (!replacement.ok) {
      setLocalSaveIssue({ destination: "device" });
      pushToast({
        tone: "warning",
        title: "Draft could not be copied safely",
        message: "Your original recovery copy is still preserved. Try again when browser storage is available.",
      });
      return;
    }
    clearJournalNavigationRecovery(localStorageTarget, recoveryDraftToRetire);
    applyQueueSnapshot(replacement);
    const accountEntry = currentConflict.authoritativeEntryKnown
      ? currentConflict.authoritativeEntry
      : null;
    setEntries((current) => {
      const withoutLocal = current.filter((entry) =>
        !journalEntryMatchesId(entry, currentConflict.entryId));
      const withAccount = accountEntry
        ? [...withoutLocal.filter((entry) => entry.id !== accountEntry.id), accountEntry]
        : withoutLocal;
      return projectPendingJournalMutations(withAccount, replacement.mutations, now);
    });
    setConflictsByEntryId((current) => {
      const next = { ...current };
      for (const [key, conflict] of Object.entries(current)) {
        if (key === currentConflict.entryId || conflict.entryId === currentConflict.entryId) {
          delete next[key];
        }
      }
      return next;
    });
    const newDraft = draftFromEntry(newEntry);
    lastPersistedRevisionRef.current = Math.max(
      lastPersistedRevisionRef.current,
      draftRevisionRef.current,
    );
    draftSessionIdRef.current += 1;
    activeDraftIdRef.current = newEntryId;
    latestDraftRef.current = newDraft;
    isDirtyRef.current = false;
    setDraft(newDraft);
    setExpandedEntryId(newEntryId);
    setIsDirty(false);
    setLocalSaveIssue(null);
    setSavedDestination("device");
    setSyncIssue(null);
    const flush = await flushPendingJournalMutations({ quiet: true });
    const syncedEntry = flush.syncedResultsByMutationId.get(clientMutationId) ?? null;
    const pendingState = pendingJournalStateForEntry(
      syncedEntry ?? newEntry,
      flush.remainingMutations,
    );
    pushToast({
      tone: syncedEntry && !pendingState ? "success" : "warning",
      title: syncedEntry && !pendingState ? "Draft copied to a new account note" : "Draft preserved as a new note",
      message: syncedEntry && !pendingState
        ? "The other account copy is unchanged."
        : "The new copy is safe on this device and will sync when the account service is available.",
    });
  };

  const handleKeepConflictAsNewDraft = async () => {
    if (conflictResolutionInFlightRef.current || deletionInFlightRef.current) {
      return;
    }
    if (persistDraftInFlightRef.current) {
      pushToast({
        tone: "warning",
        title: "Finish saving first",
        message: "Wait for the current save to finish before copying this draft.",
      });
      return;
    }

    conflictResolutionInFlightRef.current = true;
    setIsSaving(true);
    try {
      await keepConflictAsNewDraftOnce();
    } finally {
      conflictResolutionInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsSaving(false);
      }
      triggerPendingPrefillRetry();
    }
  };

  const deleteLatestAccountCopyOnce = async () => {
    if (
      !currentConflict ||
      !currentConflict.authoritativeEntryKnown ||
      !currentConflict.authoritativeEntry ||
      !accountQueueTarget
    ) {
      return;
    }
    const authoritativeEntry = currentConflict.authoritativeEntry;
    const queued = await replacePendingJournalEntryMutationsAtomically(
      accountQueueTarget,
      currentConflict.entryId,
      {
        type: "delete",
        entryId: authoritativeEntry.id,
        expectedVersion: authoritativeEntry.version ?? 1,
        clientMutationId: createJournalClientMutationId(),
      },
    );
    if (!queued.ok) {
      setLocalSaveIssue({ destination: "device" });
      pushToast({
        tone: "warning",
        title: "Deletion was not queued",
        message: "Your local recovery copy is still preserved. Try again when browser storage is available.",
      });
      return;
    }
    applyQueueSnapshot(queued);
    setEntries((current) => projectPendingJournalMutations(
      current.filter((entry) => !journalEntryMatchesId(entry, currentConflict.entryId)),
      queued.mutations,
    ));
    setConflictsByEntryId((current) => {
      const next = { ...current };
      for (const [key, conflict] of Object.entries(current)) {
        if (key === currentConflict.entryId || conflict.entryId === currentConflict.entryId) {
          delete next[key];
        }
      }
      return next;
    });
    clearJournalNavigationRecovery(localStorageTarget);
    lastPersistedRevisionRef.current = Math.max(
      lastPersistedRevisionRef.current,
      draftRevisionRef.current,
    );
    draftSessionIdRef.current += 1;
    activeDraftIdRef.current = null;
    latestDraftRef.current = null;
    isDirtyRef.current = false;
    setDraft(null);
    setExpandedEntryId(null);
    setIsDirty(false);
    setSavedDestination(null);
    const flush = await flushPendingJournalMutations({ quiet: true });
    const pendingState = pendingJournalStateForEntry(authoritativeEntry, flush.remainingMutations);
    pushToast({
      tone: pendingState ? "warning" : "success",
      title: pendingState ? "Deletion saved on this device" : "Account note removed",
      message: pendingState
        ? "The deletion will retry when the account service is available."
        : "The latest account copy was deleted.",
    });
  };

  const handleDeleteLatestAccountCopy = async () => {
    if (deletionInFlightRef.current || conflictResolutionInFlightRef.current) {
      return;
    }
    if (persistDraftInFlightRef.current) {
      pushToast({
        tone: "warning",
        title: "Finish saving first",
        message: "Wait for the current save to finish before deleting the account copy.",
      });
      return;
    }

    deletionInFlightRef.current = true;
    setIsDeleting(true);
    try {
      await deleteLatestAccountCopyOnce();
    } finally {
      deletionInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsDeleting(false);
      }
      triggerPendingPrefillRetry();
    }
  };

  const handleTagAdd = () => {
    if (!draft) {
      return;
    }
    const normalized = normalizeJournalTags([...draft.tags, ...tagInput.split(",")]);
    updateDraft((current) => ({ ...current, tags: normalized }));
    setTagInput("");
  };

  const handleDoneEditing = async () => {
    if (
      !draft ||
      isBusy ||
      deletionInFlightRef.current ||
      conflictResolutionInFlightRef.current
    ) {
      return;
    }
    setNoteMenuOpen(false);

    if (!draft.id && !hasMeaningfulDraftContent(draft)) {
      clearJournalNavigationRecovery(localStorageTarget);
      draftSessionIdRef.current += 1;
      latestDraftRef.current = null;
      activeDraftIdRef.current = null;
      isDirtyRef.current = false;
      setDraft(null);
      setExpandedEntryId(null);
      setInsertDraft(null);
      setTagInput("");
      setIsDirty(false);
      setLocalSaveIssue(null);
      setSavedDestination(null);
      return;
    }

    if (isDirty || !draft.id || localSaveIssue) {
      const doneRevision = draftRevisionRef.current;
      const doneSessionId = draftSessionIdRef.current;
      const joinedExistingSave = persistDraftInFlightRef.current !== null;
      const saved = await persistLatestDraftRevision({ quiet: false });
      const latestDraft = latestDraftRef.current;
      const latestEntry = latestDraft?.id
        ? findJournalEntryByIdOrOrigin(entriesRef.current, latestDraft.id) ?? latestDraft.id
        : null;
      const latestPendingState = latestEntry
        ? pendingJournalStateForEntry(latestEntry, pendingMutationsRef.current)
        : null;
      if (
        saved &&
        latestPendingState !== "conflict" &&
        latestPendingState !== "review" &&
        draftSessionIdRef.current === doneSessionId &&
        draftRevisionRef.current === doneRevision &&
        lastPersistedRevisionRef.current >= doneRevision
      ) {
        draftSessionIdRef.current += 1;
        latestDraftRef.current = null;
        activeDraftIdRef.current = null;
        isDirtyRef.current = false;
        setDraft(null);
        setExpandedEntryId(null);
        setInsertDraft(null);
        setTagInput("");
      } else if (joinedExistingSave && !saved) {
        pushToast({
          tone: "warning",
          title: "Latest changes are still open",
          message: "Your note changed while another save was finishing. Choose Done again after the latest save settles.",
        });
      }
      return;
    }

    draftSessionIdRef.current += 1;
    latestDraftRef.current = null;
    activeDraftIdRef.current = null;
    isDirtyRef.current = false;
    setDraft(null);
    setExpandedEntryId(null);
    setInsertDraft(null);
    setTagInput("");
    setLocalSaveIssue(null);
    setSavedDestination(null);
  };

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleTagAdd();
    }
  };

  const openInsertComposer = async (afterBlockId: string | null, kind: InsertDraft["kind"]) => {
    const composerSessionId = draftSessionIdRef.current;
    const composerRequestId = ++insertComposerRequestIdRef.current;
    const composerRequestIsCurrent = () =>
      draftSessionIdRef.current === composerSessionId &&
      insertComposerRequestIdRef.current === composerRequestId;
    if (kind === "dua") {
      setInsertDraft({
        afterBlockId,
        kind,
        title: "",
        surahNumber: props.surahs[0]?.surahNumber ?? 1,
        ayahNumber: 1,
        duaValue: defaultDuaValue,
        loading: true,
      });
      try {
        const nextDuaOptions = await loadComposerOptions();
        if (!composerRequestIsCurrent()) {
          return;
        }
        setInsertDraft((current) =>
          current && current.kind === kind && current.afterBlockId === afterBlockId
            ? {
                ...current,
                duaValue: nextDuaOptions[0] ? buildDuaOptionValue(nextDuaOptions[0]) : "",
                loading: false,
              }
            : current,
        );
      } catch (error) {
        if (!composerRequestIsCurrent()) {
          return;
        }
        pushToast({
          tone: "warning",
          title: "Could not load duas",
          message: error instanceof Error ? error.message : "Please try again.",
        });
        setInsertDraft(null);
        globalThis.requestAnimationFrame(() => insertTriggerRef.current?.focus());
      }
      return;
    }

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
    insertComposerRequestIdRef.current += 1;
    setInsertDraft(null);
  };

  const handleInsertAyahBlock = async () => {
    if (!draft || !insertDraft || insertDraft.kind !== "ayah") {
      return;
    }

    const insertionSessionId = draftSessionIdRef.current;
    const composerRequestId = insertComposerRequestIdRef.current;
    const insertionDraft = insertDraft;
    const selectedSurah = props.surahs.find((surah) => surah.surahNumber === insertionDraft.surahNumber);
    const boundedAyahNumber = Math.min(Math.max(insertionDraft.ayahNumber, 1), selectedSurah?.ayahCount ?? 286);
    const ayahId = (selectedSurah?.startAyahId ?? 1) + boundedAyahNumber - 1;

    setInsertDraft((current) => (current ? { ...current, loading: true } : current));
    try {
      const ayah = await fetchAyahCard(ayahId);
      if (
        draftSessionIdRef.current !== insertionSessionId ||
        insertComposerRequestIdRef.current !== composerRequestId
      ) {
        return;
      }
      const block = createAyahBlock({
        title: insertionDraft.title.trim() || `${ayah.surahNameTransliteration} ${ayah.surahNumber}:${ayah.ayahNumber}`,
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
        blocks: insertBlockAfter(current.blocks, insertionDraft.afterBlockId, block),
      }));
      setAyahCardById((current) => ({ ...current, [ayah.id]: ayah }));
      insertComposerRequestIdRef.current += 1;
      setInsertDraft(null);
      globalThis.requestAnimationFrame(() => insertTriggerRef.current?.focus());
    } catch (error) {
      if (
        draftSessionIdRef.current !== insertionSessionId ||
        insertComposerRequestIdRef.current !== composerRequestId
      ) {
        return;
      }
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
      duaOptions.find((option) => buildDuaOptionValue(option) === insertDraft.duaValue) ?? null;
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
    insertComposerRequestIdRef.current += 1;
    setInsertDraft(null);
    globalThis.requestAnimationFrame(() => insertTriggerRef.current?.focus());
  };

  const renderInsertDock = (afterBlockId: string | null) => {
    const isOpen = insertDraft?.afterBlockId === afterBlockId;

    return (
      <aside className={styles.insertDockArea} aria-label="Insert content">
        <div className={styles.insertDock} role="group" aria-label="Insert content">
          <button
            type="button"
            className={styles.insertDockButton}
            onClick={(event) => {
              insertTriggerRef.current = event.currentTarget;
              void openInsertComposer(afterBlockId, "ayah");
            }}
            aria-haspopup="dialog"
            aria-expanded={isOpen && insertDraft?.kind === "ayah"}
          >
            <BookOpenText size={22} />
            <span>Qur&apos;an reference</span>
          </button>
          <span className={styles.insertDockDivider} aria-hidden="true" />
          <button
            type="button"
            className={styles.insertDockButton}
            onClick={(event) => {
              insertTriggerRef.current = event.currentTarget;
              void openInsertComposer(afterBlockId, "dua");
            }}
            aria-haspopup="dialog"
            aria-expanded={isOpen && insertDraft?.kind === "dua"}
          >
            <Heart size={21} />
            <span>Dua</span>
          </button>
          <span className={styles.insertDockDivider} aria-hidden="true" />
          <button
            type="button"
            className={styles.insertDockButton}
            onClick={() => handleInsertTextBlock(afterBlockId)}
          >
            <Type size={20} />
            <span>Text block</span>
          </button>
        </div>

        {isOpen && insertDraft ? (
          <div
            ref={insertPanelRef}
            className={styles.insertPanel}
            role="dialog"
            aria-label={insertDraft.kind === "ayah" ? "Insert an ayah card" : "Insert a dua card"}
          >
            <div className={styles.insertPanelHeader}>
              <p className={styles.insertPanelTitle}>
                {insertDraft.kind === "ayah" ? "Insert an ayah card" : "Insert a dua card"}
              </p>
              <button
                type="button"
                className={styles.closeInlineButton}
                onClick={() => {
                  insertComposerRequestIdRef.current += 1;
                  setInsertDraft(null);
                  globalThis.requestAnimationFrame(() => insertTriggerRef.current?.focus());
                }}
                aria-label="Close insert panel"
              >
                <X size={14} />
              </button>
            </div>

            <Input
              value={insertDraft.title}
              onChange={(event) =>
                setInsertDraft((current) => (current ? { ...current, title: event.target.value } : current))
              }
              aria-label="Card title"
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
                  aria-label="Surah"
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
                  aria-label="Ayah number"
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
                  aria-label="Dua"
                >
                  {duaOptions.map((option) => (
                    <option key={buildDuaOptionValue(option)} value={buildDuaOptionValue(option)}>
                      {option.moduleLabel}: {option.title}
                    </option>
                  ))}
                </select>
                <Button onClick={handleInsertDuaBlock} disabled={insertDraft.loading || !duaOptions.length}>
                  <Sparkles size={16} />
                  {insertDraft.loading ? "Loading..." : "Insert dua"}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </aside>
    );
  };

  const renderExpandedCard = (noteDraft: JournalDraft, isNew: boolean) => {
    const lastBlockId = noteDraft.blocks.at(-1)?.id ?? null;
    const pinLimitReached = !noteDraft.pinned && pinnedCount >= 10;
    const statusState = resolveSaveStatusState({
      issueDestination: localSaveIssue?.destination ?? null,
      isSaving: saveInProgress,
      isDirty,
      hasPersistedDraft: Boolean(noteDraft.id),
      savedDestination,
      isQueued: currentPendingState === "queued",
      hasConflict: currentPendingState === "conflict",
      needsReview: currentPendingState === "review",
    });
    const lastEditedAt = currentEntry?.updatedAt ?? noteDraft.createdAt;
    const syncTitle = !props.syncEnabled
      ? "Device-only journal"
      : currentPendingState === "queued"
        ? "Sync pending"
        : currentPendingState === "conflict" || currentPendingState === "review"
          ? "Sync needs attention"
          : savedDestination === "account"
            ? "Account copy up to date"
            : "Account sync ready";
    const syncDetail = !props.syncEnabled
      ? "This private note stays in this browser."
      : currentPendingState === "queued"
        ? "We’ll sync when your connection returns."
        : currentPendingState === "conflict"
          ? "Choose which version to keep."
          : currentPendingState === "review"
            ? "Review this saved device copy before retrying."
            : savedDestination === "account"
              ? "The account save was confirmed."
              : "A verified device copy is kept until sync completes.";

    return (
      <section
        key={noteDraft.id ?? "new"}
        className={clsx("kw-fade-in", styles.focusEditor)}
        aria-label="Journal editor"
      >
        <header className={styles.editorTopBar}>
          <button
            type="button"
            className={styles.backToNotes}
            onClick={() => void handleDoneEditing()}
            disabled={isBusy}
          >
            <ChevronLeft size={20} />
            <span>All notes</span>
          </button>

          <div className={styles.privateLabel}>
            <LockKeyhole size={16} aria-hidden="true" />
            <span>Private {formatJournalEntryType(noteDraft.type).toLowerCase()}</span>
          </div>

          <div className={styles.noteMenu} ref={noteMenuRef}>
            <button
              ref={noteMenuButtonRef}
              type="button"
              className={styles.moreButton}
              onClick={() => setNoteMenuOpen((open) => !open)}
              aria-label="More note actions"
              aria-haspopup="menu"
              aria-expanded={noteMenuOpen}
              disabled={isBusy}
            >
              <MoreHorizontal size={22} />
            </button>
            {noteMenuOpen ? (
              <div className={styles.noteMenuPopover} role="menu" aria-label="Note actions">
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={noteDraft.pinned}
                  aria-disabled={pinLimitReached}
                  disabled={isBusy || pinLimitReached}
                  className={styles.noteMenuItem}
                  onClick={() => {
                    if (pinLimitReached) {
                      pushToast({
                        tone: "warning",
                        title: "Pin limit reached",
                        message: "Unpin another note before pinning this one.",
                      });
                      return;
                    }
                    updateDraft((current) => ({ ...current, pinned: !current.pinned }));
                    setNoteMenuOpen(false);
                  }}
                >
                  <Pin size={16} />
                  {noteDraft.pinned ? "Unpin note" : "Pin note"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={clsx(styles.noteMenuItem, styles.noteMenuItemDanger)}
                  disabled={isBusy}
                  onClick={() => {
                    setNoteMenuOpen(false);
                    void handleDeleteCurrent();
                  }}
                >
                  <Trash2 size={16} />
                  {isNew ? "Discard draft" : "Delete note"}
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <fieldset className={styles.editorFieldset} disabled={isBusy}>
          <div className={styles.editorStage}>
            <div className={styles.editorGrid}>
              <article className={styles.documentCanvas}>
                <Input
                  value={noteDraft.title}
                  onChange={(event) => updateDraft((current) => ({ ...current, title: event.target.value }))}
                  aria-label="Note title"
                  placeholder="A quiet reminder"
                  className={styles.noteTitleInput}
                />

                <div className={styles.blockList}>
                  {noteDraft.blocks.map((block, blockIndex) => {
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
                            aria-label={blockIndex === 0 ? "Note text" : `Note text block ${blockIndex + 1}`}
                            placeholder="Write quietly..."
                            className={styles.textBlock}
                          />
                          {noteDraft.blocks.length > 1 ? (
                            <div className={styles.blockActions}>
                              <button
                                type="button"
                                className={styles.blockActionButton}
                                onClick={() => removeBlock(block.id)}
                              >
                                Remove block
                              </button>
                            </div>
                          ) : null}
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
                                <div dir="rtl" lang="ar" className={styles.arabicCard}>
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
                              <button
                                type="button"
                                className={styles.blockActionButton}
                                onClick={() => removeBlock(block.id)}
                              >
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
                            aria-label="Dua card title"
                            placeholder="Card title"
                          />

                          {block.dua ? (
                            <>
                              {block.dua.arabic ? (
                                <div dir="rtl" lang="ar" className={styles.arabicCard}>
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
              </article>

              {renderInsertDock(lastBlockId)}
            </div>

            <section className={styles.noteDetailsCard} aria-labelledby="journal-note-details-label">
              <button
                type="button"
                className={styles.noteDetailsToggle}
                onClick={() => setNoteDetailsOpen((open) => !open)}
                aria-expanded={noteDetailsOpen}
                aria-controls="journal-note-details-panel"
              >
                <ChevronDown
                  size={18}
                  className={clsx(styles.noteDetailsChevron, noteDetailsOpen && styles.noteDetailsChevronOpen)}
                />
                <span id="journal-note-details-label">Note details</span>
              </button>

              {noteDetailsOpen ? (
                <div id="journal-note-details-panel" className={styles.noteDetailsPanel}>
                  <div className={clsx(styles.noteFooterSection, styles.tagsDetail)}>
                    <p className={styles.toolsLabel}>Tags</p>
                    {noteDraft.tags.length > 0 ? (
                      <div className={styles.tagRow}>
                        {noteDraft.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className={styles.tagPill}
                            aria-label={`Remove tag ${tag}`}
                            onClick={() =>
                              updateDraft((current) => ({
                                ...current,
                                tags: current.tags.filter((item) => item !== tag),
                              }))
                            }
                          >
                            {tag}
                            <X size={13} aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <div className={styles.tagComposer}>
                      <Input
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        aria-label="Tag name"
                        placeholder="Add tag"
                      />
                      <Button variant="secondary" onClick={handleTagAdd} disabled={!tagInput.trim()}>
                        <Plus size={16} />
                        Add tag
                      </Button>
                    </div>
                  </div>

                  <div className={styles.detailColumn}>
                    <p className={styles.toolsLabel}>Pinned</p>
                    <button
                      type="button"
                      className={styles.detailAction}
                      data-active={noteDraft.pinned ? "1" : "0"}
                      aria-pressed={noteDraft.pinned}
                      aria-disabled={pinLimitReached}
                      onClick={() => {
                        if (pinLimitReached) {
                          pushToast({
                            tone: "warning",
                            title: "Pin limit reached",
                            message: "Unpin another note before pinning this one.",
                          });
                          return;
                        }
                        updateDraft((current) => ({ ...current, pinned: !current.pinned }));
                      }}
                    >
                      <Pin size={18} />
                      {noteDraft.pinned ? "Pinned" : "Not pinned"}
                    </button>
                  </div>

                  <div className={styles.detailColumn}>
                    <p className={styles.toolsLabel}>Storage</p>
                    <div className={styles.storageDetail}>
                      <Smartphone size={18} />
                      <div>
                        <p>{props.syncEnabled ? "Account + device" : "Stored on this device"}</p>
                        <span>{props.syncEnabled ? "Verified recovery copy" : "Private to this browser"}</span>
                      </div>
                    </div>
                  </div>

                  <div className={clsx(styles.noteFooterSection, styles.typeDetail)}>
                    <p className={styles.toolsLabel}>Note type</p>
                    <div className={styles.typeRow} role="group" aria-label="Note type">
                      {JOURNAL_ENTRY_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          data-active={noteDraft.type === type ? "1" : "0"}
                          aria-pressed={noteDraft.type === type}
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
                          {formatJournalEntryType(type)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {noteDraft.type === "dua" ? (
                    <div className={clsx(styles.noteFooterSection, styles.detailWide)}>
                      <p className={styles.toolsLabel}>Dua status</p>
                      <div className={styles.toolChipRow} role="group" aria-label="Dua status">
                        {DUA_STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            data-active={noteDraft.duaStatus === option.value ? "1" : "0"}
                            aria-pressed={noteDraft.duaStatus === option.value}
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
                    <div className={clsx(styles.noteFooterSection, styles.detailWide)}>
                      <p className={styles.toolsLabel}>Delete later</p>
                      <div className={styles.toolChipRow} role="group" aria-label="Delete later">
                        {AUTO_DELETE_PRESETS.map((preset) => (
                          <button
                            key={preset.value || "keep"}
                            type="button"
                            data-active={noteDraft.autoDeletePreset === preset.value ? "1" : "0"}
                            aria-pressed={noteDraft.autoDeletePreset === preset.value}
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
            </section>
          </div>

          <footer className={styles.editorStatusBar}>
            <div className={styles.savedState}>
              <SaveStatus state={statusState} className={styles.compactSaveStatus} />
              <p className={styles.lastEdited}>
                {lastEditedAt ? `Last edited ${formatJournalTimestamp(lastEditedAt)}` : "Changes save automatically"}
              </p>
              {localSaveIssue ? (
                <button
                  type="button"
                  className={styles.retryLink}
                  onClick={() => void persistDraft({ quiet: false })}
                  disabled={isBusy}
                >
                  <RotateCcw size={14} />
                  Retry save
                </button>
              ) : null}
            </div>

            <div className={styles.syncState} role="status" aria-live="polite">
              <span className={styles.syncStateIcon}>
                {props.syncEnabled && currentPendingState !== "queued" && !syncIssue ? (
                  <Cloud size={20} />
                ) : (
                  <CloudOff size={20} />
                )}
              </span>
              <div>
                <p className={styles.syncStateTitle}>{syncTitle}</p>
                <p className={styles.syncStateDetail}>{syncDetail}</p>
                {props.syncEnabled && retryableSyncCount > 0 ? (
                  <button
                    type="button"
                    className={styles.retryLink}
                    onClick={() => void flushPendingJournalMutations({ quiet: false })}
                    disabled={isBusy}
                  >
                    Retry sync
                  </button>
                ) : null}
              </div>
            </div>

            {currentPendingState === "conflict" ? (
              <div className={styles.conflictActions}>
                <div className={styles.conflictPanel}>
                  <p className={styles.conflictTitle}>Review two versions</p>
                  <p className={styles.conflictText}>
                    {currentConflict?.authoritativeEntryKnown
                      ? currentConflict.authoritativeEntry
                        ? "The account note changed after this draft was opened. Both copies are preserved."
                        : "The account note was deleted after this draft was opened. Your local draft is preserved."
                      : "The account copy is still loading. Your local draft remains preserved."}
                  </p>
                </div>
                <div className={styles.saveActions}>
                  <Button
                    variant="secondary"
                    onClick={() => void handleUseAccountCopy()}
                    disabled={isBusy || !currentConflict?.authoritativeEntryKnown}
                  >
                    {currentConflict?.authoritativeEntry
                      ? currentConflict.mutationType === "delete"
                        ? "Keep account note"
                        : "Use account copy"
                      : "Accept account deletion"}
                  </Button>
                  {currentConflict?.mutationType === "delete" && currentConflict.authoritativeEntry ? (
                    <Button
                      variant="danger"
                      onClick={() => void handleDeleteLatestAccountCopy()}
                      disabled={isBusy}
                    >
                      Delete updated account note
                    </Button>
                  ) : currentConflict?.mutationType !== "delete" ? (
                    <Button
                      onClick={() => void handleKeepConflictAsNewDraft()}
                      disabled={isBusy || !draft || !hasMeaningfulDraftContent(draft)}
                    >
                      {draft && hasMeaningfulDraftContent(draft)
                        ? "Keep my draft as new"
                        : "Add text to keep as new"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <Button
                size="lg"
                className={styles.doneButton}
                onClick={() => void handleDoneEditing()}
                disabled={isBusy}
              >
                <Check size={18} />
                Done
              </Button>
            )}
          </footer>
        </fieldset>
      </section>
    );
  };

  const renderCollapsedCard = (entry: JournalEntry) => {
    const pendingState = pendingJournalStateForEntry(entry, pendingMutations);
    const isLegacyRecovery = legacyImportRecoveryByDisplayIdRef.current.has(entry.id);
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
        disabled={!journalInteractionReady || isBusy || openingEntryId === entry.id}
        className={styles.noteCardButton}
        onClick={() => void handleOpenEntry(entry)}
      >
        <Card className={styles.noteCard}>
          <div className={styles.noteHeader}>
            <div className={styles.noteTopRow}>
              <div className={styles.richCardPills}>
                <Pill tone={pillTone}>{formatJournalEntryType(entry.type)}</Pill>
                {isLegacyRecovery ? <Pill tone="danger">Recovery copy · save as new</Pill> : null}
                {entry.pinned ? <Pill tone="neutral">Pinned</Pill> : null}
                {pendingState === "queued" ? <Pill tone="warn">Sync pending</Pill> : null}
                {pendingState === "conflict" ? <Pill tone="danger">Review versions</Pill> : null}
                {pendingState === "review" ? <Pill tone="warn">Sync needs review</Pill> : null}
              </div>
              <span className={styles.expandHint}>
                {openingEntryId === entry.id ? "Opening..." : "Open"} <ChevronDown size={14} />
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

  if (isLoaded && draft && expandedEntryId !== null) {
    return <div className={styles.focusPage}>{renderExpandedCard(draft, expandedEntryId === "new")}</div>;
  }

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Private"
        title="Journal"
        subtitle={
          props.syncEnabled
            ? "A private place for reflections, linked ayahs, and personal duas. Offline account changes stay on this device until sync is confirmed."
            : "A private place for reflections, linked ayahs, and personal duas that stay on this device for now."
        }
        right={
          <Button size="lg" onClick={() => void handleCreateNew("reflection")} disabled={!journalInteractionReady || isBusy}>
            <Plus size={18} />
            New reflection
          </Button>
        }
      />

      {props.syncEnabled && (syncIssue || pendingMutations.length > 0) ? (
        <Card className="border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
                {conflictCount > 0
                  ? `${conflictCount} journal ${conflictCount === 1 ? "change needs" : "changes need"} review`
                  : reviewSyncCount > 0
                    ? `${reviewSyncCount} saved journal ${reviewSyncCount === 1 ? "change needs" : "changes need"} review`
                    : pendingSyncCount > 0
                      ? `${pendingSyncCount} journal ${pendingSyncCount === 1 ? "change is" : "changes are"} saved on this device`
                    : "Reconnecting your account journal..."}
              </p>
              <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">
                {syncIssue ?? (conflictCount > 0
                  ? "Open a note marked Review versions to choose which copy to keep."
                  : "Pending changes will sync automatically when the account service is available.")}
              </p>
            </div>
            {retryableSyncCount > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={isSaving || isDeleting}
                onClick={() => void flushPendingJournalMutations({ quiet: false })}
              >
                Retry sync
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

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
        {!journalInteractionReady ? (
          <Card className={styles.emptyCard}>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
              {isLoaded ? "Checking for an unsaved note..." : "Loading your journal..."}
            </p>
          </Card>
        ) : null}

        {journalInteractionReady && filteredEntries.length === 0 ? (
          <Card className={styles.emptyCard}>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">
              {search.trim().length > 0 ? "Nothing matches that search yet." : "No notes yet."}
            </p>
            <p className={styles.emptyText}>
              {search.trim().length > 0
                ? "Try a different word or start a new note."
                : "Start a note, then add text, ayah cards, or dua cards where they belong."}
            </p>
            <Button
              className={styles.emptyAction}
              variant="secondary"
              onClick={() => void handleCreateNew("reflection")}
              disabled={!journalInteractionReady || isBusy}
            >
              <Plus size={16} />
              Write a reflection
            </Button>
          </Card>
        ) : null}

        {journalInteractionReady ? filteredEntries.map((entry) => renderCollapsedCard(entry)) : null}
      </div>
    </div>
  );
}
