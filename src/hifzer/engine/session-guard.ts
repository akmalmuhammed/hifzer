import type { SrsGrade } from "@prisma/client";
import { isWarmupGatePassed } from "@/hifzer/engine/gates";
import type { SessionEventInput, SessionStep } from "@/hifzer/engine/types";

const MAX_AYAH_ID = 6236;

const STAGES = new Set<SessionEventInput["stage"]>([
  "WARMUP",
  "REVIEW",
  "NEW",
  "LINK",
  "WEEKLY_TEST",
  "LINK_REPAIR",
]);

const PHASES = new Set<SessionEventInput["phase"]>([
  "STANDARD",
  "NEW_EXPOSE",
  "NEW_GUIDED",
  "NEW_BLIND",
  "WEEKLY_TEST",
  "LINK_REPAIR",
]);

const GRADES = new Set<SrsGrade>(["AGAIN", "HARD", "GOOD", "EASY"]);

export class SessionGuardError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 400, code = "invalid_session_payload") {
    super(message);
    this.name = "SessionGuardError";
    this.status = status;
    this.code = code;
  }
}

export function isSessionGuardError(error: unknown): error is SessionGuardError {
  return error instanceof SessionGuardError;
}

function parsePositiveAyahId(value: unknown, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1 || parsed > MAX_AYAH_ID) {
    throw new SessionGuardError(`${field} must be an integer between 1 and ${MAX_AYAH_ID}.`);
  }
  return parsed;
}

function parseOptionalAyahId(value: unknown, field: string): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  return parsePositiveAyahId(value, field);
}

function parseStepIndex(value: unknown, fallback?: number): number {
  const parsed = value == null || value === ""
    ? fallback
    : Number(value);
  if (parsed == null || !Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    throw new SessionGuardError("stepIndex must be a non-negative integer.");
  }
  return parsed;
}

function parseStage(value: unknown): SessionEventInput["stage"] {
  if (typeof value !== "string") {
    throw new SessionGuardError("stage is required.");
  }
  const stage = value.trim() as SessionEventInput["stage"];
  if (!STAGES.has(stage)) {
    throw new SessionGuardError(`Unsupported stage: ${value}.`);
  }
  return stage;
}

function parsePhase(value: unknown): SessionEventInput["phase"] {
  if (typeof value !== "string") {
    throw new SessionGuardError("phase is required.");
  }
  const phase = value.trim() as SessionEventInput["phase"];
  if (!PHASES.has(phase)) {
    throw new SessionGuardError(`Unsupported phase: ${value}.`);
  }
  return phase;
}

function parseCreatedAt(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new SessionGuardError("createdAt is required.");
  }
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) {
    throw new SessionGuardError("createdAt must be a valid timestamp.");
  }
  return createdAt.toISOString();
}

function parseDuration(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new SessionGuardError("durationSec must be a non-negative number.");
  }
  return Math.floor(parsed);
}

function parseGrade(value: unknown): SrsGrade | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new SessionGuardError("grade must be a valid SRS grade.");
  }
  const grade = value.trim() as SrsGrade;
  if (!GRADES.has(grade)) {
    throw new SessionGuardError(`Unsupported grade: ${value}.`);
  }
  return grade;
}

function toBool(input: unknown): boolean {
  if (typeof input === "boolean") {
    return input;
  }
  if (typeof input === "string") {
    return input === "true" || input === "1";
  }
  if (typeof input === "number") {
    return input === 1;
  }
  return false;
}

export function deriveSessionPhase(
  stage: SessionEventInput["stage"],
  phaseRaw: unknown,
): SessionEventInput["phase"] {
  if (typeof phaseRaw === "string" && phaseRaw.trim()) {
    return parsePhase(phaseRaw);
  }
  if (stage === "NEW") {
    return "NEW_BLIND";
  }
  if (stage === "WEEKLY_TEST") {
    return "WEEKLY_TEST";
  }
  if (stage === "LINK_REPAIR") {
    return "LINK_REPAIR";
  }
  return "STANDARD";
}

