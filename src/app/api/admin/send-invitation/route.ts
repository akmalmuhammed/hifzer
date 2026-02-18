import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { emailConfig } from "@/lib/email/config.server";
import { sendRawEmail } from "@/lib/email/service.server";
import { invitationTemplate } from "@/lib/email/templates/invitation";

type Recipient = {
  email: string;
  firstName?: string | null;
};

type RequestBody = {
  recipients: Recipient[];
};

export async function POST(req: NextRequest) {
  // Secured with CRON_SECRET — same pattern as email-reminders job
  const authHeader = req.headers.get("authorization");
  const cfg = emailConfig();
  if (authHeader !== `Bearer ${cfg.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { recipients } = body;
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: "recipients must be a non-empty array" }, { status: 400 });
  }

  const results: Array<{ email: string; ok: boolean; messageId?: string | null; error?: string }> =
    [];

  for (const recipient of recipients) {
    const rendered = invitationTemplate({
      appUrl: cfg.appUrl,
      firstName: recipient.firstName ?? null,
    });
    const idempotencyKey = [
      "hifzer",
      "invite",
      recipient.email.toLowerCase().trim(),
      new Date().toISOString().slice(0, 10),
    ].join(":");

    const result = await sendRawEmail({
      to: recipient.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey,
    });

    if (result.ok) {
      results.push({ email: recipient.email, ok: true, messageId: result.messageId });
    } else {
      results.push({ email: recipient.email, ok: false, error: result.errorMessage });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({ sent, failed, results });
}
