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

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
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
