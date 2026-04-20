import "server-only";

import type { Prisma, QuranFoundationAccount, UserProfile } from "@prisma/client";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { db, dbConfigured } from "@/lib/db";
import {
  hasQuranFoundationContentConfig,
  hasQuranFoundationUserFlowConfig,
  normalizeQuranFoundationScopes,
  getQuranFoundationConfig,
} from "./config";
import { decryptQuranFoundationSecret, encryptQuranFoundationSecret } from "./crypto";
import { humanizeQuranFoundationConnectionIssue } from "./feedback";
import {
  decodeQuranFoundationIdentity,
  refreshQuranFoundationToken,
  type QuranFoundationIdentity,
  type QuranFoundationTokenSet,
} from "./oauth";
import {
  QuranFoundationError,
  type QuranFoundationConnectionStatus,
} from "./types";

type AccountContext = {
  profile: UserProfile;
  account: QuranFoundationAccount | null;
  schemaReady: boolean;
};

type UserApiSession = {
  profile: UserProfile;
  account: QuranFoundationAccount;
  accessToken: string;
  refreshToken: string | null;
};

function looksLikeMissingQuranFoundationSchema(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("QuranFoundationAccount") ||
    message.includes("quranFoundationAccount") ||
    message.includes("P2021") ||
    message.includes("P2022") ||
    /column .* does not exist/i.test(message) ||
    /relation .* does not exist/i.test(message)
  );
}

function schemaUnavailableError(): QuranFoundationError {
  return new QuranFoundationError(
    "Quran.com linking is unavailable until the latest database migrations are applied.",
    {
      status: 503,
      code: "qf_schema_missing",
      retryable: false,
    },
  );
}

async function getAccountContext(clerkUserId: string): Promise<AccountContext | null> {
  if (!dbConfigured()) {
    return null;
  }
  const profile = await getOrCreateUserProfile(clerkUserId);
  if (!profile) {
    return null;
  }
  try {
    const account = await db().quranFoundationAccount.findUnique({
      where: { userId: profile.id },
    });
    return { profile, account, schemaReady: true };
  } catch (error) {
    if (looksLikeMissingQuranFoundationSchema(error)) {
      return { profile, account: null, schemaReady: false };
    }
    throw error;
  }
}

function looksExpired(accessTokenExpiresAt: Date | null | undefined): boolean {
  if (!accessTokenExpiresAt) {
    return false;
  }
  return accessTokenExpiresAt.getTime() <= Date.now() + 60_000;
}

async function updateAccount(userId: string, data: Prisma.QuranFoundationAccountUpdateInput) {
  try {
    await db().quranFoundationAccount.update({
      where: { userId },
      data,
    });
  } catch (error) {
    if (looksLikeMissingQuranFoundationSchema(error)) {
      throw schemaUnavailableError();
    }
    throw error;
  }
}

