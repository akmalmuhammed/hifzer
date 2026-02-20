import type { AyahReviewState, SrsGrade, SrsMode, TodayQueue } from "@/hifzer/srs/types";
import { defaultReviewState, applyGrade } from "@/hifzer/srs/update";
import { isoDateLocal } from "@/hifzer/derived/dates";

export const STORAGE_KEYS = {
  onboardingCompleted: "hifzer_onboarding_completed_v1",
  activeSurahNumber: "hifzer_active_surah_number_v1",
  cursorAyahId: "hifzer_cursor_ayah_id_v1",

  srsReviews: "hifzer_srs_reviews_v1",
  attempts: "hifzer_attempts_v1",
  openSession: "hifzer_open_session_v1",
  sessions: "hifzer_sessions_v1",
  lastCompletedLocalDate: "hifzer_last_completed_local_date_v1",
  pendingSessionSync: "hifzer_pending_session_events_v2",
  bookmarks: "hifzer_bookmarks_v1",
  pendingBookmarkSync: "hifzer_pending_bookmark_sync_v1",
  cutoverApplied: "hifzer_cutover_v3_applied",
} as const;

type StoredReview = Omit<AyahReviewState, "nextReviewAt" | "lastReviewAt"> & {
  nextReviewAt: string;
  lastReviewAt?: string;
};

type ReviewStore = Record<string, StoredReview>;

export type AttemptStage = "WARMUP" | "REVIEW" | "NEW" | "LINK";

export type StoredAttempt = {
  id: string;
  sessionId: string;
  ayahId: number;
  stage: AttemptStage;
  grade: SrsGrade;
  createdAt: string;
};

export type SessionStatus = "OPEN" | "COMPLETED" | "ABANDONED";

export type StoredSession = {
  id: string;
  status: SessionStatus;
  localDate: string; // YYYY-MM-DD
  startedAt: string;
  endedAt?: string;
  activeSurahNumber: number;
  cursorAyahIdAtStart: number;
  queue: TodayQueue;
  stepIndex: number;
};

const MAX_STORED_ATTEMPTS = 2000;
const MAX_PENDING_BOOKMARK_MUTATIONS = 200;

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

export function getOnboardingCompleted(): boolean {
  if (!isBrowser()) {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEYS.onboardingCompleted) === "1";
}

export function setOnboardingCompleted() {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.onboardingCompleted, "1");
}

export function getActiveSurahNumber(): number | null {
  if (!isBrowser()) {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEYS.activeSurahNumber);
  if (!raw) {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function getCursorAyahId(): number | null {
  if (!isBrowser()) {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEYS.cursorAyahId);
  if (!raw) {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function setActiveSurahCursor(activeSurahNumber: number, cursorAyahId: number) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.activeSurahNumber, String(activeSurahNumber));
  window.localStorage.setItem(STORAGE_KEYS.cursorAyahId, String(cursorAyahId));
}

export function getLastCompletedLocalDate(): string | null {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEYS.lastCompletedLocalDate);
}

export function setLastCompletedLocalDate(isoLocalDate: string) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.lastCompletedLocalDate, isoLocalDate);
}

function readReviewStore(): ReviewStore {
  if (!isBrowser()) {
    return {};
  }
  return safeJsonParse<ReviewStore>(window.localStorage.getItem(STORAGE_KEYS.srsReviews)) ?? {};
}

function writeReviewStore(store: ReviewStore) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.srsReviews, JSON.stringify(store));
}

function toStoredReview(state: AyahReviewState): StoredReview {
  return {
    ...state,
    nextReviewAt: state.nextReviewAt.toISOString(),
    lastReviewAt: state.lastReviewAt ? state.lastReviewAt.toISOString() : undefined,
  };
}

function fromStoredReview(stored: StoredReview): AyahReviewState {
  const withDefaults = stored as StoredReview & {
    checkpointIndex?: number;
    nextIntervalMinutes?: number;
    lastDurationSec?: number;
  };
  return {
    ...withDefaults,
    checkpointIndex: Number.isFinite(withDefaults.checkpointIndex) ? Number(withDefaults.checkpointIndex) : 0,
    nextIntervalMinutes: Number.isFinite(withDefaults.nextIntervalMinutes)
      ? Number(withDefaults.nextIntervalMinutes)
      : 1440,
    lastDurationSec: Number.isFinite(withDefaults.lastDurationSec) ? Number(withDefaults.lastDurationSec) : undefined,
    nextReviewAt: new Date(stored.nextReviewAt),
    lastReviewAt: stored.lastReviewAt ? new Date(stored.lastReviewAt) : undefined,
  };
}

export function listAllReviews(): AyahReviewState[] {
  const store = readReviewStore();
  return Object.values(store).map(fromStoredReview);
}

export function getReviewState(ayahId: number): AyahReviewState | null {
  const store = readReviewStore();
  const stored = store[String(ayahId)];
  return stored ? fromStoredReview(stored) : null;
}

