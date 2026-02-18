import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendRawEmail } from "@/lib/email/service.server";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null;
  if (!email) {
    return NextResponse.json({ error: "No email address found on your account." }, { status: 400 });
  }

  const result = await sendRawEmail({
    to: email,
    subject: "Hifzer test email",
    html: "<p>This is a test email from Hifzer.</p>",
    text: "This is a test email from Hifzer.",
    idempotencyKey: `hifzer:test:${userId}:${Date.now()}`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.errorMessage, code: result.errorCode }, { status: 500 });
  }
  return NextResponse.json({ ok: true, provider: result.provider, messageId: result.messageId });
}
