import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeQuranFoundationCode,
  resolveQuranFoundationIdentity,
} from "@/hifzer/quran-foundation/oauth";
import {
  storeQuranFoundationConnection,
  updateQuranFoundationAccountSyncState,
} from "@/hifzer/quran-foundation/server";
import { getQuranFoundationProviderErrorMessage } from "@/hifzer/quran-foundation/feedback";
import { QuranFoundationError } from "@/hifzer/quran-foundation/types";

export const runtime = "nodejs";

const STATE_COOKIE = "hifzer_qf_oauth_state";
const VERIFIER_COOKIE = "hifzer_qf_oauth_verifier";
const NONCE_COOKIE = "hifzer_qf_oauth_nonce";
const RETURN_TO_COOKIE = "hifzer_qf_oauth_return_to";
const DEFAULT_RETURN_TO = "/settings/quran-foundation";

function sanitizeReturnTo(value: string | null | undefined) {
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
  const returnTo = sanitizeReturnTo(cookieStore.get(RETURN_TO_COOKIE)?.value);
  const { userId } = await auth();

  const finalize = (qf: string) => {
    const response = NextResponse.redirect(buildReturnUrl(requestUrl, returnTo, qf));
    clearCookie(response, STATE_COOKIE);
    clearCookie(response, VERIFIER_COOKIE);
    clearCookie(response, NONCE_COOKIE);
    clearCookie(response, RETURN_TO_COOKIE);
    return response;
  };

  if (!userId) {
    return finalize("sign-in-required");
  }

  const providerError = requestUrl.searchParams.get("error");
  const providerErrorDescription = requestUrl.searchParams.get("error_description");
  if (providerError) {
    await updateQuranFoundationAccountSyncState(userId, {
      status: "degraded",
      lastError: getQuranFoundationProviderErrorMessage(providerError, providerErrorDescription),
    });
    Sentry.captureException(
      new Error(`Quran Foundation OAuth provider returned ${providerError}${providerErrorDescription ? `: ${providerErrorDescription}` : ""}`),
      {
        tags: { route: "/api/quran-foundation/callback", provider: "quran-foundation", phase: "provider-error" },
        user: { id: userId },
      },
    );
    return finalize(providerError);
  }

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const codeVerifier = cookieStore.get(VERIFIER_COOKIE)?.value;
  const expectedNonce = cookieStore.get(NONCE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier || !expectedNonce) {
    Sentry.captureException(new Error("Quran Foundation OAuth callback state or nonce validation failed."), {
      tags: { route: "/api/quran-foundation/callback", provider: "quran-foundation", phase: "state-validation" },
      user: { id: userId },
    });
    return finalize("state-mismatch");
  }

  try {
    const tokenSet = await exchangeQuranFoundationCode(code, codeVerifier);
    const identity = await resolveQuranFoundationIdentity(tokenSet, { expectedNonce });
    await storeQuranFoundationConnection({
      clerkUserId: userId,
      tokenSet,
      identity,
    });
    return finalize("connected");
  } catch (error) {
    if (error instanceof QuranFoundationError && error.code === "qf_identity_already_linked") {
      return finalize("already-linked");
    }
    const expectedOAuthFailure =
      error instanceof QuranFoundationError &&
      (error.code === "invalid_grant" || error.code === "access_denied" || error.status === 400);
    if (!expectedOAuthFailure) {
      Sentry.captureException(error, {
        tags: { route: "/api/quran-foundation/callback", provider: "quran-foundation", phase: "token-exchange" },
        user: { id: userId },
      });
    }
    return finalize("oauth-failed");
  }
}
