import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkEnabled } from "@/lib/clerk-config";

const isProtectedRoute = createRouteMatcher([
  "/onboarding(.*)",
  "/dashboard(.*)",
  "/today(.*)",
  "/session(.*)",
  "/practice(.*)",
  "/notifications(.*)",
  "/history(.*)",
  "/roadmap(.*)",
  "/support(.*)",
  "/progress(.*)",
  "/settings(.*)",
  "/streak(.*)",
  "/milestones(.*)",
  "/fluency(.*)",
  "/billing(.*)",
]);

function isProtectedQuranPath(pathname: string): boolean {
  return pathname === "/quran" || pathname.startsWith("/quran/");
}

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const shouldProtect = isProtectedRoute(req) || isProtectedQuranPath(pathname);
  if (!shouldProtect) {
    return NextResponse.next();
  }

  const { userId } = await auth();
  if (!userId) {
    const signInUrl = new URL("/login", req.url);
    const redirectPath = `${pathname}${req.nextUrl.search}`;
    signInUrl.searchParams.set("redirect_url", redirectPath || "/today");
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export default clerkEnabled()
  ? protectedMiddleware
  : function middleware() {
      return NextResponse.next();
    };

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
