import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getQuranFoundationConfig } from "./config";
import { QuranFoundationError } from "./types";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const secret = getQuranFoundationConfig().userTokenEncryptionSecret;
  if (!secret) {
    throw new QuranFoundationError("Quran Foundation token encryption is not configured.", {
      status: 503,
      code: "qf_encryption_not_configured",
      retryable: false,
    });
  }
  return createHash("sha256").update(secret).digest();
}

function encode(value: Buffer): string {
  return value.toString("base64url");
}

function decode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

export function encryptQuranFoundationSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${encode(iv)}.${encode(tag)}.${encode(ciphertext)}`;
}

export function decryptQuranFoundationSecret(value: string): string {
  const parts = value.split(".");
  if (parts.length !== 3) {
    throw new QuranFoundationError("Stored Quran Foundation token is invalid.", {
      status: 500,
      code: "qf_token_ciphertext_invalid",
    });
  }
  const [ivPart, tagPart, ciphertextPart] = parts;
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), decode(ivPart));
  decipher.setAuthTag(decode(tagPart));
  const plaintext = Buffer.concat([decipher.update(decode(ciphertextPart)), decipher.final()]);
  return plaintext.toString("utf8");
}
