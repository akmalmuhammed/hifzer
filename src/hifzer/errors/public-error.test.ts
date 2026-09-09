import { describe, expect, it } from "vitest";
import { mapPublicHttpError } from "./public-error";

describe("mapPublicHttpError", () => {
  it("maps authentication failures to a safe sign-in recovery", () => {
    expect(mapPublicHttpError(401, "hifz")).toMatchObject({
      code: "session_expired",
      needsSignIn: true,
      canRetry: false,
    });
  });

  it.each([400, 401, 500, 502, 503, 504])("never exposes implementation detail for %s", (status) => {
    expect(mapPublicHttpError(status, "assistant").message).not.toMatch(/Unauthorized|Clerk|token|gateway|HTTP|stack|env/i);
  });
});
