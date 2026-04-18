import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";

type HeaderBag = Pick<Headers, "get">;

export const HIFZER_TEST_USER_HEADER = "x-hifzer-test-user-id";

function hostedProductionAuthOverrideForbidden(): boolean {
  return process.env.NODE_ENV === "production" &&
    (process.env.VERCEL_ENV === "production" || process.env.CF_PAGES === "1");
}

export function allowTestAuthImpersonation(): boolean {
  if (process.env.HIFZER_ALLOW_TEST_AUTH_IMPERSONATION !== "1") {
    return false;
  }
  return !hostedProductionAuthOverrideForbidden();
}

export function resolveTestAuthUserIdFromHeaders(headerBag: HeaderBag): string | null {
  if (!allowTestAuthImpersonation()) {
    return null;
  }

  const raw = headerBag.get(HIFZER_TEST_USER_HEADER)?.trim();
  return raw || null;
}

export async function resolveClerkUserIdForServer(request?: Request): Promise<string | null> {
  if (request) {
    const auditUserId = resolveTestAuthUserIdFromHeaders(request.headers);
    if (auditUserId) {
      return auditUserId;
    }
  } else {
    const headerBag = await headers();
    const auditUserId = resolveTestAuthUserIdFromHeaders(headerBag);
    if (auditUserId) {
      return auditUserId;
    }
  }

  const { userId } = await auth();
  return userId;
}
