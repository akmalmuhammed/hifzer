const JOURNAL_OWNER_STORAGE_LOCK_PREFIX = "hifzer:private-journal-storage:";
const LOCAL_STATE_OWNER_KEY = "hifzer_local_state_owner_v1";

export type JournalOwnerStorageLockFailureReason =
  | "locking-unavailable"
  | "locking-failed"
  | "owner-mismatch"
  | "owner-check-failed";

export type JournalOwnerStorageLockResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: JournalOwnerStorageLockFailureReason };

export type JournalOwnerStorageLockOptions = {
  /** Reject the operation unless the durable browser owner still matches. */
  requireActiveOwner?: boolean;
};

function normalizeOwnerId(ownerId: string): string | null {
  if (typeof ownerId !== "string") {
    return null;
  }
  const normalized = ownerId.trim();
  return normalized.length > 0 ? normalized : null;
}

/**
 * Runs one account-journal storage operation under an origin-wide, per-owner
 * Web Lock. Web Locks are the mutual-exclusion primitive shared by every tab
 * and worker for an origin, unlike an in-memory mutex which protects one tab
 * only.
 *
 * There is deliberately no optimistic fallback. Without Web Locks, a
 * read-modify-write localStorage operation cannot truthfully claim cross-tab
 * durability, so callers must preserve the open draft and surface the failure.
 */
export async function withJournalOwnerStorageLock<T>(
  ownerId: string,
  operation: () => T | Promise<T>,
  options: JournalOwnerStorageLockOptions = {},
): Promise<JournalOwnerStorageLockResult<T>> {
  const normalizedOwnerId = normalizeOwnerId(ownerId);
  if (!normalizedOwnerId) {
    return { ok: false, reason: "locking-unavailable" };
  }

  try {
    const lockManager = typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (!lockManager || typeof lockManager.request !== "function") {
      return { ok: false, reason: "locking-unavailable" };
    }
    const result: JournalOwnerStorageLockResult<T> = await lockManager.request(
      `${JOURNAL_OWNER_STORAGE_LOCK_PREFIX}${normalizedOwnerId}`,
      { mode: "exclusive" },
      async (): Promise<JournalOwnerStorageLockResult<T>> => {
        if (options.requireActiveOwner) {
          try {
            if (
              typeof window === "undefined" ||
              !window.localStorage ||
              window.localStorage.getItem(LOCAL_STATE_OWNER_KEY) !== normalizedOwnerId
            ) {
              return { ok: false, reason: "owner-mismatch" };
            }
          } catch {
            return { ok: false, reason: "owner-check-failed" };
          }
        }
        return { ok: true, value: await operation() };
      },
    );
    return result;
  } catch {
    return { ok: false, reason: "locking-failed" };
  }
}
