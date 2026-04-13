export const ONBOARDING_STEPS = [
  "assessment",
  "start-point",
  "complete",
] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export const ONBOARDING_START_LANES = [
  "hifz",
  "fluency",
  "listen",
  "transitions",
] as const;

export type OnboardingStartLane = typeof ONBOARDING_START_LANES[number];

const ONBOARDING_STEP_PATHS: Record<OnboardingStep, string> = {
  assessment: "/onboarding/assessment",
  "start-point": "/onboarding/start-point",
  complete: "/onboarding/complete",
};

const LEGACY_ONBOARDING_STEP_ALIASES = {
  welcome: "assessment",
  "plan-preview": "assessment",
  "fluency-check": "assessment",
  permissions: "assessment",
} as const;

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return typeof value === "string" && ONBOARDING_STEPS.includes(value as OnboardingStep);
}

export function normalizeOnboardingStep(value: unknown): OnboardingStep {
  if (isOnboardingStep(value)) {
    return value;
  }
  if (typeof value === "string" && value in LEGACY_ONBOARDING_STEP_ALIASES) {
    return LEGACY_ONBOARDING_STEP_ALIASES[value as keyof typeof LEGACY_ONBOARDING_STEP_ALIASES];
  }
  return "assessment";
}

export function onboardingStepRank(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function maxOnboardingStep(left: OnboardingStep, right: OnboardingStep): OnboardingStep {
  return onboardingStepRank(left) >= onboardingStepRank(right) ? left : right;
}

export function onboardingPathForStep(step: OnboardingStep): string {
  return ONBOARDING_STEP_PATHS[step];
}

export function isOnboardingStartLane(value: unknown): value is OnboardingStartLane {
  return typeof value === "string" && ONBOARDING_START_LANES.includes(value as OnboardingStartLane);
}

export function normalizeOnboardingStartLane(value: unknown): OnboardingStartLane | null {
  return isOnboardingStartLane(value) ? value : null;
}

export function canAccessOnboardingStep(currentStep: OnboardingStep, requestedStep: OnboardingStep): boolean {
  if (requestedStep === "assessment") {
    return true;
  }
  return onboardingStepRank(requestedStep) <= onboardingStepRank(currentStep);
}

export function canAdvanceOnboardingStep(currentStep: OnboardingStep, targetStep: OnboardingStep): boolean {
  return onboardingStepRank(targetStep) <= (onboardingStepRank(currentStep) + 1);
}