export async function storeQuranFoundationConnection(input: {
  clerkUserId: string;
  tokenSet: QuranFoundationTokenSet;
  identity?: QuranFoundationIdentity | null;
}) {
  const context = await getAccountContext(input.clerkUserId);
  if (!context) {
    throw new QuranFoundationError("Database not configured.", {
      status: 503,
      code: "db_unavailable",
    });
  }
  if (!context.schemaReady) {
    throw schemaUnavailableError();
  }

  const identity = input.identity ?? decodeQuranFoundationIdentity(input.tokenSet.idToken);
  if (identity.sub) {
    const linkedElsewhere = await db().quranFoundationAccount.findFirst({
      where: {
        quranFoundationUserId: identity.sub,
        userId: {
          not: context.profile.id,
        },
      },
      select: {
        userId: true,
      },
    });
    if (linkedElsewhere) {
      throw new QuranFoundationError(
        "This Quran.com account is already linked to another Hifzer account. Disconnect it there before linking here.",
        {
          status: 409,
          code: "qf_identity_already_linked",
          retryable: false,
        },
      );
    }
  }
  const refreshTokenCiphertext = input.tokenSet.refreshToken
    ? encryptQuranFoundationSecret(input.tokenSet.refreshToken)
    : null;

  try {
    await db().quranFoundationAccount.upsert({
      where: { userId: context.profile.id },
      create: {
        userId: context.profile.id,
        quranFoundationUserId: identity.sub,
        displayName: identity.name,
        email: identity.email,
        accessTokenCiphertext: encryptQuranFoundationSecret(input.tokenSet.accessToken),
        refreshTokenCiphertext,
        scopes: input.tokenSet.scopes,
        status: "connected",
        accessTokenExpiresAt: input.tokenSet.accessTokenExpiresAt,
        lastError: null,
      },
      update: {
        quranFoundationUserId: identity.sub,
        displayName: identity.name,
        email: identity.email,
        accessTokenCiphertext: encryptQuranFoundationSecret(input.tokenSet.accessToken),
        refreshTokenCiphertext: refreshTokenCiphertext ?? undefined,
        scopes: input.tokenSet.scopes,
        status: "connected",
        accessTokenExpiresAt: input.tokenSet.accessTokenExpiresAt,
        lastError: null,
      },
    });
  } catch (error) {
    if (looksLikeMissingQuranFoundationSchema(error)) {
      throw schemaUnavailableError();
    }
    throw error;
  }
}

export async function disconnectQuranFoundationConnection(clerkUserId: string) {
  const context = await getAccountContext(clerkUserId);
  if (!context?.account) {
    return;
  }
  if (!context.schemaReady) {
    throw schemaUnavailableError();
  }
  try {
    await db().quranFoundationAccount.delete({
      where: { userId: context.profile.id },
    });
  } catch (error) {
    if (looksLikeMissingQuranFoundationSchema(error)) {
      throw schemaUnavailableError();
    }
    throw error;
  }
}

export async function getQuranFoundationConnectionStatus(
  clerkUserId: string | null,
): Promise<QuranFoundationConnectionStatus> {
  const userApiReady = hasQuranFoundationUserFlowConfig();
  const contentApiReady = hasQuranFoundationContentConfig();

  if (!userApiReady) {
    return {
      available: false,
      state: "not_configured",
      detail: "Quran.com linking is not available right now.",
      userApiReady,
      contentApiReady,
      displayName: null,
      email: null,
      quranFoundationUserId: null,
      scopes: [],
      lastSyncedAt: null,
      lastError: null,
    };
  }

  if (!clerkUserId) {
    return {
      available: true,
      state: "disconnected",
      detail: "Sign in to connect Quran.com and bring in your reading place, bookmarks, and notes.",
      userApiReady,
      contentApiReady,
      displayName: null,
      email: null,
      quranFoundationUserId: null,
      scopes: [],
      lastSyncedAt: null,
      lastError: null,
    };
  }

  const context = await getAccountContext(clerkUserId);
  if (context && !context.schemaReady) {
    return {
      available: false,
      state: "not_configured",
      detail: "Quran.com linking is temporarily unavailable while Hifzer finishes an update.",
      userApiReady,
      contentApiReady,
      displayName: null,
      email: null,
      quranFoundationUserId: null,
      scopes: [],
      lastSyncedAt: null,
      lastError: null,
    };
  }
  if (!context?.account) {
    return {
      available: true,
      state: "disconnected",
      detail: "Connect Quran.com to bring in your reading place, bookmarks, notes, and official reader extras.",
      userApiReady,
      contentApiReady,
      displayName: null,
      email: null,
      quranFoundationUserId: null,
      scopes: [],
      lastSyncedAt: null,
      lastError: null,
    };
  }

  const expired = looksExpired(context.account.accessTokenExpiresAt);
  const degraded = context.account.status !== "connected" || (expired && !context.account.refreshTokenCiphertext);

  return {
    available: true,
    state: degraded ? "degraded" : "connected",
    detail: degraded
      ? humanizeQuranFoundationConnectionIssue(context.account.lastError) ??
        "Your Quran.com connection needs attention before syncing can continue."
      : contentApiReady
        ? "Your reading place, bookmarks, notes, and official reader extras are ready in Hifzer."
        : "Your reading place, bookmarks, and notes are ready in Hifzer.",
    userApiReady,
    contentApiReady,
    displayName: context.account.displayName,
    email: context.account.email,
    quranFoundationUserId: context.account.quranFoundationUserId,
    scopes: normalizeQuranFoundationScopes(context.account.scopes),
    lastSyncedAt: context.account.lastSyncedAt ? context.account.lastSyncedAt.toISOString() : null,
    lastError: context.account.lastError,
  };
}

