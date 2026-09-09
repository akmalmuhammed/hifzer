export const NEXT_ACTION_SCHEMA_VERSION = 1 as const;

export type NextActionKind =
  | "resume_hifz"
  | "review_hifz"
  | "continue_quran"
  | "begin_quran";

export type NextActionReason =
  | "open_hifz_session"
  | "hifz_review_due"
  | "reading_place_available"
  | "first_reading";

export type NextAction = {
  schemaVersion: typeof NEXT_ACTION_SCHEMA_VERSION;
  kind: NextActionKind;
  reason: NextActionReason;
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
};

export type NextActionInput = {
  openHifzSessions: number;
  dueHifzReviews: number;
  quranCursorAyahId: number;
  quranCursorRef: string;
  currentSurahName: string;
};

function safeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function buildQuranResumeAction(input: Pick<
  NextActionInput,
  "quranCursorAyahId" | "quranCursorRef" | "currentSurahName"
>): NextAction {
  const cursorAyahId = Math.max(1, Math.floor(input.quranCursorAyahId || 1));
  const hasReadingPlace = cursorAyahId > 1;
  return {
    schemaVersion: NEXT_ACTION_SCHEMA_VERSION,
    kind: hasReadingPlace ? "continue_quran" : "begin_quran",
    reason: hasReadingPlace ? "reading_place_available" : "first_reading",
    href: `/quran/read?view=compact&cursor=${cursorAyahId}`,
    eyebrow: hasReadingPlace ? "Your next Qur'an action" : "A calm place to begin",
    title: hasReadingPlace ? `Continue from ${input.quranCursorRef}` : "Begin with Al-Fatihah",
    description: hasReadingPlace
      ? `Return to ${input.currentSurahName} at the exact ayah where you left off.`
      : "Open the reader at the beginning. Your place will be remembered as you continue.",
    actionLabel: hasReadingPlace ? "Resume reading" : "Start reading",
  };
}

/**
 * Deterministic cross-lane recommendation used by Today. An interrupted Hifz
 * session wins first, then work that is due, then the last Qur'an reading
 * place. The reason code keeps the decision inspectable and testable.
 */
export function resolveNextAction(input: NextActionInput): NextAction {
  const openHifzSessions = safeCount(input.openHifzSessions);
  if (openHifzSessions > 0) {
    return {
      schemaVersion: NEXT_ACTION_SCHEMA_VERSION,
      kind: "resume_hifz",
      reason: "open_hifz_session",
      href: "/hifz",
      eyebrow: "Continue what you started",
      title: "Resume your Hifz session",
      description: "Your open session is waiting, so you can continue without rebuilding the plan.",
      actionLabel: "Resume Hifz",
    };
  }

  const dueHifzReviews = safeCount(input.dueHifzReviews);
  if (dueHifzReviews > 0) {
    return {
      schemaVersion: NEXT_ACTION_SCHEMA_VERSION,
      kind: "review_hifz",
      reason: "hifz_review_due",
      href: "/hifz",
      eyebrow: "Recommended next",
      title: `Review ${dueHifzReviews} due ayah${dueHifzReviews === 1 ? "" : "s"}`,
      description: "Review comes first because these ayahs are ready to be strengthened now.",
      actionLabel: "Start review",
    };
  }

  return buildQuranResumeAction(input);
}
