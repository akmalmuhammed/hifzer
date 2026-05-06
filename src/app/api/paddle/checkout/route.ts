import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateUserProfile } from "@/hifzer/profile/server";
import { appPublicUrl, paddleClient, paddleConfigured, paddleSupportCurrency } from "@/lib/paddle.server";

export const runtime = "nodejs";

function normalizeAmountToCents(value: unknown): { display: string; cents: string } | null {
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10000) {
    return null;
  }
  const normalized = parsed.toFixed(2);
  const cents = String(Math.round(parsed * 100));
  return { display: normalized, cents };
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getOrCreateUserProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  if (!paddleConfigured()) {
    return NextResponse.json({ error: "Paddle is not configured." }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as { amount?: unknown } | null;
  const normalizedAmount = normalizeAmountToCents(body?.amount);
  if (!normalizedAmount) {
    return NextResponse.json({ error: "Enter a valid amount between $1.00 and $10,000.00." }, { status: 400 });
  }

  let currencyCode: string;
  try {
    currencyCode = paddleSupportCurrency();
  } catch {
    return NextResponse.json({ error: "Paddle is not configured." }, { status: 500 });
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    null;

  try {
    const transaction = await paddleClient().transactions.create({
      currencyCode: currencyCode as never,
      collectionMode: "automatic",
      checkout: {
        url: new URL("/support", appPublicUrl()).toString(),
      },
      customData: {
        clerk_user_id: userId,
        support_amount: normalizedAmount.display,
      },
      items: [
        {
          quantity: 1,
          price: {
            description: "One-time Hifzer software account and product assistance.",
            unitPrice: {
              amount: normalizedAmount.cents,
              currencyCode: currencyCode as never,
            },
            product: {
              name: "Hifzer One-Time Assistance",
              description: `One-time written assistance for Hifzer software account, billing, setup, or product questions. No subscription. Amount: ${currencyCode} ${normalizedAmount.display}.`,
              taxCategory: "standard",
            },
          },
        },
      ],
    });

    return NextResponse.json({
      transactionId: transaction.id,
      successUrl: new URL("/billing/thank-you", appPublicUrl()).toString(),
      customerEmail: email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Paddle transaction.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

