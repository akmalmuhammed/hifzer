import { describe, expect, it } from "vitest";
import {
  getQuranFoundationFeedbackLabel,
  getQuranFoundationProviderErrorMessage,
  isQuranFoundationScopeApprovalBlocked,
} from "./feedback";

describe("quran foundation feedback helpers", () => {
  it("returns a clear message for invalid_scope redirects", () => {
    expect(getQuranFoundationFeedbackLabel("invalid_scope")).toContain("not approved");
  });

  it("maps invalid_scope provider errors to a friendly stored message", () => {
    expect(getQuranFoundationProviderErrorMessage("invalid_scope", "scope mismatch")).toContain(
      "not approved",
    );
  });

  it("detects scope approval blocks from query feedback", () => {
    expect(isQuranFoundationScopeApprovalBlocked({ lastError: null }, "invalid_scope")).toBe(true);
  });

  it("detects scope approval blocks from stored lastError", () => {
    expect(
      isQuranFoundationScopeApprovalBlocked({
        lastError:
          "Quran.com rejected the reauthorization request because this OAuth client is not approved for the newer streak, goal, reading-session, collection, and notes scopes yet.",
      }),
    ).toBe(true);
  });
});
