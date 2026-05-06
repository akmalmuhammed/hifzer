import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getQuranFoundationRequestedScopes,
  hasQuranFoundationUserFlowConfig,
} from "@/hifzer/quran-foundation/config";
import {
  buildQuranFoundationAuthorizeUrl,
  createOAuthNonce,
  createOAuthState,
  createPkceChallenge,
} from "@/hifzer/quran-foundation/oauth";

export const runtime = "nodejs";

const STATE_COOKIE = "hifzer_qf_oauth_state";
const VERIFIER_COOKIE = "hifzer_qf_oauth_verifier";
const NONCE_COOKIE = "hifzer_qf_oauth_nonce";
const RETURN_TO_COOKIE = "hifzer_qf_oauth_return_to";
const DEFAULT_RETURN_TO = "/settings/quran-foundation";

function sanitizeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_RETURN_TO;
  }
  try {
    const url = new URL(value, "https://hifzer.local");
    if (url.origin !== "https://hifzer.local") {
      return DEFAULT_RETURN_TO;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}

function buildReturnUrl(req: URL, returnTo: string, qf: string) {
  const url = new URL(sanitizeReturnTo(returnTo), req);
  url.searchParams.set("qf", qf);
  return url;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  const requestUrl = new URL(req.url);
  const returnTo = sanitizeReturnTo(requestUrl.searchParams.get("returnTo"));

  if (!userId) {
    return NextResponse.redirect(buildReturnUrl(requestUrl, returnTo, "sign-in-required"));
  }

  if (!hasQuranFoundationUserFlowConfig()) {
    return NextResponse.redirect(buildReturnUrl(requestUrl, returnTo, "not-configured"));
  }

  const { verifier, challenge } = createPkceChallenge();
  const state = createOAuthState();
  const nonce = createOAuthNonce();
  const authorizeUrl = buildQuranFoundationAuthorizeUrl({
    state,
    codeChallenge: challenge,
    scopes: getQuranFoundationRequestedScopes(),
    nonce,
  });

  const response = NextResponse.redirect(authorizeUrl);
  for (const [name, value] of [
    [STATE_COOKIE, state],
    [VERIFIER_COOKIE, verifier],
    [NONCE_COOKIE, nonce],
    [RETURN_TO_COOKIE, returnTo],
  ] as const) {
    response.cookies.set(name, value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api/quran-foundation",
      maxAge: 60 * 10,
    });
  }
  return response;
}
