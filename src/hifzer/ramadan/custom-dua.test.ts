import { describe, expect, it } from "vitest";
import {
  buildLaylatAlQadrJourney,
  defaultLaylatAlQadrDeckOrders,
} from "@/hifzer/ramadan/laylat-al-qadr";

describe("buildLaylatAlQadrJourney", () => {
  it("inserts custom duas into the laylat module and keeps the rest of the journey intact", () => {
    const journey = buildLaylatAlQadrJourney({
      customDuas: [
        {
          id: "personal-1",
          moduleId: "laylat-al-qadr",
          title: "My family dua",
          arabic: null,
          transliteration: null,
          translation: "O Allah, protect my family and keep us firm.",
          note: "Read after the forgiveness duas.",
          createdAt: new Date("2026-03-11T00:00:00.000Z").toISOString(),
          updatedAt: new Date("2026-03-11T00:00:00.000Z").toISOString(),
        },
      ],
    });

    expect(journey.id).toBe("laylat-al-qadr");
    expect(journey.steps[0]?.moduleId).toBe("laylat-al-qadr");
    expect(journey.steps.at(-1)?.id).toBe("laylat-completion");

    const customStep = journey.steps.find((step) => step.id === "custom-dua-personal-1");
    expect(customStep?.moduleId).toBe("laylat-al-qadr");
    expect(customStep?.kind).toBe("personal");
    expect(customStep?.sourceLinks).toHaveLength(0);
  });

  it("honors saved deck-order overrides for built-in and custom duas", () => {
    const defaultOrders = defaultLaylatAlQadrDeckOrders();
    const journey = buildLaylatAlQadrJourney({
      customDuas: [
        {
          id: "personal-2",
          moduleId: "laylat-al-qadr",
          title: "My first dua",
          arabic: null,
          transliteration: null,
          translation: "O Allah, accept my repentance.",
          note: null,
          createdAt: new Date("2026-03-11T00:00:00.000Z").toISOString(),
          updatedAt: new Date("2026-03-11T00:00:00.000Z").toISOString(),
        },
      ],
      deckOrders: [
        {
          moduleId: "laylat-al-qadr",
          itemKey: "custom:personal-2",
          sortOrder: 5,
        },
        {
          moduleId: "laylat-al-qadr",
          itemKey: defaultOrders[0]?.itemKey ?? "builtin:laylat-forgiveness",
          sortOrder: 25,
        },
      ],
    });

    const duaSteps = journey.steps.filter((step) => step.dua);
    expect(duaSteps[0]?.id).toBe("custom-dua-personal-2");
    expect(duaSteps[0]?.deckOrder).toBe(5);
    expect(duaSteps.some((step) => step.id === "laylat-dua-forgiveness" && step.deckOrder === 25)).toBe(true);
  });
});
