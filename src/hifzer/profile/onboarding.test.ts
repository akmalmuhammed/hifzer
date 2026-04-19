import { describe, expect, it } from "vitest";
import {
  canAccessOnboardingStep,
  canAdvanceOnboardingStep,
  normalizeOnboardingStep,
  onboardingPathForStep,
} from "./onboarding";

describe("profile/onboarding", () => {
  it("maps legacy onboarding routes to the current first setup step", () => {
    expect(normalizeOnboardingStep("welcome")).toBe("assessment");
    expect(normalizeOnboardingStep("plan-preview")).toBe("assessment");
    expect(onboardingPathForStep(normalizeOnboardingStep("permissions"))).toBe("/onboarding/assessment");
  });

  it("locks deep links until the previous required step has been persisted", () => {
    expect(canAccessOnboardingStep("assessment", "start-point")).toBe(false);
    expect(canAccessOnboardingStep("assessment", "complete")).toBe(false);
    expect(canAccessOnboardingStep("start-point", "complete")).toBe(false);
    expect(canAccessOnboardingStep("complete", "complete")).toBe(true);
  });

  it("allows onboarding to advance one persisted step at a time", () => {
    expect(canAdvanceOnboardingStep("assessment", "start-point")).toBe(true);
    expect(canAdvanceOnboardingStep("assessment", "complete")).toBe(false);
    expect(canAdvanceOnboardingStep("start-point", "complete")).toBe(true);
  });
});
