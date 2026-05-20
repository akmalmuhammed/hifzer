import { cookies, headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { clerkEnabled } from "@/lib/clerk-config";

type HeaderBag = Pick<Headers, "get">;

export const HIFZER_TEST_USER_HEADER = "x-hifzer-test-user-id";
export const HIFZER_TEST_USER_COOKIE = "hifzer_test_user_id";

const LOCAL_TEST_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function hostedProductionAuthOverrideForbidden(): boolean {
  const vercelUrl = process.env.VERCEL_URL?.replace(/^"|"$/g, "").trim();
  return process.env.NODE_ENV === "production" &&
    ((process.env.VERCEL_ENV === "production" && Boolean(vercelUrl)) || process.env.CF_PAGES === "1");
}

export function allowTestAuthImpersonation(): boolean {
  if (process.env.HIFZER_ALLOW_TEST_AUTH_IMPERSONATION !== "1") {
    return false;
  }
  return !hostedProductionAuthOverrideForbidden();
}

function isLocalTestUrl(requestUrl: string | URL | undefined): boolean {
  if (!requestUrl || hostedProductionAuthOverrideForbidden()) {
    return false;
  }

  try {
    const url = typeof requestUrl === "string" ? new URL(requestUrl) : requestUrl;
    return LOCAL_TEST_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function resolveTestAuthUserIdFromHeaders(headerBag: HeaderBag): string | null {
  if (!allowTestAuthImpersonation()) {
    return null;
  }

  const raw = headerBag.get(HIFZER_TEST_USER_HEADER)?.trim();
  return raw || null;
}

export function resolveTestAuthUserIdFromRequest(request: Request | { headers: HeaderBag; url?: string | URL }): string | null {
  const raw = request.headers.get(HIFZER_TEST_USER_HEADER)?.trim() ?? readCookieValue(request.headers, HIFZER_TEST_USER_COOKIE);
  if (!raw) {
    return null;
  }

  if (allowTestAuthImpersonation() || isLocalTestUrl(request.url)) {
    return raw;
  }

  return null;
}

export async function resolveClerkUserIdForServer(request?: Request | { headers: HeaderBag; url?: string | URL }): Promise<string | null> {
  if (request) {
    const auditUserId = resolveTestAuthUserIdFromRequest(request);
    if (auditUserId) {
      return auditUserId;
    }
  } else {
    const headerBag = await headers();
    const host = headerBag.get("host")?.trim();
    const proto = headerBag.get("x-forwarded-proto")?.trim() || "http";
    const auditUserId = resolveTestAuthUserIdFromRequest({
      headers: headerBag,
      url: host ? `${proto}://${host}` : undefined,
    }) ?? resolveTestAuthUserIdFromHeaders(headerBag);
    if (auditUserId) {
      return auditUserId;
    }
    if (allowTestAuthImpersonation()) {
      const cookieStore = await cookies();
      const cookieUserId = cookieStore.get(HIFZER_TEST_USER_COOKIE)?.value.trim();
      if (cookieUserId) {
        return cookieUserId;
      }
      const envUserId = process.env.HIFZER_TEST_USER_ID?.trim();
      if (envUserId) {
        return envUserId;
      }
    }
  }

  if (!clerkEnabled()) {
    return null;
  }

  const { userId } = await auth();
  return userId;
}

function readCookieValue(headerBag: HeaderBag, name: string): string | null {
  const cookieHeader = headerBag.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      const value = rawValue.join("=").trim();
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}
