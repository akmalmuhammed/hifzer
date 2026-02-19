import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Timing-safe string comparison to prevent timing side-channel attacks on
 * secret tokens (e.g. cron secrets, webhook secrets).
 *
 * Uses a constant-time padding strategy so that even length-mismatched strings
 * do not short-circuit early and reveal information through response latency.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");

    // Pad both buffers to the longer length so we always do a full comparison.
    const maxLen = Math.max(bufA.length, bufB.length);
    const paddedA = Buffer.alloc(maxLen);
    const paddedB = Buffer.alloc(maxLen);
    bufA.copy(paddedA);
    bufB.copy(paddedB);

    // timingSafeEqual requires equal-length buffers. The equal-length padding
    // above ensures this. The result is only meaningful when lengths match.
    const equal = timingSafeEqual(paddedA, paddedB);
    return equal && bufA.length === bufB.length;
}

/**
 * Validates a Bearer token header against a known secret using timing-safe
 * comparison. Returns true only if the header is "Bearer <secret>".
 */
export function isValidBearerToken(authHeader: string | null, secret: string): boolean {
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
        return false;
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
        return false;
    }
    return timingSafeStringEqual(token, secret);
}
