import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkEnabled } from "@/lib/clerk-config";

const isProtectedRoute = createRouteMatcher([
  "/onboarding(.*)",
  "/today(.*)",
  "/session(.*)",
  "/practice(.*)",
  "/notifications(.*)",
  "/history(.*)",
  "/progress(.*)",
  "/settings(.*)",
  "/streak(.*)",
  "/milestones(.*)",
  "/fluency(.*)",
  "/billing(.*)",
  "/quran(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isOnboardingStartPointRoute = createRouteMatcher(["/onboarding/start-point(.*)"]);

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const onboarded = req.cookies.get("hifzer_onboarded_v1")?.value === "1";
  if (onboarded && isOnboardingRoute(req) && !isOnboardingStartPointRoute(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/today";
    url.search = "";
    return NextResponse.redirect(url);
  }
});

export default clerkEnabled()
  ? protectedMiddleware
  : function middleware() {
      return NextResponse.next();
    };

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