async function refreshStoredAccountTokens(input: {
  context: AccountContext;
  refreshToken: string;
}): Promise<UserApiSession> {
  const tokenSet = await refreshQuranFoundationToken(input.refreshToken);
  const nextRefreshToken = tokenSet.refreshToken ?? input.refreshToken;

  await updateAccount(input.context.profile.id, {
    accessTokenCiphertext: encryptQuranFoundationSecret(tokenSet.accessToken),
    refreshTokenCiphertext: nextRefreshToken
      ? encryptQuranFoundationSecret(nextRefreshToken)
      : null,
    accessTokenExpiresAt: tokenSet.accessTokenExpiresAt,
    scopes: tokenSet.scopes,
    status: "connected",
    lastError: null,
  });

  let account: QuranFoundationAccount | null;
  try {
    account = await db().quranFoundationAccount.findUnique({
      where: { userId: input.context.profile.id },
    });
  } catch (error) {
    if (looksLikeMissingQuranFoundationSchema(error)) {
      throw schemaUnavailableError();
    }
    throw error;
  }
  if (!account) {
    throw new QuranFoundationError("Quran.com connection disappeared during token refresh.", {
      status: 409,
      code: "qf_account_missing",
    });
  }

  return {
    profile: input.context.profile,
    account,
    accessToken: tokenSet.accessToken,
    refreshToken: nextRefreshToken,
  };
}

export async function getQuranFoundationUserApiSession(
  clerkUserId: string,
  options?: { forceRefresh?: boolean },
): Promise<UserApiSession | null> {
  if (!hasQuranFoundationUserFlowConfig()) {
    return null;
  }

  const context = await getAccountContext(clerkUserId);
  if (!context?.account) {
    return null;
  }

  const accessToken = decryptQuranFoundationSecret(context.account.accessTokenCiphertext);
  const refreshToken = context.account.refreshTokenCiphertext
    ? decryptQuranFoundationSecret(context.account.refreshTokenCiphertext)
    : null;
  const shouldRefresh = options?.forceRefresh === true || looksExpired(context.account.accessTokenExpiresAt);

  if (!shouldRefresh) {
    return {
      profile: context.profile,
      account: context.account,
      accessToken,
      refreshToken,
    };
  }

  if (!refreshToken) {
    await updateAccount(context.profile.id, {
      status: "degraded",
      lastError: "The Quran.com access token expired and no refresh token is stored.",
    });
    return null;
  }

  try {
    return await refreshStoredAccountTokens({ context, refreshToken });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Could not refresh the Quran.com access token.";
    const message = humanizeQuranFoundationConnectionIssue(rawMessage) ?? rawMessage;
    await updateAccount(context.profile.id, {
      status: "degraded",
      lastError: message,
    });
    if (error instanceof QuranFoundationError && message !== error.message) {
      throw new QuranFoundationError(message, {
        status: error.status,
        code: error.code,
        retryable: error.retryable,
      });
    }
    throw error;
  }
}

type UserApiQueryValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>
  | null
  | undefined;

