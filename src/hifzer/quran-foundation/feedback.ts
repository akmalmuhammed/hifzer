import type { QuranFoundationConnectionStatus } from "./types";

const ADVANCED_SCOPE_LABEL =
  "streak, goal, and notes";

export function getQuranFoundationFeedbackLabel(param: string | null): string | null {
  if (param === "connected") return "Quran.com account linked.";
  if (param === "oauth-failed") return "The Quran.com OAuth exchange failed.";
  if (param === "state-mismatch") return "The Quran.com OAuth state check failed.";
  if (param === "not-configured") return "Quran.com linking is not configured yet.";
  if (param === "sign-in-required") return "Sign in before linking a Quran.com account.";
  if (param === "invalid_scope") {
    return `Quran.com rejected the reauthorization request because this OAuth client is not approved for the newer ${ADVANCED_SCOPE_LABEL} scopes yet.`;
  }
  return null;
}

export function getQuranFoundationProviderErrorMessage(
  code: string,
  description?: string | null,
): string {
  if (code === "invalid_scope") {
    return `Quran.com rejected the reauthorization request because this OAuth client is not approved for the newer ${ADVANCED_SCOPE_LABEL} scopes yet.`;
  }
  if (code === "access_denied") {
    return description?.trim() || "Quran.com authorization was cancelled.";
  }
  return description?.trim() || code;
}

export function isQuranFoundationScopeApprovalBlocked(
  status: Pick<QuranFoundationConnectionStatus, "lastError"> | null | undefined,
  feedbackParam?: string | null,
): boolean {
  if (feedbackParam === "invalid_scope") {
    return true;
  }
  const error = status?.lastError?.toLowerCase() ?? "";
  return error.includes("invalid_scope") || error.includes("not approved for the newer");
}
