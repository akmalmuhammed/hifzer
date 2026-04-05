import { describe, expect, it } from "vitest";
import { beautifulNamesJourney } from "@/hifzer/ramadan/laylat-al-qadr";

describe("beautifulNamesJourney", () => {
  it("ships the names module with a method prelude, 99 researched name cards, and a completion step", () => {
    expect(beautifulNamesJourney.id).toBe("beautiful-names");
    expect(beautifulNamesJourney.supportsCustomDeck).toBe(false);
    expect(beautifulNamesJourney.steps[0]?.id).toBe("beautiful-names-why");
    expect(beautifulNamesJourney.steps.at(-1)?.id).toBe("beautiful-names-completion");

    const nameSteps = beautifulNamesJourney.steps.filter((step) => step.spotlight);
    expect(nameSteps).toHaveLength(99);
  });

  it("keeps every name card sourced and tagged with a display spotlight", () => {
    const nameSteps = beautifulNamesJourney.steps.filter((step) => step.spotlight);

    for (const step of nameSteps) {
      expect(step.sourceLinks.length).toBeGreaterThan(0);
      expect(step.spotlight?.arabic.length).toBeGreaterThan(0);
      expect(step.spotlight?.meaning.length).toBeGreaterThan(0);
      expect(step.dua?.trackerNote.length).toBeGreaterThan(10);
    }
  });
});