export function parseSessionEventRow(
  row: unknown,
  input: { allowDerivedPhase?: boolean; fallbackStepIndex?: number } = {},
): SessionEventInput {
  if (!row || typeof row !== "object") {
    throw new SessionGuardError("Each session event must be an object.");
  }
  const raw = row as Record<string, unknown>;
  const stage = parseStage(raw.stage);

  return {
    stepIndex: parseStepIndex(raw.stepIndex, input.fallbackStepIndex),
    stage,
    phase: input.allowDerivedPhase ? deriveSessionPhase(stage, raw.phase) : parsePhase(raw.phase),
    ayahId: parsePositiveAyahId(raw.ayahId, "ayahId"),
    fromAyahId: parseOptionalAyahId(raw.fromAyahId, "fromAyahId"),
    toAyahId: parseOptionalAyahId(raw.toAyahId, "toAyahId"),
    grade: parseGrade(raw.grade),
    durationSec: parseDuration(raw.durationSec),
    textVisible: toBool(raw.textVisible),
    assisted: toBool(raw.assisted),
    createdAt: parseCreatedAt(raw.createdAt),
  };
}

export function parseSessionEventList(
  input: unknown,
  options: { allowDerivedPhase?: boolean; allowFallbackStepIndex?: boolean } = {},
): SessionEventInput[] {
  if (!Array.isArray(input)) {
    throw new SessionGuardError("events must be an array.");
  }
  return input.map((row, idx) =>
    parseSessionEventRow(row, {
      allowDerivedPhase: options.allowDerivedPhase,
      fallbackStepIndex: options.allowFallbackStepIndex ? idx : undefined,
    }),
  );
}

function stepRequiresGrade(step: SessionStep): boolean {
  if (step.kind === "LINK") {
    return true;
  }
  return !(step.stage === "NEW" && (step.phase === "NEW_EXPOSE" || step.phase === "NEW_GUIDED"));
}

