import { describe, expect, it } from "vitest";
import {
  getQuranFoundationFeedbackLabel,
  hasQuranFoundationGrantedScope,
  humanizeQuranFoundationConnectionIssue,
  isQuranFoundationReconnectRequired,
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

  it("humanizes reconnect-required token errors", () => {
    expect(
      humanizeQuranFoundationConnectionIssue(
        "The provided authorization grant (e.g., authorization code, resource owner credentials) or refresh token is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client.",
      ),
    ).toContain("Reconnect Quran.com");
  });

  it("detects when a degraded account needs a reconnect", () => {
    expect(
      isQuranFoundationReconnectRequired({
        state: "degraded",
        lastError: "The access token is expired or inactive",
      }),
    ).toBe(true);
  });

  it("matches either broad or read-only Quran Foundation scopes", () => {
    expect(hasQuranFoundationGrantedScope(["goal"], "goal", "goal.read")).toBe(true);
    expect(hasQuranFoundationGrantedScope(["goal.read"], "goal", "goal.read")).toBe(true);
    expect(hasQuranFoundationGrantedScope(["bookmark"], "goal", "goal.read")).toBe(false);
  });
});
