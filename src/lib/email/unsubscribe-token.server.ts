import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { emailConfig } from "@/lib/email/config.server";

type Payload = {
  uid: string;
  exp: number;
};

function b64urlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function b64urlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payloadB64: string): string {
  const secret = emailConfig().unsubscribeSigningSecret;
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function createUnsubscribeToken(input: { clerkUserId: string; expiresAt: Date }): string {
  const payload: Payload = {
    uid: input.clerkUserId,
    exp: input.expiresAt.getTime(),
  };
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifyUnsubscribeToken(token: string): { ok: true; clerkUserId: string } | { ok: false; reason: string } {
  if (!token || !token.includes(".")) {
    return { ok: false, reason: "malformed" };
  }
  const [payloadB64, signatureRaw] = token.split(".", 2);
  if (!payloadB64 || !signatureRaw) {
    return { ok: false, reason: "malformed" };
  }

  let payload: Payload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64)) as Payload;
  } catch {
    return { ok: false, reason: "invalid_payload" };
  }

  if (!payload.uid || !Number.isFinite(payload.exp)) {
    return { ok: false, reason: "invalid_payload" };
  }

  const expected = sign(payloadB64);
  const expectedBytes = Buffer.from(expected, "utf8");
  const receivedBytes = Buffer.from(signatureRaw, "utf8");
  if (expectedBytes.length !== receivedBytes.length || !timingSafeEqual(expectedBytes, receivedBytes)) {
    return { ok: false, reason: "bad_signature" };
  }

  if (Date.now() > payload.exp) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, clerkUserId: payload.uid };
}
