export type JournalMutationFailurePolicy = {
  retryable: boolean;
  conflict: boolean;
};

const JOURNAL_CONFLICT_CODES = new Set([
  "VERSION_CONFLICT",
  "CLIENT_ENTRY_ID_CONFLICT",
]);

/** Only transport failures and explicitly transient HTTP responses auto-retry. */
export function classifyJournalMutationFailure(
  status: number | null,
  code: string,
): JournalMutationFailurePolicy {
  return {
    conflict: JOURNAL_CONFLICT_CODES.has(code),
    retryable:
      status === null ||
      status === 408 ||
      status === 425 ||
      status === 429 ||
      (status >= 500 && status <= 599),
  };
}