function buildUserApiUrl(path: string, query?: Record<string, UserApiQueryValue>) {
  const config = getQuranFoundationConfig();
  const url = new URL(path.replace(/^\//, ""), `${config.userApiBaseUrl.replace(/\/+$/, "")}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item === undefined || item === null || item === "") {
            continue;
          }
          url.searchParams.append(key, String(item));
        }
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

async function buildUserApiResponse<T>(
  session: UserApiSession,
  response: Response,
): Promise<{ data: T; payload: Record<string, unknown>; response: Response }> {
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const mutationAt = response.headers.get("X-Mutation-At");
  if (mutationAt) {
    await updateAccount(session.profile.id, {
      lastMutationAt: mutationAt,
    });
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload.message === "string" && payload.message) ||
      `Quran Foundation request failed (${response.status}).`;
    const code = payload && typeof payload.type === "string" ? payload.type : "qf_user_request_failed";
    if (response.status === 401 || response.status === 403) {
      await updateAccount(session.profile.id, {
        status: "degraded",
        lastError: message,
      });
    }
    throw new QuranFoundationError(message, {
      status: response.status,
      code,
      retryable: response.status >= 500 || response.status === 429,
    });
  }

  await updateAccount(session.profile.id, {
    status: "connected",
    lastError: null,
  });

  const data =
    payload && Object.prototype.hasOwnProperty.call(payload, "data")
      ? (payload.data as T)
      : (payload as T);

  return { data, payload: payload ?? {}, response };
}

export async function quranFoundationUserApiRequest<T>(
  clerkUserId: string,
  input: {
    path: string;
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    query?: Record<string, UserApiQueryValue>;
    body?: unknown;
    mutation?: boolean;
    headers?: Record<string, string | number | boolean | null | undefined>;
  },
): Promise<{ data: T; payload: Record<string, unknown>; response: Response }> {
  const config = getQuranFoundationConfig();
  if (!config.oauthClientId) {
    throw new QuranFoundationError("Quran Foundation OAuth client ID is not configured.", {
      status: 503,
      code: "qf_client_id_missing",
      retryable: false,
    });
  }

  const session = await getQuranFoundationUserApiSession(clerkUserId);
  if (!session) {
    throw new QuranFoundationError("Link your Quran.com account before using remote sync.", {
      status: 412,
      code: "qf_not_linked",
      retryable: false,
    });
  }

  const url = buildUserApiUrl(input.path, input.query);

  async function performRequest(activeSession: UserApiSession) {
    const headers = new Headers();
    headers.set("x-client-id", config.oauthClientId ?? "");
    headers.set("x-auth-token", activeSession.accessToken);
    for (const [key, value] of Object.entries(input.headers ?? {})) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      headers.set(key, String(value));
    }
    if (input.body !== undefined) {
      headers.set("content-type", "application/json");
    }
    if (input.mutation && activeSession.account.lastMutationAt) {
      headers.set("X-Mutation-At", activeSession.account.lastMutationAt);
    }
    return fetch(url, {
      method: input.method ?? "GET",
      headers,
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
      cache: "no-store",
    });
  }

  let response = await performRequest(session);
  if ((response.status === 401 || response.status === 403) && session.refreshToken) {
    const refreshed = await getQuranFoundationUserApiSession(clerkUserId, { forceRefresh: true });
    if (refreshed) {
      response = await performRequest(refreshed);
      return buildUserApiResponse<T>(refreshed, response);
    }
  }

  return buildUserApiResponse<T>(session, response);
}

export async function updateQuranFoundationAccountSyncState(
  clerkUserId: string,
  input: { lastSyncedAt?: Date | null; lastError?: string | null; status?: string | null },
) {
  const context = await getAccountContext(clerkUserId);
  if (!context?.account) {
    return;
  }
  await updateAccount(context.profile.id, {
    lastSyncedAt: input.lastSyncedAt ?? undefined,
    lastError: input.lastError === undefined ? undefined : input.lastError,
    status: input.status ?? undefined,
  });
}
