import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  HIFZER_TEST_USER_COOKIE,
  HIFZER_TEST_USER_HEADER,
  resolveTestAuthUserIdFromRequest,
} from "@/hifzer/testing/request-auth";
import { clerkEnabled } from "@/lib/clerk-config";
import { normalizeLegacyDashboardPath } from "@/lib/auth-redirects";

const PROTECTED_ROUTE_PATTERNS = [
  "/onboarding(.*)",
  "/dashboard(.*)",
  "/assistant(.*)",
  "/dua(.*)",
  "/duas(.*)",
  "/hifz(.*)",
  "/worship(.*)",
  "/journal(.*)",
  "/bookmarks(.*)",
  "/reader(.*)",
  "/today(.*)",
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

const HIFZER_PUBLIC_QURAN_DEMO_HEADER = "x-hifzer-public-quran-demo";

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

function isPublicQuranDemoPath(req: NextRequest): boolean {
  const pathname = req.nextUrl.pathname;
  return pathname === "/quran/read" && req.nextUrl.searchParams.get("anon") === "1";
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

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  if (req.nextUrl.pathname === "/legacy" || req.nextUrl.pathname.startsWith("/legacy/")) {
    const redirectUrl = new URL("/", req.url);
    return withRequestId(req, NextResponse.redirect(redirectUrl));
  }

  if (!clerkEnabled()) {
    const pathname = req.nextUrl.pathname;
    const shouldProtect = (isProtectedRoute(pathname) || isProtectedQuranPath(pathname)) && !isPublicQuranDemoPath(req);
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

  const testUserId = resolveTestAuthUserIdFromRequest(req);
  if (testUserId) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(HIFZER_TEST_USER_HEADER, testUserId);
    const cookie = requestHeaders.get("cookie");
    if (!cookie?.includes(`${HIFZER_TEST_USER_COOKIE}=`)) {
      requestHeaders.set(
        "cookie",
        `${cookie ? `${cookie}; ` : ""}${HIFZER_TEST_USER_COOKIE}=${encodeURIComponent(testUserId)}`,
      );
    }
    return withRequestId(req, NextResponse.next({ request: { headers: requestHeaders } }));
  }

  if (isPublicQuranDemoPath(req)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(HIFZER_PUBLIC_QURAN_DEMO_HEADER, "1");
    return withRequestId(req, NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  const handler = clerkMiddleware(async (auth, innerReq) => {
    const requestId = ensureRequestId(innerReq);
    const pathname = innerReq.nextUrl.pathname;
    const shouldProtect = isProtectedRoute(pathname) || isProtectedQuranPath(pathname);
    if (!shouldProtect) {
      return withRequestId(innerReq, NextResponse.next(), requestId);
    }

    const auditUserId = resolveTestAuthUserIdFromRequest(innerReq);
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
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
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
