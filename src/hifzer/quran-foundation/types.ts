export type QuranFoundationConnectionState =
  | "not_configured"
  | "disconnected"
  | "connected"
  | "degraded";

export type QuranFoundationConnectionStatus = {
  available: boolean;
  state: QuranFoundationConnectionState;
  detail: string;
  userApiReady: boolean;
  contentApiReady: boolean;
  displayName: string | null;
  email: string | null;
  quranFoundationUserId: string | null;
  scopes: string[];
  lastSyncedAt: string | null;
  lastError: string | null;
};

export type QuranFoundationReadingSessionSummary = {
  surahNumber: number;
  ayahNumber: number;
  updatedAt: string | null;
};

export type QuranFoundationStreakSummary = {
  currentDays: number;
  bestDays: number | null;
  activeCount: number;
};

export type QuranFoundationGoalPlanSummary = {
  type: string;
  title: string;
  remaining: string | null;
};

export type QuranFoundationCollectionsSummary = {
  count: number;
};

export type QuranFoundationNotesSummary = {
  count: number;
};

export type QuranFoundationConnectedOverview = {
  readingSession: QuranFoundationReadingSessionSummary | null;
  streak: QuranFoundationStreakSummary | null;
  goalPlan: QuranFoundationGoalPlanSummary | null;
  collections: QuranFoundationCollectionsSummary | null;
  notes: QuranFoundationNotesSummary | null;
};

export type QuranFoundationBookmarkProvider = "local" | "dual";

export type QuranFoundationBookmarkSyncState =
  | "not_linked"
  | "local_only"
  | "synced"
  | "error";

export class QuranFoundationError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryable: boolean;

  constructor(message: string, options?: { status?: number; code?: string; retryable?: boolean }) {
    super(message);
    this.name = "QuranFoundationError";
    this.status = options?.status ?? 500;
    this.code = options?.code ?? "quran_foundation_error";
    this.retryable = options?.retryable ?? (this.status >= 500 || this.status === 429);
  }
}

export function isQuranFoundationError(error: unknown): error is QuranFoundationError {
  return error instanceof QuranFoundationError;
}
