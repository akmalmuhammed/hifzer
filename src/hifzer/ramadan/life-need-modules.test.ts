import { describe, expect, it } from "vitest";
import {
  buildDistressJourney,
  buildFamilyJourney,
  buildGriefJourney,
  buildHealingJourney,
  buildIstikharaJourney,
  buildDuaModules,
  distressJourney,
  familyJourney,
  griefJourney,
  healingJourney,
  istikharaJourney,
} from "@/hifzer/ramadan/laylat-al-qadr";

const researchedModules = [
  distressJourney,
  istikharaJourney,
  healingJourney,
  griefJourney,
  familyJourney,
];

describe("life need dua modules", () => {
  it("ships the researched high-demand dua modules in the global module list", () => {
    const ids = buildDuaModules().map((module) => module.id);

    expect(ids).toContain("anxiety-distress");
    expect(ids).toContain("istikhara-decisions");
    expect(ids).toContain("healing-shifa");
    expect(ids).toContain("grief-loss");
    expect(ids).toContain("family-home");
  });

  it("keeps every new module sourced, guided, and deck-backed", () => {
    for (const journeyModule of researchedModules) {
      expect(journeyModule.supportsCustomDeck).toBe(true);
      expect(journeyModule.steps[0]?.kind).toBe("authentic");
      expect(journeyModule.steps.at(-1)?.id).toContain("completion");

      const duaSteps = journeyModule.steps.filter((step) => step.dua);
      expect(duaSteps).toHaveLength(5);

      for (const step of duaSteps) {
        expect(step.sourceLinks.length).toBeGreaterThan(0);
        expect(step.dua?.arabic?.length).toBeGreaterThan(0);
        expect(step.dua?.translation.length).toBeGreaterThan(20);
        expect(step.dua?.trackerNote.length).toBeGreaterThan(10);
      }
    }
  });

  it("keeps custom duas inside each new module boundary", () => {
    const builders = [
      buildDistressJourney,
      buildIstikharaJourney,
      buildHealingJourney,
      buildGriefJourney,
      buildFamilyJourney,
    ];

    for (const buildJourney of builders) {
      const baseJourney = buildJourney();
      const customId = `${baseJourney.id}-custom-1`;
      const journey = buildJourney({
        customDuas: [
          {
            id: customId,
            moduleId: baseJourney.id,
            title: "Personal dua",
            arabic: null,
            transliteration: null,
            translation: "O Allah, place good, mercy, and guidance in this personal need.",
            note: "Saved from the module manager.",
            createdAt: new Date("2026-04-19T00:00:00.000Z").toISOString(),
            updatedAt: new Date("2026-04-19T00:00:00.000Z").toISOString(),
          },
        ],
        deckOrders: [
          {
            moduleId: baseJourney.id,
            itemKey: `custom:${customId}`,
            sortOrder: 15,
          },
        ],
      });

      const customStep = journey.steps.find((step) => step.id === `custom-dua-${customId}`);
      expect(customStep?.moduleId).toBe(baseJourney.id);
      expect(customStep?.kind).toBe("personal");
      expect(customStep?.deckOrder).toBe(15);
      expect(journey.steps.at(-1)?.id).toContain("completion");
    }
  });
});
