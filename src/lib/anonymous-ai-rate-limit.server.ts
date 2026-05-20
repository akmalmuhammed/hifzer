import { NextResponse } from "next/server";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ANONYMOUS_REQUESTS = 6;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function clientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.slice(0, 80) ?? "unknown";
  return `${forwardedFor || realIp || "unknown"}:${userAgent}`;
}

export function enforceAnonymousAiRateLimit(request: Request, userId: string | null): NextResponse | null {
  if (userId) {
    return null;
  }

  const now = Date.now();
  const key = clientKey(request);
  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + WINDOW_MS };

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count <= MAX_ANONYMOUS_REQUESTS) {
    return null;
  }

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return NextResponse.json(
    {
      error: "Too many anonymous AI requests. Sign in or wait before asking again.",
      retryAfter,
    },
    {
      status: 429,
      headers: {
        "retry-after": String(retryAfter),
      },
    },
  );
}
