import { describe, expect, it } from "vitest";
import {
  normalizeClientMutationId,
  normalizeCurrency,
  normalizeIsoDate,
  parseMoneyToMinor,
} from "./validators";

describe("worship input validators", () => {
  it("serializes money without float rounding", () => {
    expect(parseMoneyToMinor("1200.5")).toBe("120050");
    expect(parseMoneyToMinor("0.01")).toBe("1");
    expect(parseMoneyToMinor("1.999")).toBeNull();
    expect(parseMoneyToMinor("-1")).toBeNull();
  });

  it("validates public identifiers and real calendar dates", () => {
    expect(normalizeCurrency("qar")).toBe("QAR");
    expect(normalizeCurrency("QATAR")).toBeNull();
    expect(normalizeIsoDate("2026-07-17")).toBe("2026-07-17");
    expect(normalizeIsoDate("17/07/2026")).toBeNull();
    expect(normalizeIsoDate("2026-02-30")).toBeNull();
    expect(normalizeClientMutationId("1b9a5549-672c-4ddd-b394-69455a13a8fb")).not.toBeNull();
    expect(normalizeClientMutationId("short")).toBeNull();
  });
});
