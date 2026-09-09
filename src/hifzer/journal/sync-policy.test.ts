import { describe, expect, it } from "vitest";
import { classifyJournalMutationFailure } from "./sync-policy";

describe("classifyJournalMutationFailure", () => {
  it.each([null, 408, 425, 429, 500, 503])("auto-retries transient status %s", (status) => {
    expect(classifyJournalMutationFailure(status, "TRANSIENT").retryable).toBe(true);
  });

  it.each([400, 401, 403, 404, 409, 410, 422])("retains status %s for review without auto-retry", (status) => {
    expect(classifyJournalMutationFailure(status, "REJECTED").retryable).toBe(false);
  });

  it("recognizes only version and client-entry collisions as content conflicts", () => {
    expect(classifyJournalMutationFailure(409, "VERSION_CONFLICT").conflict).toBe(true);
    expect(classifyJournalMutationFailure(409, "CLIENT_ENTRY_ID_CONFLICT").conflict).toBe(true);
    expect(classifyJournalMutationFailure(409, "OWNER_MISMATCH").conflict).toBe(false);
    expect(classifyJournalMutationFailure(409, "MUTATION_ID_REUSED").conflict).toBe(false);
  });
});
