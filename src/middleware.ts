import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveTestAuthUserIdFromHeaders } from "@/hifzer/testing/request-auth";
import { clerkEnabled } from "@/lib/clerk-config";
import { normalizeLegacyDashboardPath } from "@/lib/auth-redirects";

const PROTECTED_ROUTE_PATTERNS = [
  "/onboarding(.*)",
  "/dashboard(.*)",
  "/dua(.*)",
  "/hifz(.*)",
  "/session(.*)",
  "/practice(.*)",
  "/notifications(.*)",
  "/history(.*)",
  "/roadmap(.*)",
  "/support(.*)",
  "/ramadan(.*)",
  "/settings(.*)",
  "/milestones(.*)",
  "/fluency(.*)",
  "/billing(.*)",
] as const;

function routeMatchesPattern(pathname: string, pattern: string): boolean {
  const base = pattern.replace(/\(\.\*\)$/, "");
  return pathname === base || pathname.startsWith(`${base}/`);
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PATTERNS.some((pattern) => routeMatchesPattern(pathname, pattern));
}

function isProtectedQuranPath(pathname: string): boolean {
  return pathname === "/quran" || pathname.startsWith("/quran/");
}

function safeRedirectPath(candidate: string | null | undefined, fallback = "/dashboard"): string {
  const raw = (candidate ?? "").trim();
  if (!raw) {
    return fallback;
  }
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    return fallback;
  }
  return normalizeLegacyDashboardPath(raw, fallback);
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!clerkEnabled()) {
    const pathname = req.nextUrl.pathname;
    const shouldProtect = isProtectedRoute(pathname) || isProtectedQuranPath(pathname);
    const failClosed = process.env.NODE_ENV === "production";

    if (shouldProtect && failClosed) {
      return withRequestId(
        req,
        new NextResponse("Authentication is not configured for protected routes.", {
          status: 503,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store",
          },
        }),
      );
    }

    return withRequestId(req, NextResponse.next());
  }

  if (resolveTestAuthUserIdFromHeaders(req.headers)) {
    return withRequestId(req, NextResponse.next());
  }

  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  const handler = clerkMiddleware(async (auth, innerReq) => {
    const requestId = ensureRequestId(innerReq);
    const pathname = innerReq.nextUrl.pathname;
    const shouldProtect = isProtectedRoute(pathname) || isProtectedQuranPath(pathname);
    if (!shouldProtect) {
      return withRequestId(innerReq, NextResponse.next(), requestId);
    }

    const auditUserId = resolveTestAuthUserIdFromHeaders(innerReq.headers);
    const { userId } = auditUserId ? { userId: null } : await auth();
    const effectiveUserId = auditUserId ?? userId;
    if (!effectiveUserId) {
      const signInUrl = new URL("/login", innerReq.url);
      const search = new URLSearchParams(innerReq.nextUrl.searchParams);
      search.delete("redirect_url");
      const fallbackPath = `${pathname}${search.size > 0 ? `?${search.toString()}` : ""}`;
      const requestedRedirect = innerReq.nextUrl.searchParams.get("redirect_url");
      const redirectPath = safeRedirectPath(requestedRedirect, safeRedirectPath(fallbackPath));
      signInUrl.searchParams.set("redirect_url", redirectPath);
      return withRequestId(innerReq, NextResponse.redirect(signInUrl), requestId);
    }

    return withRequestId(innerReq, NextResponse.next(), requestId);
  });

  return handler(req, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};

function ensureRequestId(req: NextRequest): string {
  const existing = req.headers.get("x-request-id");
  if (existing) {
    return existing;
  }
  return crypto.randomUUID();
}

function withRequestId(req: NextRequest, response: NextResponse, requestId?: string): NextResponse {
  const id = requestId ?? ensureRequestId(req);
  response.headers.set("x-request-id", id);
  return response;
}
