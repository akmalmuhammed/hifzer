import { NextResponse } from "next/server";
import { addZakatPayment, isWorshipStorageError, saveZakatPlan } from "@/hifzer/worship/server";
import {
  normalizeClientMutationId,
  normalizeCurrency,
  normalizeExpectedVersion,
  normalizeIsoDate,
  normalizeZakatPlanStatus,
  parseMoneyToMinor,
} from "@/hifzer/worship/validators";
import { resolveClerkUserIdForServer } from "@/hifzer/testing/request-auth";
import { isJsonMutation, isTrustedSameOriginMutation, PRIVATE_NO_STORE_HEADERS } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  amount?: unknown;
  currency?: unknown;
  dueDate?: unknown;
  status?: unknown;
  expectedVersion?: unknown;
};

type PaymentPayload = {
  planId?: unknown;
  amount?: unknown;
  paidOn?: unknown;
  clientMutationId?: unknown;
};

function privateJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { ...init, headers: PRIVATE_NO_STORE_HEADERS });
}

export async function PUT(request: Request) {
  if (!isTrustedSameOriginMutation(request)) {
    return privateJson({ error: "Cross-site updates are not allowed." }, { status: 403 });
  }
  if (!isJsonMutation(request)) {
    return privateJson({ error: "Expected an application/json request." }, { status: 415 });
  }

  const userId = await resolveClerkUserIdForServer(request);
  if (!userId) {
    return privateJson({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return privateJson({ error: "Invalid JSON body." }, { status: 400 });
  }

  const amountMinor = parseMoneyToMinor(payload.amount);
  const currency = normalizeCurrency(payload.currency);
  const dueDate = payload.dueDate === null || payload.dueDate === undefined ? null : normalizeIsoDate(payload.dueDate);
  const status = normalizeZakatPlanStatus(payload.status);
  const expectedVersion = payload.expectedVersion === undefined
    ? undefined
    : normalizeExpectedVersion(payload.expectedVersion);
  if (!amountMinor || !currency || !status || (payload.dueDate !== null && payload.dueDate !== undefined && !dueDate) || (payload.expectedVersion !== undefined && expectedVersion === null)) {
    return privateJson({ error: "Invalid private Zakat plan." }, { status: 400 });
  }

  try {
    const snapshot = await saveZakatPlan({
      clerkUserId: userId,
      amountMinor,
      currency,
      dueDate,
      status,
      expectedVersion,
    });
    return privateJson({ ok: true, snapshot });
  } catch (error) {
    if (isWorshipStorageError(error)) {
      return privateJson({ error: error.message, code: error.code }, { status: error.status });
    }
    return privateJson({ error: "Private Zakat plan could not be saved." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isTrustedSameOriginMutation(request)) {
    return privateJson({ error: "Cross-site updates are not allowed." }, { status: 403 });
  }
  if (!isJsonMutation(request)) {
    return privateJson({ error: "Expected an application/json request." }, { status: 415 });
  }

  const userId = await resolveClerkUserIdForServer(request);
  if (!userId) {
    return privateJson({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: PaymentPayload;
  try {
    payload = (await request.json()) as PaymentPayload;
  } catch {
    return privateJson({ error: "Invalid JSON body." }, { status: 400 });
  }

  const planId = typeof payload.planId === "string" && payload.planId.length >= 12 && payload.planId.length <= 128
    ? payload.planId
    : null;
  const amountMinor = parseMoneyToMinor(payload.amount);
  const paidOn = normalizeIsoDate(payload.paidOn);
  const clientMutationId = normalizeClientMutationId(payload.clientMutationId);
  if (!planId || !amountMinor || !paidOn || !clientMutationId) {
    return privateJson({ error: "Invalid private Zakat payment." }, { status: 400 });
  }

  try {
    const snapshot = await addZakatPayment({
      clerkUserId: userId,
      planId,
      amountMinor,
      paidOn,
      clientMutationId,
    });
    return privateJson({ ok: true, snapshot });
  } catch (error) {
    if (isWorshipStorageError(error)) {
      return privateJson({ error: error.message, code: error.code }, { status: error.status });
    }
    return privateJson({ error: "Private Zakat payment could not be saved." }, { status: 500 });
  }
}
