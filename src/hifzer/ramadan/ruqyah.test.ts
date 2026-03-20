import { describe, expect, it } from "vitest";
import { buildRuqyahJourney, ruqyahJourney } from "@/hifzer/ramadan/laylat-al-qadr";

describe("ruqyahJourney", () => {
  it("ships the ruqyah module with a method prelude, authenticated recitations, and a completion step", () => {
    expect(ruqyahJourney.id).toBe("ruqyah");
    expect(ruqyahJourney.supportsCustomDeck).toBe(true);
    expect(ruqyahJourney.steps[0]?.id).toBe("ruqyah-clarify-method");
    expect(ruqyahJourney.steps.at(-1)?.id).toBe("ruqyah-completion");

    const duaSteps = ruqyahJourney.steps.filter((step) => step.dua);
    expect(duaSteps).toHaveLength(6);
  });

  it("keeps every ruqyah recitation sourced and paired with a tracker note", () => {
    const duaSteps = ruqyahJourney.steps.filter((step) => step.dua);

    for (const step of duaSteps) {
      expect(step.sourceLinks.length).toBeGreaterThan(0);
      expect(step.dua?.trackerLabel.length).toBeGreaterThan(0);
      expect(step.dua?.trackerNote.length).toBeGreaterThan(10);
      expect(step.dua?.translation.length).toBeGreaterThan(20);
    }
  });

  it("accepts custom duas in the ruqyah deck without disturbing the module boundary", () => {
    const journey = buildRuqyahJourney({
      customDuas: [
        {
          id: "ruqyah-custom-1",
          moduleId: "ruqyah",
          title: "Family protection dua",
          arabic: null,
          transliteration: null,
          translation: "O Allah, protect my family from harm, envy, and what people hide.",
          note: "Read after al-Falaq and an-Nas.",
          createdAt: new Date("2026-03-20T00:00:00.000Z").toISOString(),
          updatedAt: new Date("2026-03-20T00:00:00.000Z").toISOString(),
        },
      ],
      deckOrders: [
        {
          moduleId: "ruqyah",
          itemKey: "custom:ruqyah-custom-1",
          sortOrder: 15,
        },
      ],
    });

    const customStep = journey.steps.find((step) => step.id === "custom-dua-ruqyah-custom-1");
    expect(customStep?.moduleId).toBe("ruqyah");
    expect(customStep?.kind).toBe("personal");
    expect(customStep?.deckOrder).toBe(15);
    expect(customStep?.sourceLinks).toHaveLength(0);
    expect(journey.steps.at(-1)?.id).toBe("ruqyah-completion");
  });
});
