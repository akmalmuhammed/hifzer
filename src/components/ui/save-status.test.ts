import { describe, expect, it } from "vitest";
import { getSaveStatusCopy, resolveSaveStatusState } from "./save-status";

const base = {
  issueDestination: null,
  isSaving: false,
  isDirty: false,
  hasPersistedDraft: false,
  savedDestination: null,
} as const;

describe("resolveSaveStatusState", () => {
  it("does not surface a stale success destination for a new draft", () => {
    expect(resolveSaveStatusState({
      ...base,
      savedDestination: "device",
    })).toEqual({ kind: "not-saved" });
  });

  it("shows dirty edits instead of a prior successful save", () => {
    expect(resolveSaveStatusState({
      ...base,
      isDirty: true,
      hasPersistedDraft: true,
      savedDestination: "account",
    })).toEqual({ kind: "dirty" });
  });

  it("shows the confirmed destination for a persisted clean draft", () => {
    expect(resolveSaveStatusState({
      ...base,
      hasPersistedDraft: true,
      savedDestination: "device",
    })).toEqual({ kind: "saved", destination: "device" });
  });

  it("keeps a storage failure visible until another save starts or succeeds", () => {
    expect(resolveSaveStatusState({
      ...base,
      issueDestination: "device",
      isDirty: true,
    })).toEqual({ kind: "error", destination: "device" });
    expect(resolveSaveStatusState({
      ...base,
      issueDestination: "device",
      isSaving: true,
      isDirty: true,
    })).toEqual({ kind: "saving" });
  });

  it("distinguishes a verified offline queue from an account save", () => {
    expect(resolveSaveStatusState({
      ...base,
      hasPersistedDraft: true,
      savedDestination: "device",
      isQueued: true,
    })).toEqual({ kind: "queued" });
  });

  it("keeps conflicts visible above ordinary save state", () => {
    expect(resolveSaveStatusState({
      ...base,
      hasPersistedDraft: true,
      savedDestination: "account",
      isQueued: true,
      hasConflict: true,
    })).toEqual({ kind: "conflict" });
  });

  it("keeps a terminal queued change in a distinct review state", () => {
    expect(resolveSaveStatusState({
      ...base,
      hasPersistedDraft: true,
      savedDestination: "device",
      needsReview: true,
    })).toEqual({ kind: "review" });
  });

  it("describes dirty and saving states as automatic saves", () => {
    expect(getSaveStatusCopy({ kind: "dirty" })).toEqual({
      title: "Saving shortly…",
      detail: "Keep writing—changes save automatically.",
    });
    expect(getSaveStatusCopy({ kind: "saving" })).toEqual({
      title: "Saving…",
      detail: "Keep writing while this browser verifies the latest copy.",
    });
  });
});