export function upsertReviewAndApplyGrade(ayahId: number, grade: SrsGrade, now: Date): AyahReviewState {
  const store = readReviewStore();
  const key = String(ayahId);
  const current = store[key] ? fromStoredReview(store[key]!) : defaultReviewState(ayahId, now);
  const next = applyGrade(current, grade, now);
  store[key] = toStoredReview(next);
  writeReviewStore(store);
  return next;
}

export function listDueReviews(now: Date): AyahReviewState[] {
  const store = readReviewStore();
  const out: AyahReviewState[] = [];
  for (const raw of Object.values(store)) {
    const state = fromStoredReview(raw);
    if (state.nextReviewAt.getTime() <= now.getTime()) {
      out.push(state);
    }
  }
  return out;
}

export function appendAttempt(input: Omit<StoredAttempt, "id" | "createdAt"> & { createdAt?: Date }) {
  if (!isBrowser()) {
    return;
  }
  const items = safeJsonParse<StoredAttempt[]>(window.localStorage.getItem(STORAGE_KEYS.attempts)) ?? [];
  const createdAt = input.createdAt ? input.createdAt.toISOString() : new Date().toISOString();
  const item: StoredAttempt = {
    id: `a_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    sessionId: input.sessionId,
    ayahId: input.ayahId,
    stage: input.stage,
    grade: input.grade,
    createdAt,
  };
  items.push(item);
  const trimmed = items.length > MAX_STORED_ATTEMPTS
    ? items.slice(items.length - MAX_STORED_ATTEMPTS)
    : items;
  window.localStorage.setItem(STORAGE_KEYS.attempts, JSON.stringify(trimmed));
}

export function listAttempts(): StoredAttempt[] {
  if (!isBrowser()) {
    return [];
  }
  return safeJsonParse<StoredAttempt[]>(window.localStorage.getItem(STORAGE_KEYS.attempts)) ?? [];
}

export function getOpenSession(): StoredSession | null {
  if (!isBrowser()) {
    return null;
  }
  return safeJsonParse<StoredSession>(window.localStorage.getItem(STORAGE_KEYS.openSession));
}

export function setOpenSession(session: StoredSession | null) {
  if (!isBrowser()) {
    return;
  }
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEYS.openSession);
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.openSession, JSON.stringify(session));
}

export function archiveSession(session: StoredSession) {
  if (!isBrowser()) {
    return;
  }
  const items = safeJsonParse<StoredSession[]>(window.localStorage.getItem(STORAGE_KEYS.sessions)) ?? [];
  items.unshift(session);
  window.localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(items.slice(0, 90)));
}

export function listArchivedSessions(): StoredSession[] {
  if (!isBrowser()) {
    return [];
  }
  return safeJsonParse<StoredSession[]>(window.localStorage.getItem(STORAGE_KEYS.sessions)) ?? [];
}

export function newSessionId(now: Date): string {
  return `s_${now.getTime()}_${Math.random().toString(16).slice(2)}`;
}

export function todayIsoLocalDate(now: Date): string {
  return isoDateLocal(now);
}

export function formatModeLabel(mode: SrsMode): string {
  if (mode === "CATCH_UP") {
    return "Catch-up";
  }
  if (mode === "CONSOLIDATION") {
    return "Consolidation";
  }
  return "Normal";
}

export type PendingSessionSyncPayload = {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  localDate: string;
  events: Array<{
    stepIndex: number;
    stage: "WARMUP" | "REVIEW" | "NEW" | "LINK" | "WEEKLY_TEST" | "LINK_REPAIR";
    phase: "STANDARD" | "NEW_EXPOSE" | "NEW_GUIDED" | "NEW_BLIND" | "WEEKLY_TEST" | "LINK_REPAIR";
    ayahId: number;
    fromAyahId?: number;
    toAyahId?: number;
    grade?: "AGAIN" | "HARD" | "GOOD" | "EASY";
    durationSec: number;
    textVisible?: boolean;
    assisted?: boolean;
    createdAt: string;
  }>;
};

export function getPendingSessionSyncPayloads(): PendingSessionSyncPayload[] {
  if (!isBrowser()) {
    return [];
  }
  return safeJsonParse<PendingSessionSyncPayload[]>(
    window.localStorage.getItem(STORAGE_KEYS.pendingSessionSync),
  ) ?? [];
}

export function pushPendingSessionSyncPayload(payload: PendingSessionSyncPayload) {
  if (!isBrowser()) {
    return;
  }
  const current = getPendingSessionSyncPayloads();
  current.push(payload);
  window.localStorage.setItem(STORAGE_KEYS.pendingSessionSync, JSON.stringify(current.slice(-20)));
}

export function replacePendingSessionSyncPayloads(payloads: PendingSessionSyncPayload[]) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.pendingSessionSync, JSON.stringify(payloads.slice(-20)));
}

export type StoredBookmarkCategory = {
  id: string;
  name: string;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredBookmark = {
  id: string;
  ayahId: number;
  surahNumber: number;
  ayahNumber: number;
  name: string;
  note: string | null;
  categoryId: string | null;
  isPinned: boolean;
  version: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: StoredBookmarkCategory | null;
};

export type StoredBookmarkState = {
  categories: StoredBookmarkCategory[];
  bookmarks: StoredBookmark[];
  syncedAt: string | null;
};

export type PendingBookmarkSyncMutationType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "RESTORE"
  | "CATEGORY_CREATE"
  | "CATEGORY_UPDATE"
  | "CATEGORY_DELETE";

export type PendingBookmarkSyncMutation = {
  clientMutationId: string;
  type: PendingBookmarkSyncMutationType;
  bookmarkId?: string;
  categoryId?: string;
  expectedVersion?: number;
  data?: Record<string, unknown>;
  queuedAt: string;
};

function emptyBookmarkState(): StoredBookmarkState {
  return {
    categories: [],
    bookmarks: [],
    syncedAt: null,
  };
}

export function getStoredBookmarkState(): StoredBookmarkState {
  if (!isBrowser()) {
    return emptyBookmarkState();
  }
  return safeJsonParse<StoredBookmarkState>(window.localStorage.getItem(STORAGE_KEYS.bookmarks)) ?? emptyBookmarkState();
}

export function replaceStoredBookmarkState(state: StoredBookmarkState) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(state));
}

export function upsertStoredBookmarkCategory(category: StoredBookmarkCategory) {
  if (!isBrowser()) {
    return;
  }
  const state = getStoredBookmarkState();
  const next = state.categories.filter((x) => x.id !== category.id);
  next.push(category);
  next.sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));
  replaceStoredBookmarkState({
    ...state,
    categories: next,
    syncedAt: state.syncedAt,
  });
}

export function upsertStoredBookmark(bookmark: StoredBookmark) {
  if (!isBrowser()) {
    return;
  }
  const state = getStoredBookmarkState();
  const next = state.bookmarks.filter((x) => x.id !== bookmark.id);
  next.push(bookmark);
  next.sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  replaceStoredBookmarkState({
    ...state,
    bookmarks: next,
    syncedAt: state.syncedAt,
  });
}

export function removeStoredBookmark(bookmarkId: string) {
  if (!isBrowser()) {
    return;
  }
  const state = getStoredBookmarkState();
  replaceStoredBookmarkState({
    ...state,
    bookmarks: state.bookmarks.filter((x) => x.id !== bookmarkId),
  });
}

export function getPendingBookmarkSyncMutations(): PendingBookmarkSyncMutation[] {
  if (!isBrowser()) {
    return [];
  }
  return safeJsonParse<PendingBookmarkSyncMutation[]>(
    window.localStorage.getItem(STORAGE_KEYS.pendingBookmarkSync),
  ) ?? [];
}

export function pushPendingBookmarkSyncMutation(payload: Omit<PendingBookmarkSyncMutation, "queuedAt"> & { queuedAt?: string }) {
  if (!isBrowser()) {
    return;
  }
  const current = getPendingBookmarkSyncMutations();
  current.push({
    ...payload,
    queuedAt: payload.queuedAt ?? new Date().toISOString(),
  });
  window.localStorage.setItem(
    STORAGE_KEYS.pendingBookmarkSync,
    JSON.stringify(current.slice(-MAX_PENDING_BOOKMARK_MUTATIONS)),
  );
}

export function replacePendingBookmarkSyncMutations(payloads: PendingBookmarkSyncMutation[]) {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEYS.pendingBookmarkSync,
    JSON.stringify(payloads.slice(-MAX_PENDING_BOOKMARK_MUTATIONS)),
  );
}

export function applyFreshStartBridge() {
  if (!isBrowser()) {
    return;
  }
  if (window.localStorage.getItem(STORAGE_KEYS.cutoverApplied) === "1") {
    return;
  }
  const keepOnboarding = window.localStorage.getItem(STORAGE_KEYS.onboardingCompleted);
  const keepSurah = window.localStorage.getItem(STORAGE_KEYS.activeSurahNumber);
  const keepCursor = window.localStorage.getItem(STORAGE_KEYS.cursorAyahId);

  window.localStorage.removeItem(STORAGE_KEYS.srsReviews);
  window.localStorage.removeItem(STORAGE_KEYS.attempts);
  window.localStorage.removeItem(STORAGE_KEYS.openSession);
  window.localStorage.removeItem(STORAGE_KEYS.sessions);
  window.localStorage.removeItem(STORAGE_KEYS.lastCompletedLocalDate);

  if (keepOnboarding) {
    window.localStorage.setItem(STORAGE_KEYS.onboardingCompleted, keepOnboarding);
  }
  if (keepSurah) {
    window.localStorage.setItem(STORAGE_KEYS.activeSurahNumber, keepSurah);
  }
  if (keepCursor) {
    window.localStorage.setItem(STORAGE_KEYS.cursorAyahId, keepCursor);
  }
  window.localStorage.setItem(STORAGE_KEYS.cutoverApplied, "1");
}
