import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkEnabled } from "@/lib/clerk-config";

const isProtectedRoute = createRouteMatcher([
  "/onboarding(.*)",
  "/dashboard(.*)",
  "/today(.*)",
  "/dua(.*)",
  "/hifz(.*)",
  "/session(.*)",
  "/practice(.*)",
  "/notifications(.*)",
  "/history(.*)",
  "/roadmap(.*)",
  "/support(.*)",
  "/progress(.*)",
  "/ramadan(.*)",
  "/settings(.*)",
  "/streak(.*)",
  "/milestones(.*)",
  "/fluency(.*)",
  "/billing(.*)",
]);

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
  return raw;
}

export default clerkMiddleware(async (auth, req) => {
  if (!clerkEnabled()) {
    return NextResponse.next();
  }

  const pathname = req.nextUrl.pathname;
  const shouldProtect = isProtectedRoute(req) || isProtectedQuranPath(pathname);
  if (!shouldProtect) {
    return NextResponse.next();
  }

  const { userId } = await auth();
  if (!userId) {
    const signInUrl = new URL("/login", req.url);
    const search = new URLSearchParams(req.nextUrl.searchParams);
    search.delete("redirect_url");
    const fallbackPath = `${pathname}${search.size > 0 ? `?${search.toString()}` : ""}`;
    const requestedRedirect = req.nextUrl.searchParams.get("redirect_url");
    const redirectPath = safeRedirectPath(requestedRedirect, safeRedirectPath(fallbackPath));
    signInUrl.searchParams.set("redirect_url", redirectPath);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};

