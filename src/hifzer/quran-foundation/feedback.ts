import type { QuranFoundationConnectionStatus } from "./types";

const ADVANCED_SCOPE_LABEL =
  "streak, goal, and notes";
const RECONNECT_ERROR_PATTERNS = [
  "invalid_grant",
  "authorization grant",
  "refresh token",
  "access token is expired or inactive",
  "expired or inactive",
  "issued to another client",
  "does not match the redirection uri",
  "revoked",
] as const;

const RECONNECT_MESSAGE =
  "Reconnect Quran.com. The stored authorization is no longer valid, so Hifzer cannot refresh the sync token.";

function normalizeError(input: string | null | undefined): string {
  return input?.trim().toLowerCase() ?? "";
}

export function hasQuranFoundationGrantedScope(
  scopes: string[] | string | null | undefined,
  ...candidates: string[]
): boolean {
  const values = Array.isArray(scopes) ? scopes : typeof scopes === "string" ? scopes.split(/\s+/) : [];
  const granted = new Set(values.map((value) => value.trim()).filter(Boolean));
  return candidates.some((candidate) => granted.has(candidate));
}

export function getQuranFoundationFeedbackLabel(param: string | null): string | null {
  if (param === "connected") return "Quran.com account linked.";
  if (param === "oauth-failed") return "The Quran.com OAuth exchange failed.";
  if (param === "already-linked") {
    return "This Quran.com account is already linked to another Hifzer account. Disconnect it there before linking here.";
  }
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
  return humanizeQuranFoundationConnectionIssue(description?.trim() || code) ?? code;
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

export function isQuranFoundationReconnectRequired(
  status: Pick<QuranFoundationConnectionStatus, "state" | "lastError"> | null | undefined,
): boolean {
  if (!status || status.state !== "degraded") {
    return false;
  }
  const error = normalizeError(status.lastError);
  return RECONNECT_ERROR_PATTERNS.some((pattern) => error.includes(pattern));
}

export function humanizeQuranFoundationConnectionIssue(
  issue: string | null | undefined,
): string | null {
  const error = normalizeError(issue);
  if (!error) {
    return null;
  }
  if (error.includes("invalid_scope") || error.includes("not approved for the newer")) {
    return `Quran.com rejected the reauthorization request because this OAuth client is not approved for the newer ${ADVANCED_SCOPE_LABEL} scopes yet.`;
  }
  if (RECONNECT_ERROR_PATTERNS.some((pattern) => error.includes(pattern))) {
    return RECONNECT_MESSAGE;
  }
  return issue?.trim() ?? null;
}
