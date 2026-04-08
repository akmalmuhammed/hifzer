export const ONBOARDING_STEPS = [
  "welcome",
  "assessment",
  "start-point",
  "plan-preview",
  "fluency-check",
  "permissions",
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
  welcome: "/onboarding/welcome",
  assessment: "/onboarding/assessment",
  "start-point": "/onboarding/start-point",
  "plan-preview": "/onboarding/plan-preview",
  "fluency-check": "/onboarding/fluency-check",
  permissions: "/onboarding/permissions",
  complete: "/onboarding/complete",
};

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return typeof value === "string" && ONBOARDING_STEPS.includes(value as OnboardingStep);
}

export function normalizeOnboardingStep(value: unknown): OnboardingStep {
  return isOnboardingStep(value) ? value : "welcome";
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
  if (requestedStep === "welcome" || requestedStep === "assessment") {
    return true;
  }
  return onboardingStepRank(requestedStep) <= onboardingStepRank(currentStep);
}

export function canAdvanceOnboardingStep(currentStep: OnboardingStep, targetStep: OnboardingStep): boolean {
  return onboardingStepRank(targetStep) <= (onboardingStepRank(currentStep) + 1);
}