function arraysEqual(left: number[], right: number[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function plannedNewAyahIds(steps: SessionStep[]): number[] {
  return uniqueSorted(
    steps
      .filter((step): step is Extract<SessionStep, { kind: "AYAH" }> => step.kind === "AYAH")
      .filter((step) => step.stage === "NEW")
      .map((step) => step.ayahId),
  );
}

function assertEventMatchesStep(step: SessionStep, event: SessionEventInput): void {
  if (step.kind === "AYAH") {
    if (event.stage !== step.stage || event.phase !== step.phase || event.ayahId !== step.ayahId) {
      throw new SessionGuardError("Submitted event does not match the planned ayah step.");
    }
    if (event.fromAyahId != null || event.toAyahId != null) {
      throw new SessionGuardError("Ayah steps must not include link endpoints.");
    }
  } else {
    if (
      event.stage !== step.stage ||
      event.phase !== step.phase ||
      event.ayahId !== step.toAyahId ||
      event.fromAyahId !== step.fromAyahId ||
      event.toAyahId !== step.toAyahId
    ) {
      throw new SessionGuardError("Submitted event does not match the planned link step.");
    }
  }

  if (stepRequiresGrade(step)) {
    if (!event.grade) {
      throw new SessionGuardError("A graded step is missing its grade.");
    }
  } else if (event.grade) {
    throw new SessionGuardError("Ungraded guidance steps must not submit a grade.");
  }
}

export type SessionPlanValidationResult = {
  acceptedEvents: SessionEventInput[];
  warmupPassed: boolean;
  warmupRetryUsed: boolean;
  weeklyPassed: boolean;
  gateBlocked: boolean;
  nextCursorAyahId: number;
};

export function validateSessionCompletionAgainstPlan(input: {
  events: SessionEventInput[];
  steps: SessionStep[];
  warmupRequired: boolean;
  weeklyGateRequired: boolean;
  cursorAyahIdAtStart: number;
  newAyahIds: number[];
}): SessionPlanValidationResult {
  const planNewAyahs = plannedNewAyahIds(input.steps);
  const expectedNewAyahs = uniqueSorted(input.newAyahIds);
  if (!arraysEqual(planNewAyahs, expectedNewAyahs)) {
    throw new SessionGuardError("Stored session metadata does not match the planned new ayah range.", 409, "session_plan_mismatch");
  }

  const requiredWarmupAyahs = uniqueSorted(
    input.steps
      .filter((step): step is Extract<SessionStep, { kind: "AYAH" }> => step.kind === "AYAH")
      .filter((step) => step.stage === "WARMUP")
      .map((step) => step.ayahId),
  );
  const requiredWeeklyAyahs = uniqueSorted(
    input.steps
      .filter((step): step is Extract<SessionStep, { kind: "AYAH" }> => step.kind === "AYAH")
      .filter((step) => step.stage === "WEEKLY_TEST")
      .map((step) => step.ayahId),
  );

  if (input.warmupRequired && requiredWarmupAyahs.length < 1) {
    throw new SessionGuardError("Warm-up was required but no warm-up plan was stored.", 409, "session_plan_mismatch");
  }
  if (input.weeklyGateRequired && requiredWeeklyAyahs.length < 1) {
    throw new SessionGuardError("Weekly gate was required but no weekly plan was stored.", 409, "session_plan_mismatch");
  }

  const latestWarmup = new Map<number, SrsGrade>();
  const latestWeekly = new Map<number, SrsGrade>();
  const latestNewBlind = new Map<number, SrsGrade>();
  const seenSingleAttemptSteps = new Set<number>();

  for (const event of input.events) {
    const plannedStep = input.steps[event.stepIndex];
    if (!plannedStep) {
      throw new SessionGuardError(`stepIndex ${event.stepIndex} is outside the planned session.`);
    }

    if (plannedStep.stage !== "WARMUP") {
      if (seenSingleAttemptSteps.has(event.stepIndex)) {
        throw new SessionGuardError(`stepIndex ${event.stepIndex} was submitted more than once.`);
      }
      seenSingleAttemptSteps.add(event.stepIndex);
    }

    assertEventMatchesStep(plannedStep, event);

    if (plannedStep.kind === "AYAH" && plannedStep.stage === "WARMUP" && event.grade) {
      latestWarmup.set(plannedStep.ayahId, event.grade);
    }
    if (plannedStep.kind === "AYAH" && plannedStep.stage === "WEEKLY_TEST" && event.grade) {
      latestWeekly.set(plannedStep.ayahId, event.grade);
    }
    if (
      plannedStep.kind === "AYAH" &&
      plannedStep.stage === "NEW" &&
      plannedStep.phase === "NEW_BLIND" &&
      event.grade
    ) {
      latestNewBlind.set(plannedStep.ayahId, event.grade);
    }
  }

  if (input.warmupRequired) {
    for (const ayahId of requiredWarmupAyahs) {
      if (!latestWarmup.has(ayahId)) {
        throw new SessionGuardError("Warm-up completion is missing required ayah grades.", 409, "missing_gate_evidence");
      }
    }
  }
  if (input.weeklyGateRequired) {
    for (const ayahId of requiredWeeklyAyahs) {
      if (!latestWeekly.has(ayahId)) {
        throw new SessionGuardError("Weekly gate completion is missing required ayah grades.", 409, "missing_gate_evidence");
      }
    }
  }

  const warmupPassed = isWarmupGatePassed(Array.from(latestWarmup.values()));
  const weeklyPassed = isWarmupGatePassed(Array.from(latestWeekly.values()));
  const warmupRetryUsed = input.events.filter((event) => event.stage === "WARMUP" && event.grade).length > latestWarmup.size;
  const gateBlocked = !warmupPassed || (input.weeklyGateRequired && !weeklyPassed);

  let nextCursorAyahId = input.cursorAyahIdAtStart;
  if (!gateBlocked) {
    let cursor = input.cursorAyahIdAtStart;
    for (const ayahId of expectedNewAyahs) {
      if (ayahId !== cursor) {
        break;
      }
      const grade = latestNewBlind.get(ayahId);
      if (grade === "GOOD" || grade === "EASY") {
        cursor = ayahId + 1;
        continue;
      }
      break;
    }
    const maxAllowedCursor = expectedNewAyahs.length
      ? expectedNewAyahs[expectedNewAyahs.length - 1] + 1
      : input.cursorAyahIdAtStart;
    nextCursorAyahId = Math.min(cursor, maxAllowedCursor);
  }

  return {
    acceptedEvents: input.events,
    warmupPassed,
    warmupRetryUsed,
    weeklyPassed,
    gateBlocked,
    nextCursorAyahId,
  };
}
