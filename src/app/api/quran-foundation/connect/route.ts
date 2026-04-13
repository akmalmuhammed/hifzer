import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getQuranFoundationRedirectUri,
  getQuranFoundationRequestedScopes,
  hasQuranFoundationUserFlowConfig,
} from "@/hifzer/quran-foundation/config";
import {
  buildQuranFoundationAuthorizeUrl,
  createOAuthState,
  createPkceChallenge,
} from "@/hifzer/quran-foundation/oauth";

export const runtime = "nodejs";

const STATE_COOKIE = "hifzer_qf_oauth_state";
const VERIFIER_COOKIE = "hifzer_qf_oauth_verifier";
const RETURN_TO_COOKIE = "hifzer_qf_oauth_return_to";

function buildReturnUrl(req: URL, returnTo: string, qf: string) {
  const url = new URL(returnTo, req);
  url.searchParams.set("qf", qf);
  return url;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  const requestUrl = new URL(req.url);
  const returnTo = requestUrl.searchParams.get("returnTo") || "/settings/quran-foundation";

  if (!userId) {
    return NextResponse.redirect(buildReturnUrl(requestUrl, returnTo, "sign-in-required"));
  }

  if (!hasQuranFoundationUserFlowConfig()) {
    return NextResponse.redirect(buildReturnUrl(requestUrl, returnTo, "not-configured"));
  }

  const { verifier, challenge } = createPkceChallenge();
  const state = createOAuthState();
  const redirectUri = getQuranFoundationRedirectUri(requestUrl);
  const authorizeUrl = buildQuranFoundationAuthorizeUrl({
    state,
    codeChallenge: challenge,
    scopes: getQuranFoundationRequestedScopes(),
    redirectUri,
  });

  const response = NextResponse.redirect(authorizeUrl);
  for (const [name, value] of [
    [STATE_COOKIE, state],
    [VERIFIER_COOKIE, verifier],
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
