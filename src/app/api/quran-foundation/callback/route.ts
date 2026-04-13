import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getQuranFoundationRedirectUri } from "@/hifzer/quran-foundation/config";
import {
  decodeQuranFoundationIdentity,
  exchangeQuranFoundationCode,
} from "@/hifzer/quran-foundation/oauth";
import { storeQuranFoundationConnection } from "@/hifzer/quran-foundation/server";

export const runtime = "nodejs";

const STATE_COOKIE = "hifzer_qf_oauth_state";
const VERIFIER_COOKIE = "hifzer_qf_oauth_verifier";
const RETURN_TO_COOKIE = "hifzer_qf_oauth_return_to";

function buildReturnUrl(req: URL, returnTo: string, qf: string) {
  const url = new URL(returnTo, req);
  url.searchParams.set("qf", qf);
  return url;
}

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/quran-foundation",
    maxAge: 0,
  });
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const cookieStore = await cookies();
  const returnTo = cookieStore.get(RETURN_TO_COOKIE)?.value || "/settings/quran-foundation";
  const { userId } = await auth();

  const finalize = (qf: string) => {
    const response = NextResponse.redirect(buildReturnUrl(requestUrl, returnTo, qf));
    clearCookie(response, STATE_COOKIE);
    clearCookie(response, VERIFIER_COOKIE);
    clearCookie(response, RETURN_TO_COOKIE);
    return response;
  };

  if (!userId) {
    return finalize("sign-in-required");
  }

  const providerError = requestUrl.searchParams.get("error");
  if (providerError) {
    return finalize(providerError);
  }

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const codeVerifier = cookieStore.get(VERIFIER_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return finalize("state-mismatch");
  }

  try {
    const redirectUri = getQuranFoundationRedirectUri(requestUrl);
    const tokenSet = await exchangeQuranFoundationCode(code, codeVerifier, redirectUri);
    await storeQuranFoundationConnection({
      clerkUserId: userId,
      tokenSet,
      identity: decodeQuranFoundationIdentity(tokenSet.idToken),
    });
    return finalize("connected");
  } catch {
    return finalize("oauth-failed");
  }
}
