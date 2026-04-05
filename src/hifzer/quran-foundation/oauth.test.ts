import { describe, expect, it } from "vitest";
import {
  createOAuthState,
  createPkceChallenge,
  decodeQuranFoundationIdentity,
} from "./oauth";

function buildIdTokenPayload(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

describe("quran foundation oauth helpers", () => {
  it("creates a verifier and challenge pair", () => {
    const result = createPkceChallenge();
    expect(result.verifier.length).toBeGreaterThan(20);
    expect(result.challenge.length).toBeGreaterThan(20);
    expect(result.verifier).not.toBe(result.challenge);
  });

  it("creates opaque oauth state", () => {
    const first = createOAuthState();
    const second = createOAuthState();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(20);
  });

  it("decodes the identity fields from an id token payload", () => {
    const identity = decodeQuranFoundationIdentity(
      buildIdTokenPayload({
        sub: "qf-user-1",
        name: "Quran User",
        email: "reader@example.com",
      }),
    );

    expect(identity).toEqual({
      sub: "qf-user-1",
      name: "Quran User",
      email: "reader@example.com",
    });
  });
});
