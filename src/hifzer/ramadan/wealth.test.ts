import { describe, expect, it } from "vitest";
import { buildWealthJourney, wealthJourney } from "@/hifzer/ramadan/laylat-al-qadr";

describe("wealthJourney", () => {
  it("ships the wealth module with a boundary prelude, six sourced duas, and a completion step", () => {
    expect(wealthJourney.id).toBe("wealth");
    expect(wealthJourney.supportsCustomDeck).toBe(true);
    expect(wealthJourney.steps[0]?.id).toBe("wealth-clarify-goal");
    expect(wealthJourney.steps.at(-1)?.id).toBe("wealth-completion");

    const duaSteps = wealthJourney.steps.filter((step) => step.dua);
    expect(duaSteps).toHaveLength(6);
  });

  it("keeps every wealth dua sourced and tied to a tracker note", () => {
    const duaSteps = wealthJourney.steps.filter((step) => step.dua);

    for (const step of duaSteps) {
      expect(step.sourceLinks.length).toBeGreaterThan(0);
      expect(step.dua?.trackerLabel.length).toBeGreaterThan(0);
      expect(step.dua?.trackerNote.length).toBeGreaterThan(10);
      expect(step.dua?.translation.length).toBeGreaterThan(20);
    }
  });

  it("accepts custom duas inside the wealth deck without changing the module boundary", () => {
    const journey = buildWealthJourney({
      customDuas: [
        {
          id: "wealth-custom-1",
          moduleId: "wealth",
          title: "Business stability dua",
          arabic: null,
          transliteration: null,
          translation: "O Allah, put barakah in my work, protect me from debt, and widen lawful provision for me.",
          note: "Read after the halal-suffices dua.",
          createdAt: new Date("2026-03-20T00:00:00.000Z").toISOString(),
          updatedAt: new Date("2026-03-20T00:00:00.000Z").toISOString(),
        },
      ],
      deckOrders: [
        {
          moduleId: "wealth",
          itemKey: "custom:wealth-custom-1",
          sortOrder: 35,
        },
      ],
    });

    const customStep = journey.steps.find((step) => step.id === "custom-dua-wealth-custom-1");
    expect(customStep?.moduleId).toBe("wealth");
    expect(customStep?.kind).toBe("personal");
    expect(customStep?.deckOrder).toBe(35);
    expect(customStep?.sourceLinks).toHaveLength(0);
    expect(journey.steps.at(-1)?.id).toBe("wealth-completion");
  });
});
