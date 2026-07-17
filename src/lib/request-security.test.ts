import { describe, expect, it } from "vitest";
import { isJsonMutation, isTrustedSameOriginMutation } from "./request-security";

describe("isTrustedSameOriginMutation", () => {
  it("accepts an exact origin", () => {
    const request = new Request("https://hifzer.com/api/worship/prayer", {
      method: "PUT",
      headers: { origin: "https://hifzer.com" },
    });
    expect(isTrustedSameOriginMutation(request)).toBe(true);
  });

  it("accepts a same-origin referer when browsers omit Origin", () => {
    const request = new Request("https://hifzer.com/api/worship/prayer", {
      method: "PUT",
      headers: { referer: "https://hifzer.com/worship" },
    });
    expect(isTrustedSameOriginMutation(request)).toBe(true);
  });

  it("rejects a cross-origin request and a missing origin", () => {
    const crossOrigin = new Request("https://hifzer.com/api/worship/prayer", {
      method: "PUT",
      headers: { origin: "https://attacker.example" },
    });
    const missingOrigin = new Request("https://hifzer.com/api/worship/prayer", { method: "PUT" });

    expect(isTrustedSameOriginMutation(crossOrigin)).toBe(false);
    expect(isTrustedSameOriginMutation(missingOrigin)).toBe(false);
  });
});

describe("isJsonMutation", () => {
  it("requires application/json", () => {
    expect(isJsonMutation(new Request("https://hifzer.com/api/worship", {
      method: "PUT",
      headers: { "content-type": "application/json; charset=utf-8" },
    }))).toBe(true);
    expect(isJsonMutation(new Request("https://hifzer.com/api/worship", { method: "PUT" }))).toBe(false);
  });
});
