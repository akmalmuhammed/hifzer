import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ENCRYPTION_VERSION = "v1";
const ENCRYPTION_ALGORITHM = "aes-256-gcm";

export class PrivateDataEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivateDataEncryptionError";
  }
}

function encryptionKey(): Buffer {
  const secret = process.env.HIFZER_PRIVATE_DATA_ENCRYPTION_KEY?.trim();
  if (!secret || secret.length < 32) {
    throw new PrivateDataEncryptionError(
      "Private data encryption is not configured. Set HIFZER_PRIVATE_DATA_ENCRYPTION_KEY to a long random secret.",
    );
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function privateDataEncryptionConfigured(): boolean {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptPrivateJson(value: unknown, context: string): string {
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey(), iv);
  cipher.setAAD(Buffer.from(context, "utf8"));

  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    ENCRYPTION_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptPrivateJson<T>(ciphertext: string, context: string): T {
  const [version, encodedIv, encodedTag, encodedCiphertext, ...rest] = ciphertext.split(".");
  if (
    version !== ENCRYPTION_VERSION ||
    !encodedIv ||
    !encodedTag ||
    !encodedCiphertext ||
    rest.length > 0
  ) {
    throw new PrivateDataEncryptionError("Private data could not be opened.");
  }

  try {
    const decipher = createDecipheriv(
      ENCRYPTION_ALGORITHM,
      encryptionKey(),
      Buffer.from(encodedIv, "base64url"),
    );
    decipher.setAAD(Buffer.from(context, "utf8"));
    decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(plaintext) as T;
  } catch (error) {
    if (error instanceof PrivateDataEncryptionError) {
      throw error;
    }
    throw new PrivateDataEncryptionError("Private data could not be opened.");
  }
}
