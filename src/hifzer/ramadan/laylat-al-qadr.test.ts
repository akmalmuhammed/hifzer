import { describe, expect, it } from "vitest";
import { laylatAlQadrJourney } from "@/hifzer/ramadan/laylat-al-qadr";

describe("laylatAlQadrJourney", () => {
  it("keeps the experience order anchored from method to duas to completion", () => {
    expect(laylatAlQadrJourney.id).toBe("laylat-al-qadr");
    expect(laylatAlQadrJourney.steps[0]?.id).toBe("laylat-seek-night");
    expect(laylatAlQadrJourney.steps.at(-1)?.id).toBe("laylat-completion");

    const duaStepIndexes = laylatAlQadrJourney.steps
      .map((step, index) => (step.dua ? index : -1))
      .filter((index) => index >= 0);

    expect(duaStepIndexes.length).toBeGreaterThan(1);
    expect(Math.min(...duaStepIndexes)).toBeGreaterThan(
      laylatAlQadrJourney.steps.findIndex((step) => step.id === "laylat-adab-of-dua"),
    );
  });

  it("gives every dua slide a tracker note and at least one source", () => {
    const duaSteps = laylatAlQadrJourney.steps.filter((step) => step.dua);

    expect(duaSteps.length).toBeGreaterThan(1);

    for (const step of duaSteps) {
      expect(step.sourceLinks.length).toBeGreaterThan(0);
      expect(step.dua?.trackerNote.length).toBeGreaterThan(10);
      expect(step.dua?.trackerLabel.length).toBeGreaterThan(0);
    }
  });
});
