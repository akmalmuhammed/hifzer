import type { QuranFoundationConnectionStatus } from "./types";

const ADVANCED_PERMISSION_LABEL =
  "reading place, streak, and notes";
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
  "Reconnect Quran.com. The saved connection has expired, so Hifzer cannot keep your reading place, bookmarks, and notes in sync.";

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
  if (param === "connected") return "Quran.com is connected.";
  if (param === "oauth-failed") return "Quran.com could not finish linking right now.";
  if (param === "already-linked") {
    return "This Quran.com account is already linked to another Hifzer account. Disconnect it there first, then try again here.";
  }
  if (param === "state-mismatch") return "Quran.com linking could not be verified. Please try again.";
  if (param === "not-configured") return "Quran.com linking is not available right now.";
  if (param === "sign-in-required") return "Sign in before connecting Quran.com.";
  if (param === "invalid_scope") {
    return `Quran.com has not enabled the newest ${ADVANCED_PERMISSION_LABEL} permissions for Hifzer yet. Please try again later.`;
  }
  return null;
}

export function getQuranFoundationProviderErrorMessage(
  code: string,
  description?: string | null,
): string {
  if (code === "invalid_scope") {
    return `Quran.com has not enabled the newest ${ADVANCED_PERMISSION_LABEL} permissions for Hifzer yet. Please try again later.`;
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
  return error.includes("invalid_scope") ||
    error.includes("not approved for the newer") ||
    error.includes("has not enabled the newest");
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
  if (
    error.includes("invalid_scope") ||
    error.includes("not approved for the newer") ||
    error.includes("has not enabled the newest")
  ) {
    return `Quran.com has not enabled the newest ${ADVANCED_PERMISSION_LABEL} permissions for Hifzer yet. Please try again later.`;
  }
  if (RECONNECT_ERROR_PATTERNS.some((pattern) => error.includes(pattern))) {
    return RECONNECT_MESSAGE;
  }
  return issue?.trim() ?? null;
}
