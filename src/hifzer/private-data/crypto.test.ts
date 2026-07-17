import { afterEach, describe, expect, it } from "vitest";
import {
  decryptPrivateJson,
  encryptPrivateJson,
  PrivateDataEncryptionError,
} from "./crypto";

const originalKey = process.env.HIFZER_PRIVATE_DATA_ENCRYPTION_KEY;

afterEach(() => {
  if (originalKey === undefined) {
    delete process.env.HIFZER_PRIVATE_DATA_ENCRYPTION_KEY;
  } else {
    process.env.HIFZER_PRIVATE_DATA_ENCRYPTION_KEY = originalKey;
  }
});

describe("private data encryption", () => {
  it("round trips a payload only with the same context", () => {
    process.env.HIFZER_PRIVATE_DATA_ENCRYPTION_KEY = "a-very-long-test-only-private-data-encryption-key";
    const sealed = encryptPrivateJson({ amountMinor: "125000", currency: "QAR" }, "plan:user_1:2026");

    expect(decryptPrivateJson<{ amountMinor: string; currency: string }>(sealed, "plan:user_1:2026")).toEqual({
      amountMinor: "125000",
      currency: "QAR",
    });
    expect(() => decryptPrivateJson(sealed, "plan:user_2:2026")).toThrow(PrivateDataEncryptionError);
  });

  it("does not accept a missing or short encryption secret", () => {
    delete process.env.HIFZER_PRIVATE_DATA_ENCRYPTION_KEY;
    expect(() => encryptPrivateJson({ amountMinor: "1" }, "plan:user_1:2026")).toThrow(PrivateDataEncryptionError);
  });
});
